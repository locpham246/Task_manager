const pool = require('../configs/db');

exports.getAllTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, assignee } = req.query;
        const offset = (page - 1) * limit;
        let query;
        let values = [];
        let conditions = [];

        if (req.user.role === 'member') {
            // Members can see tasks assigned to them (either as primary user_id or in task_assignees)
            // Check if task_assignees table exists
            let memberQuery = '';
            try {
                const tableCheck = await pool.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = 'task_assignees'
                `);
                
                if (tableCheck.rows.length > 0) {
                    // Use task_assignees table for members
                    memberQuery = `
                        SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, 
                               t.user_id, t.due_date,
                               t.created_at, t.updated_at,
                               u.full_name as owner_name, u.avatar as owner_avatar
                        FROM todos t 
                        LEFT JOIN users u ON t.user_id = u.id
                        LEFT JOIN task_assignees ta ON t.id = ta.task_id
                        WHERE (t.user_id = $1 OR ta.user_id = $1)`;
                } else {
                    // Fallback: only check user_id if table doesn't exist
                    memberQuery = `
                        SELECT t.id, t.title, t.description, t.status, t.priority, 
                               t.user_id, t.due_date,
                               t.created_at, t.updated_at,
                               u.full_name as owner_name, u.avatar as owner_avatar
                        FROM todos t 
                        LEFT JOIN users u ON t.user_id = u.id
                        WHERE t.user_id = $1`;
                }
            } catch (error) {
                // Fallback query
                memberQuery = `
                    SELECT t.id, t.title, t.description, t.status, t.priority, 
                           t.user_id, t.due_date,
                           t.created_at, t.updated_at,
                           u.full_name as owner_name, u.avatar as owner_avatar
                    FROM todos t 
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.user_id = $1`;
            }
            
            query = memberQuery;
            values = [req.user.id];
            
            if (status) {
                conditions.push(`t.status = $${values.length + 1}`);
                values.push(status);
            }
            if (priority) {
                conditions.push(`t.priority = $${values.length + 1}`);
                values.push(priority);
            }
        } else {
            // Admin and SuperAdmin can see all tasks
            // Try to include documentation_links, but handle if column doesn't exist
            query = `
                SELECT t.id, t.title, t.description, t.status, t.priority,
                       t.user_id, t.due_date,
                       t.created_at, t.updated_at,
                       u.full_name as owner_name, u.email as owner_email, u.avatar as owner_avatar
                FROM todos t 
                LEFT JOIN users u ON t.user_id = u.id
                WHERE 1=1`;
            
            if (status) {
                conditions.push(`t.status = $${values.length + 1}`);
                values.push(status);
            }
            if (priority) {
                conditions.push(`t.priority = $${values.length + 1}`);
                values.push(priority);
            }
            if (assignee) {
                // Filter by assignee: check both primary user_id and task_assignees
                const assigneeId = parseInt(assignee);
                try {
                    // Try to use task_assignees table if it exists
                    const tableCheck = await pool.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_name = 'task_assignees'
                    `);
                    
                    if (tableCheck.rows.length > 0) {
                        // Use task_assignees if available
                        conditions.push(`(t.user_id = $${values.length + 1} OR EXISTS (
                            SELECT 1 FROM task_assignees ta 
                            WHERE ta.task_id = t.id AND ta.user_id = $${values.length + 1}
                        ))`);
                    } else {
                        // Fallback to user_id only
                        conditions.push(`t.user_id = $${values.length + 1}`);
                    }
                } catch (error) {
                    // Fallback
                    conditions.push(`t.user_id = $${values.length + 1}`);
                }
                values.push(assigneeId);
            }
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ` ORDER BY t.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(parseInt(limit), offset);

        let result = await pool.query(query, values);
        
        // Try to add documentation_links and assignees if columns/tables exist
        const taskIds = result.rows.map(t => t.id);
        
        if (taskIds.length > 0) {
            try {
                // Check if task_assignees table exists and fetch assignees
                const assigneesCheck = await pool.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = 'task_assignees'
                `);
                
                if (assigneesCheck.rows.length > 0) {
                    // Fetch all assignees for these tasks
                    const assigneesQuery = `
                        SELECT ta.task_id, ta.user_id, 
                               u.full_name, u.email, u.avatar
                        FROM task_assignees ta
                        JOIN users u ON ta.user_id = u.id
                        WHERE ta.task_id = ANY($1::int[])
                        ORDER BY ta.assigned_at
                    `;
                    const assigneesResult = await pool.query(assigneesQuery, [taskIds]);
                    
                    // Group assignees by task_id
                    const assigneesMap = {};
                    assigneesResult.rows.forEach(row => {
                        if (!assigneesMap[row.task_id]) {
                            assigneesMap[row.task_id] = [];
                        }
                        assigneesMap[row.task_id].push({
                            id: row.user_id,
                            email: row.email,
                            full_name: row.full_name,
                            avatar: row.avatar
                        });
                    });
                    
                    // Add assignees to each task
                    result.rows = result.rows.map(row => ({
                        ...row,
                        assignees: assigneesMap[row.id] || []
                    }));
                } else {
                    // Table doesn't exist, create assignees array from user_id (backward compat)
                    result.rows = result.rows.map(row => ({
                        ...row,
                        assignees: row.user_id ? [{
                            id: row.user_id,
                            email: row.owner_email,
                            full_name: row.owner_name,
                            avatar: row.owner_avatar
                        }] : []
                    }));
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch assignees:', error.message);
                // Fallback: use primary assignee
                result.rows = result.rows.map(row => ({
                    ...row,
                    assignees: row.user_id ? [{
                        id: row.user_id,
                        email: row.owner_email || '',
                        full_name: row.owner_name || '',
                        avatar: row.owner_avatar || null
                    }] : []
                }));
            }
            
            // Try to add documentation_links
            try {
                const checkColumnQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'todos' AND column_name = 'documentation_links'
                `;
                const columnCheck = await pool.query(checkColumnQuery);
                
                if (columnCheck.rows.length > 0) {
                    const docLinksQuery = `SELECT id, documentation_links FROM todos WHERE id = ANY($1::int[])`;
                    const docLinksResult = await pool.query(docLinksQuery, [taskIds]);
                    const docLinksMap = {};
                    docLinksResult.rows.forEach(row => {
                        docLinksMap[row.id] = row.documentation_links || [];
                    });
                    result.rows = result.rows.map(row => ({
                        ...row,
                        documentation_links: docLinksMap[row.id] || []
                    }));
                } else {
                    result.rows = result.rows.map(row => ({
                        ...row,
                        documentation_links: []
                    }));
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch documentation_links:', error.message);
                result.rows = result.rows.map(row => ({
                    ...row,
                    documentation_links: []
                }));
            }
        } else {
            // No tasks, add empty arrays
            result.rows = result.rows.map(row => ({
                ...row,
                assignees: [],
                documentation_links: []
            }));
        }
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách task" });
    }
};

// Create Task - Admin/SuperAdmin only (Members can create personal tasks optionally)
exports.createTask = async (req, res) => {
    try {
        const { title, description, status = 'pending', priority, assignee, assignees, dueDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Tiêu đề task là bắt buộc" });
        }

        // Handle assignees: Support both single assignee (backward compat) and multiple assignees
        let assigneeIds = [];
        if (userRole === 'admin' || userRole === 'super_admin') {
            if (assignees && Array.isArray(assignees) && assignees.length > 0) {
                // Multiple assignees
                const assigneeIdsNumeric = assignees.map(a => parseInt(a)).filter(id => !isNaN(id));
                if (assigneeIdsNumeric.length === 0) {
                    assigneeIds = [userId]; // Default to creator if invalid
                } else {
                    // Verify all assignees exist
                    const placeholders = assigneeIdsNumeric.map((_, i) => `$${i + 1}`).join(',');
                    const assigneeCheck = await pool.query(
                        `SELECT id FROM users WHERE id IN (${placeholders})`,
                        assigneeIdsNumeric
                    );
                    if (assigneeCheck.rows.length !== assigneeIdsNumeric.length) {
                        return res.status(400).json({ success: false, message: "Một hoặc nhiều người được giao việc không tồn tại" });
                    }
                    assigneeIds = assigneeIdsNumeric;
                }
            } else if (assignee) {
                // Single assignee (backward compatibility)
                const assigneeCheck = await pool.query('SELECT id FROM users WHERE id = $1', [assignee]);
                if (assigneeCheck.rows.length === 0) {
                    return res.status(400).json({ success: false, message: "Người được giao việc không tồn tại" });
                }
                assigneeIds = [parseInt(assignee)];
            } else {
                assigneeIds = [userId]; // Default to creator
            }
        } else {
            // Members always assign to themselves
            assigneeIds = [userId];
        }

        // Use first assignee as primary user_id for backward compatibility
        const primaryAssigneeId = assigneeIds[0] || userId;

        // Validate status - matching database schema (pending, in_progress, done)
        const validStatuses = ['pending', 'in_progress', 'done'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        // Validate priority if provided
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({ success: false, message: "Mức độ ưu tiên không hợp lệ" });
        }

        // Handle documentation links - validate Google Docs links only
        const { documentationLinks } = req.body;
        let docLinksJson = null;
        if (documentationLinks && Array.isArray(documentationLinks)) {
            const validLinks = documentationLinks.filter(link => {
                if (!link || !link.trim()) return false;
                try {
                    const url = new URL(link.trim());
                    // Only allow Google Docs links
                    const isGoogleDocs = url.hostname === 'docs.google.com' && 
                        (url.pathname.includes('/document/') || 
                         url.pathname.includes('/spreadsheets/') || 
                         url.pathname.includes('/presentation/') ||
                         url.pathname.includes('/forms/'));
                    return isGoogleDocs;
                } catch (e) {
                    return false;
                }
            });
            
            if (documentationLinks.length > 0 && validLinks.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Vui lòng chỉ nhập link Google Docs (Document, Spreadsheet, Presentation, hoặc Form)" 
                });
            }
            
            docLinksJson = JSON.stringify(validLinks);
        }

        // Insert task with documentation links (stored as JSONB)
        // Handle case where documentation_links column might not exist
        let result;
        try {
            result = await pool.query(
                `INSERT INTO todos (title, description, status, priority, user_id, due_date, documentation_links)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
                 RETURNING *`,
                [title.trim(), description?.trim() || null, status, priority || 'medium', primaryAssigneeId, dueDate || null, docLinksJson]
            );
        } catch (error) {
            // If column doesn't exist, insert without documentation_links
            if (error.message && error.message.includes('documentation_links')) {
                result = await pool.query(
                    `INSERT INTO todos (title, description, status, priority, user_id, due_date)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING *`,
                    [title.trim(), description?.trim() || null, status, priority || 'medium', primaryAssigneeId, dueDate || null]
                );
            } else {
                throw error;
            }
        }

        const newTask = result.rows[0];

        // Insert multiple assignees into task_assignees table
        try {
            for (const assigneeId of assigneeIds) {
                await pool.query(
                    'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT (task_id, user_id) DO NOTHING',
                    [newTask.id, assigneeId]
                );
            }
        } catch (error) {
            // If task_assignees table doesn't exist yet, log warning but continue
            console.warn('⚠️ task_assignees table not found. Please run migration:', error.message);
        }

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'CREATE_TASK', JSON.stringify({ 
                taskId: newTask.id, 
                taskTitle: newTask.title,
                assigneeIds: assigneeIds
            })]
        );

        res.status(201).json({
            success: true,
            message: "Tạo task thành công",
            data: newTask
        });
    } catch (error) {
        console.error("Create Task Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo task" });
    }
};

// Update Task - Members can only update their own tasks' status, Admins can update any task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, assignee, assignees, dueDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if task exists
        const taskCheck = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Task không tồn tại" });
        }

        const task = taskCheck.rows[0];

        // Authorization check
        if (userRole === 'member') {
            // Members can only update tasks assigned to them (check both user_id and task_assignees)
            let isAssigned = task.user_id === userId;
            
            if (!isAssigned) {
                try {
                    const tableCheck = await pool.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_name = 'task_assignees'
                    `);
                    
                    if (tableCheck.rows.length > 0) {
                        const assigneeCheck = await pool.query(
                            'SELECT 1 FROM task_assignees WHERE task_id = $1 AND user_id = $2',
                            [id, userId]
                        );
                        isAssigned = assigneeCheck.rows.length > 0;
                    }
                } catch (error) {
                    // Fallback: only check user_id
                    isAssigned = task.user_id === userId;
                }
            }
            
            if (!isAssigned) {
                return res.status(403).json({ success: false, message: "Bạn chỉ có thể cập nhật task được giao cho mình" });
            }
            // Members can only update status and add comments (description)
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (status !== undefined) {
                const validStatuses = ['pending', 'in_progress', 'done'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
                }
                updates.push(`status = $${paramCount++}`);
                values.push(status);
            }

            if (description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(description?.trim() || null);
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: "Không có thay đổi nào" });
            }

            values.push(id);
            const query = `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
            const result = await pool.query(query, values);

            // Log audit
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [userId, 'UPDATE_TASK', JSON.stringify({ 
                    taskId: id, 
                    taskTitle: task.title,
                    changes: { status, description }
                })]
            );

            return res.json({
                success: true,
                message: "Cập nhật task thành công",
                data: result.rows[0]
            });
        } else {
            // Admin and SuperAdmin can update any field
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (title !== undefined) {
                if (!title.trim()) {
                    return res.status(400).json({ success: false, message: "Tiêu đề không được để trống" });
                }
                updates.push(`title = $${paramCount++}`);
                values.push(title.trim());
            }

            if (description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(description?.trim() || null);
            }

            if (status !== undefined) {
                const validStatuses = ['pending', 'in_progress', 'done'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
                }
                updates.push(`status = $${paramCount++}`);
                values.push(status);
            }

            if (priority !== undefined) {
                if (priority && !['low', 'medium', 'high'].includes(priority)) {
                    return res.status(400).json({ success: false, message: "Mức độ ưu tiên không hợp lệ" });
                }
                updates.push(`priority = $${paramCount++}`);
                values.push(priority || null);
            }

            // Handle assignees update (Admin/SuperAdmin only)
            let assigneeIdsToUpdate = null;
            if (assignees !== undefined && Array.isArray(assignees)) {
                if (assignees.length > 0) {
                    const assigneeIdsNumeric = assignees.map(a => parseInt(a)).filter(id => !isNaN(id));
                    if (assigneeIdsNumeric.length > 0) {
                        // Verify all assignees exist
                        const placeholders = assigneeIdsNumeric.map((_, i) => `$${i + 1}`).join(',');
                        const assigneeCheck = await pool.query(
                            `SELECT id FROM users WHERE id IN (${placeholders})`,
                            assigneeIdsNumeric
                        );
                        if (assigneeCheck.rows.length !== assigneeIdsNumeric.length) {
                            return res.status(400).json({ success: false, message: "Một hoặc nhiều người được giao việc không tồn tại" });
                        }
                        assigneeIdsToUpdate = assigneeIdsNumeric;
                    } else {
                        assigneeIdsToUpdate = [task.user_id]; // Keep current primary assignee
                    }
                } else {
                    assigneeIdsToUpdate = [task.user_id]; // At least one assignee required
                }
            } else if (assignee !== undefined) {
                // Backward compatibility: single assignee
                if (assignee) {
                    const assigneeCheck = await pool.query('SELECT id FROM users WHERE id = $1', [assignee]);
                    if (assigneeCheck.rows.length === 0) {
                        return res.status(400).json({ success: false, message: "Người được giao việc không tồn tại" });
                    }
                    assigneeIdsToUpdate = [parseInt(assignee)];
                } else {
                    assigneeIdsToUpdate = [task.user_id];
                }
            }
            
            // Update primary user_id if assignees changed
            if (assigneeIdsToUpdate !== null) {
                const primaryAssigneeId = assigneeIdsToUpdate[0] || task.user_id;
                updates.push(`user_id = $${paramCount++}`);
                values.push(primaryAssigneeId);
            }

            if (dueDate !== undefined) {
                updates.push(`due_date = $${paramCount++}`);
                values.push(dueDate || null);
            }

            // Handle documentation links - validate Google Docs links only
            const { documentationLinks } = req.body;
            if (documentationLinks !== undefined) {
                try {
                    let docLinksJson = null;
                    if (documentationLinks && Array.isArray(documentationLinks)) {
                        const validLinks = documentationLinks.filter(link => {
                            if (!link || !link.trim()) return false;
                            try {
                                const url = new URL(link.trim());
                                // Only allow Google Docs links
                                const isGoogleDocs = url.hostname === 'docs.google.com' && 
                                    (url.pathname.includes('/document/') || 
                                     url.pathname.includes('/spreadsheets/') || 
                                     url.pathname.includes('/presentation/') ||
                                     url.pathname.includes('/forms/'));
                                return isGoogleDocs;
                            } catch (e) {
                                return false;
                            }
                        });
                        
                        if (documentationLinks.length > 0 && validLinks.length === 0) {
                            return res.status(400).json({ 
                                success: false, 
                                message: "Vui lòng chỉ nhập link Google Docs (Document, Spreadsheet, Presentation, hoặc Form)" 
                            });
                        }
                        
                        docLinksJson = JSON.stringify(validLinks);
                    }
                    updates.push(`documentation_links = $${paramCount++}::jsonb`);
                    values.push(docLinksJson);
                } catch (error) {
                    // If column doesn't exist, skip documentation links update
                    console.warn('Documentation links column may not exist:', error.message);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: "Không có thay đổi nào" });
            }

            values.push(id);
            const query = `UPDATE todos SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
            const result = await pool.query(query, values);

            // Update task_assignees table if assignees changed
            if (assigneeIdsToUpdate !== null) {
                try {
                    // Check if task_assignees table exists
                    const tableCheck = await pool.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_name = 'task_assignees'
                    `);
                    
                    if (tableCheck.rows.length > 0) {
                        // Delete existing assignees
                        await pool.query('DELETE FROM task_assignees WHERE task_id = $1', [id]);
                        
                        // Insert new assignees
                        for (const assigneeId of assigneeIdsToUpdate) {
                            await pool.query(
                                'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT (task_id, user_id) DO NOTHING',
                                [id, assigneeId]
                            );
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Could not update task_assignees:', error.message);
                }
            }

            // Build changes object for audit log
            const changes = {};
            if (title !== undefined) changes.title = title;
            if (description !== undefined) changes.description = description;
            if (status !== undefined) changes.status = status;
            if (priority !== undefined) changes.priority = priority;
            if (assigneeIdsToUpdate !== null) changes.assignees = assigneeIdsToUpdate;
            if (dueDate !== undefined) changes.dueDate = dueDate;

            // Log audit
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [userId, 'UPDATE_TASK', JSON.stringify({ 
                    taskId: id, 
                    taskTitle: task.title,
                    changes: changes
                })]
            );

            return res.json({
                success: true,
                message: "Cập nhật task thành công",
                data: result.rows[0]
            });
        }
    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật task" });
    }
};

// Update Task Status (simplified endpoint for status-only updates)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validate status - matching database schema
        const validStatuses = ['pending', 'in_progress', 'done'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        // Check if task exists
        const taskCheck = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Task không tồn tại" });
        }

        const task = taskCheck.rows[0];

        // Authorization: Members can only update their own tasks
        if (userRole === 'member' && task.user_id !== userId) {
            return res.status(403).json({ success: false, message: "Bạn chỉ có thể cập nhật task của chính mình" });
        }

        // Update status
        const result = await pool.query(
            'UPDATE todos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'UPDATE_TASK_STATUS', JSON.stringify({ 
                taskId: id, 
                taskTitle: task.title,
                oldStatus: task.status,
                newStatus: status
            })]
        );

        res.json({
            success: true,
            message: "Cập nhật trạng thái thành công",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật trạng thái" });
    }
};

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // 1. Kiểm tra quyền xóa
        const checkRes = await pool.query('SELECT title, user_id FROM todos WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) return res.status(404).json({ message: "Task không tồn tại" });

        const task = checkRes.rows[0];
        // Only Admin and SuperAdmin can delete tasks
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ message: "Chỉ Admin và SuperAdmin mới có quyền xóa task" });
        }

        // 2. Thực hiện xóa trong một Transaction (nếu cần)
        await pool.query('DELETE FROM todos WHERE id = $1', [id]);

        // 3. Ghi Audit Log
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'DELETE_TASK', JSON.stringify({ 
                taskId: id, 
                taskTitle: task.title,
                deletedAt: new Date() 
            })]
        );

        res.json({ success: true, message: "Xóa task thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa" });
    }
};