const pool = require('../configs/db');

// Get all shared documents (user can see documents they shared or documents shared with them)
exports.getSharedDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let query;
        let values;

        if (userRole === 'super_admin' || userRole === 'admin') {
            // Admin/SuperAdmin can see all documents
            query = `
                SELECT 
                    sd.id,
                    sd.title,
                    sd.description,
                    sd.document_url,
                    sd.created_at,
                    sd.updated_at,
                    u.id as shared_by_id,
                    u.full_name as shared_by_name,
                    u.email as shared_by_email,
                    u.avatar as shared_by_avatar,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ds.shared_with_user_id,
                                'full_name', u2.full_name,
                                'email', u2.email,
                                'avatar', u2.avatar
                            )
                        ) FILTER (WHERE ds.shared_with_user_id IS NOT NULL),
                        '[]'::json
                    ) as shared_with
                FROM shared_documents sd
                LEFT JOIN users u ON sd.shared_by = u.id
                LEFT JOIN document_shares ds ON sd.id = ds.document_id
                LEFT JOIN users u2 ON ds.shared_with_user_id = u2.id
                GROUP BY sd.id, u.id, u.full_name, u.email, u.avatar
                ORDER BY sd.created_at DESC
            `;
            values = [];
        } else {
            // Members can see documents they shared OR documents shared with them
            query = `
                SELECT DISTINCT
                    sd.id,
                    sd.title,
                    sd.description,
                    sd.document_url,
                    sd.created_at,
                    sd.updated_at,
                    u.id as shared_by_id,
                    u.full_name as shared_by_name,
                    u.email as shared_by_email,
                    u.avatar as shared_by_avatar,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ds.shared_with_user_id,
                                'full_name', u2.full_name,
                                'email', u2.email,
                                'avatar', u2.avatar
                            )
                        ) FILTER (WHERE ds.shared_with_user_id IS NOT NULL),
                        '[]'::json
                    ) as shared_with
                FROM shared_documents sd
                LEFT JOIN users u ON sd.shared_by = u.id
                LEFT JOIN document_shares ds ON sd.id = ds.document_id
                LEFT JOIN users u2 ON ds.shared_with_user_id = u2.id
                WHERE sd.shared_by = $1 OR ds.shared_with_user_id = $1
                GROUP BY sd.id, u.id, u.full_name, u.email, u.avatar
                ORDER BY sd.created_at DESC
            `;
            values = [userId];
        }

        const result = await pool.query(query, values);
        
        // Parse shared_with JSON arrays
        const documents = result.rows.map(row => ({
            ...row,
            shared_with: typeof row.shared_with === 'string' 
                ? JSON.parse(row.shared_with) 
                : row.shared_with
        }));

        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        console.error("Get Shared Documents Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách tài liệu" });
    }
};

// Create/Share a new document
exports.createSharedDocument = async (req, res) => {
    try {
        const { title, description, document_url, shared_with_user_ids } = req.body;
        const userId = req.user.id;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Tiêu đề tài liệu là bắt buộc" });
        }

        if (!document_url || !document_url.trim()) {
            return res.status(400).json({ success: false, message: "Link tài liệu là bắt buộc" });
        }

        // Validate URL format
        try {
            new URL(document_url);
        } catch (e) {
            return res.status(400).json({ success: false, message: "Link tài liệu không hợp lệ" });
        }

        // Insert document
        const docResult = await pool.query(
            `INSERT INTO shared_documents (title, description, document_url, shared_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [title.trim(), description?.trim() || null, document_url.trim(), userId]
        );

        const documentId = docResult.rows[0].id;

        // Share with users if provided
        if (shared_with_user_ids && Array.isArray(shared_with_user_ids) && shared_with_user_ids.length > 0) {
            const userIds = shared_with_user_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
            
            if (userIds.length > 0) {
                // Verify users exist
                const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
                const userCheck = await pool.query(
                    `SELECT id FROM users WHERE id IN (${placeholders})`,
                    userIds
                );

                if (userCheck.rows.length !== userIds.length) {
                    // Some users don't exist, but continue with valid ones
                    console.warn('Some users not found for document sharing');
                }

                // Insert shares
                for (const shareUserId of userIds) {
                    // Don't share with yourself
                    if (shareUserId !== userId) {
                        await pool.query(
                            'INSERT INTO document_shares (document_id, shared_with_user_id) VALUES ($1, $2) ON CONFLICT (document_id, shared_with_user_id) DO NOTHING',
                            [documentId, shareUserId]
                        );
                    }
                }
            }
        }

        // Log audit for traceability and compliance
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'SHARE_DOCUMENT', JSON.stringify({ 
                documentId: documentId,
                documentTitle: title,
                documentUrl: document_url,
                sharedWithCount: shared_with_user_ids?.length || 0,
                sharedWithUserIds: shared_with_user_ids || []
            })]
        );

        res.status(201).json({
            success: true,
            message: "Chia sẻ tài liệu thành công",
            data: docResult.rows[0]
        });
    } catch (error) {
        console.error("Create Shared Document Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi chia sẻ tài liệu" });
    }
};

// Update document sharing (add/remove users)
exports.updateDocumentShares = async (req, res) => {
    try {
        const { id } = req.params;
        const { shared_with_user_ids } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if document exists
        const docCheck = await pool.query('SELECT * FROM shared_documents WHERE id = $1', [id]);
        if (docCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Tài liệu không tồn tại" });
        }

        const document = docCheck.rows[0];

        // Permission check: Members can only manage their own shares, Admins/SuperAdmins have full control
        if (userRole === 'member') {
            // Members can only update documents they created
            if (document.shared_by !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Bạn chỉ có thể quản lý tài liệu do chính mình chia sẻ" 
                });
            }
        }
        // Admin and SuperAdmin can manage any document (no additional check needed)

        // Delete existing shares
        await pool.query('DELETE FROM document_shares WHERE document_id = $1', [id]);

        // Add new shares
        if (shared_with_user_ids && Array.isArray(shared_with_user_ids) && shared_with_user_ids.length > 0) {
            const userIds = shared_with_user_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
            
            for (const shareUserId of userIds) {
                // Don't share with yourself
                if (shareUserId !== userId) {
                    await pool.query(
                        'INSERT INTO document_shares (document_id, shared_with_user_id) VALUES ($1, $2) ON CONFLICT (document_id, shared_with_user_id) DO NOTHING',
                        [id, shareUserId]
                    );
                }
            }
        }

        // Log audit for traceability and compliance
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'UPDATE_DOCUMENT_SHARES', JSON.stringify({ 
                documentId: id,
                documentTitle: document.title,
                documentUrl: document.document_url,
                sharedWithCount: shared_with_user_ids?.length || 0,
                sharedWithUserIds: shared_with_user_ids || [],
                previousShares: document.shared_with || []
            })]
        );

        res.json({
            success: true,
            message: "Cập nhật chia sẻ tài liệu thành công"
        });
    } catch (error) {
        console.error("Update Document Shares Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật chia sẻ" });
    }
};

// Delete document
exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if document exists
        const docCheck = await pool.query('SELECT * FROM shared_documents WHERE id = $1', [id]);
        if (docCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Tài liệu không tồn tại" });
        }

        const document = docCheck.rows[0];

        // Permission check: Original files are protected from deletion by members
        if (userRole === 'member') {
            // Members can only delete documents they created
            if (document.shared_by !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Bạn chỉ có thể xóa tài liệu do chính mình chia sẻ. Tài liệu gốc được bảo vệ khỏi việc xóa bởi thành viên khác." 
                });
            }
        }
        // Admin and SuperAdmin have full control - can delete any document

        // Delete document (cascade will delete shares)
        await pool.query('DELETE FROM shared_documents WHERE id = $1', [id]);

        // Log audit for traceability and compliance
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'DELETE_DOCUMENT', JSON.stringify({ 
                documentId: id,
                documentTitle: document.title,
                documentUrl: document.document_url,
                deletedBy: userRole,
                originalOwnerId: document.shared_by
            })]
        );

        res.json({
            success: true,
            message: "Xóa tài liệu thành công"
        });
    } catch (error) {
        console.error("Delete Document Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa tài liệu" });
    }
};
