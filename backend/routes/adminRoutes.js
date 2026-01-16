const express = require('express');
const router = express.Router();
const pool = require('../configs/db');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');
const Whitelist = require('../models/whitelistModel');

router.get('/audit-logs', protect, isSuperAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.full_name 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy log" });
    }
});

router.get('/activities', protect, isAdmin, async (req, res) => {
    try {
        // Check if columns exist
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('session_start', 'last_ip_address', 'last_device_info')
        `);
        
        const hasSessionStart = columnCheck.rows.some(r => r.column_name === 'session_start');
        const hasIP = columnCheck.rows.some(r => r.column_name === 'last_ip_address');
        const hasDevice = columnCheck.rows.some(r => r.column_name === 'last_device_info');
        
        let selectFields = 'id, email, role, last_active_at, (CASE WHEN last_active_at > NOW() - INTERVAL \'5 minutes\' THEN true ELSE false END) as is_online';
        if (hasSessionStart) selectFields += ', session_start';
        if (hasIP) selectFields += ', last_ip_address';
        if (hasDevice) selectFields += ', last_device_info';
        
        const result = await pool.query(`SELECT ${selectFields} FROM users`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách user" });
    }
});

// User Management - Admin and SuperAdmin can view users
// Get all users
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        // Check if columns exist
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('created_at', 'session_start', 'last_ip_address', 'last_device_info')
        `);
        
        const hasCreatedAt = columnCheck.rows.some(r => r.column_name === 'created_at');
        const hasSessionStart = columnCheck.rows.some(r => r.column_name === 'session_start');
        const hasIP = columnCheck.rows.some(r => r.column_name === 'last_ip_address');
        const hasDevice = columnCheck.rows.some(r => r.column_name === 'last_device_info');
        
        let selectFields = 'id, email, full_name, avatar, role, last_active_at, (CASE WHEN last_active_at > NOW() - INTERVAL \'5 minutes\' THEN true ELSE false END) as is_online';
        if (hasSessionStart) selectFields += ', session_start';
        if (hasIP) selectFields += ', last_ip_address';
        if (hasDevice) selectFields += ', last_device_info';
        if (hasCreatedAt) selectFields += ', created_at';
        
        const orderBy = hasCreatedAt ? 'created_at DESC' : 'id DESC';
        
        const query = `SELECT ${selectFields} FROM users ORDER BY ${orderBy}`;
        
        const result = await pool.query(query);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Get Users Error:", err);
        console.error("Error details:", err.stack);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi lấy danh sách user",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get user by ID
router.get('/users/:id', protect, isSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if created_at column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'created_at'
        `);
        const hasCreatedAt = columnCheck.rows.length > 0;
        
        const query = hasCreatedAt
            ? `SELECT id, email, full_name, avatar, role, last_active_at, is_online, created_at FROM users WHERE id = $1`
            : `SELECT id, email, full_name, avatar, role, last_active_at, is_online FROM users WHERE id = $1`;
        
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Get User Error:", err);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy thông tin user" });
    }
});

// Update user (role management) - Only SuperAdmin can change roles
router.put('/users/:id', protect, isSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        // Prevent self-demotion from super_admin
        if (parseInt(id) === currentUserId && role !== 'super_admin' && currentUserRole === 'super_admin') {
            return res.status(400).json({ 
                success: false, 
                message: "Bạn không thể tự thay đổi vai trò của chính mình" 
            });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        // Validate role
        const validRoles = ['member', 'admin', 'super_admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: "Vai trò không hợp lệ" 
            });
        }

        const oldRole = userCheck.rows[0].role;

        // Check if created_at column exists for RETURNING clause
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'created_at'
        `);
        const hasCreatedAt = columnCheck.rows.length > 0;
        
        const returningClause = hasCreatedAt
            ? 'id, email, full_name, role, last_active_at, created_at'
            : 'id, email, full_name, role, last_active_at';

        // Update user role
        const result = await pool.query(
            `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${returningClause}`,
            [role, id]
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [currentUserId, 'UPDATE_USER_ROLE', JSON.stringify({ 
                targetUserId: id,
                targetUserEmail: userCheck.rows[0].email,
                oldRole: oldRole,
                newRole: role
            })]
        );

        res.json({
            success: true,
            message: "Cập nhật vai trò thành công",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Update User Error:", err);
        res.status(500).json({ success: false, message: "Lỗi server khi cập nhật user" });
    }
});

// Get user profile (read-only) - accessible by the user themselves or SuperAdmin
router.get('/users/:id/profile', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        // Users can only view their own profile, SuperAdmin can view any profile
        if (parseInt(id) !== currentUserId && currentUserRole !== 'super_admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền xem profile này" 
            });
        }

        // Check if created_at column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'created_at'
        `);
        const hasCreatedAt = columnCheck.rows.length > 0;
        
        const query = hasCreatedAt
            ? `SELECT id, email, full_name, avatar, role, last_active_at, created_at FROM users WHERE id = $1`
            : `SELECT id, email, full_name, avatar, role, last_active_at FROM users WHERE id = $1`;
        
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }

        const user = result.rows[0];
        const responseData = {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            lastLogin: user.last_active_at
        };
        
        if (hasCreatedAt && user.created_at) {
            responseData.createdAt = user.created_at;
        }
        
        res.json({
            success: true,
            data: responseData
        });
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy profile" });
    }
});

// Invite user to collaborate (Admin/SuperAdmin only)
router.post('/invite-user', protect, isAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        const inviterId = req.user.id;
        const inviterRole = req.user.role;

        if (!email || !email.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Email là bắt buộc" 
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if email is from @ductridn.edu.vn domain
        if (!normalizedEmail.endsWith('@ductridn.edu.vn')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Chỉ có thể mời người dùng có email @ductridn.edu.vn' 
            });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [normalizedEmail]);
        
        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            // Log invitation attempt
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
                [inviterId, 'INVITE_USER', JSON.stringify({ 
                    invitedEmail: normalizedEmail,
                    invitedUserId: user.id,
                    status: 'already_exists',
                    message: 'Người dùng đã tồn tại trong hệ thống'
                })]
            );

            return res.json({
                success: true,
                message: 'Người dùng đã tồn tại trong hệ thống',
                data: {
                    email: user.email,
                    role: user.role,
                    exists: true
                }
            });
        }

        // Get inviter's name for email
        const inviterResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [inviterId]);
        const inviterName = inviterResult.rows[0]?.full_name || inviterResult.rows[0]?.email || 'Quản trị viên';
        
        // Send invitation email
        const emailService = require('../services/emailService');
        const systemUrl = process.env.SYSTEM_URL || 'http://localhost:5173';
        const emailResult = await emailService.sendInvitationEmail(
            normalizedEmail,
            inviterName,
            systemUrl
        );

        // Log invitation
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [inviterId, 'INVITE_USER', JSON.stringify({ 
                invitedEmail: normalizedEmail,
                status: 'invited',
                inviterRole: inviterRole,
                emailSent: emailResult.success,
                emailMessageId: emailResult.messageId,
                emailError: emailResult.error,
                message: 'Người dùng được mời tham gia hệ thống'
            })]
        );

        // Return response
        if (emailResult.success) {
            res.json({
                success: true,
                message: `Đã gửi lời mời đến ${normalizedEmail}. Người dùng sẽ nhận được email hướng dẫn đăng nhập.`,
                data: {
                    email: normalizedEmail,
                    invited: true,
                    emailSent: true
                }
            });
        } else {
            // Email failed but invitation is still logged
            res.json({
                success: true,
                message: `Đã ghi nhận lời mời cho ${normalizedEmail}, nhưng không thể gửi email. Người dùng vẫn có thể đăng nhập bằng Google OAuth với email này.`,
                data: {
                    email: normalizedEmail,
                    invited: true,
                    emailSent: false,
                    warning: 'Email service không khả dụng'
                }
            });
        }
    } catch (err) {
        console.error("Invite User Error:", err);
        res.status(500).json({ success: false, message: "Lỗi server khi mời người dùng" });
    }
});

// ==================== EMAIL WHITELIST MANAGEMENT ====================
// Only SuperAdmin can manage the whitelist

// Get all whitelisted emails
router.get('/whitelist', protect, isSuperAdmin, async (req, res) => {
    try {
        const whitelist = await Whitelist.getAll();
        res.json({
            success: true,
            data: whitelist
        });
    } catch (err) {
        console.error("Get Whitelist Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi lấy danh sách whitelist" 
        });
    }
});

// Add email to whitelist
router.post('/whitelist', protect, isSuperAdmin, async (req, res) => {
    try {
        const { email, notes } = req.body;
        
        if (!email || !email.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Email không được để trống" 
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const addedBy = req.user.id;

        const whitelistEntry = await Whitelist.addEmail(normalizedEmail, addedBy, notes);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [addedBy, 'ADD_WHITELIST', JSON.stringify({ 
                email: normalizedEmail,
                notes: notes || null
            })]
        );

        res.json({
            success: true,
            message: "Đã thêm email vào whitelist",
            data: whitelistEntry
        });
    } catch (err) {
        console.error("Add Whitelist Error:", err);
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ 
                success: false, 
                message: "Email này đã có trong whitelist" 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi thêm email vào whitelist" 
        });
    }
});

// Remove email from whitelist (deactivate)
router.delete('/whitelist/:email', protect, isSuperAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const normalizedEmail = decodeURIComponent(email).trim().toLowerCase();

        const removed = await Whitelist.removeEmail(normalizedEmail);

        if (!removed) {
            return res.status(404).json({ 
                success: false, 
                message: "Email không tồn tại trong whitelist" 
            });
        }

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'REMOVE_WHITELIST', JSON.stringify({ 
                email: normalizedEmail
            })]
        );

        res.json({
            success: true,
            message: "Đã xóa email khỏi whitelist",
            data: removed
        });
    } catch (err) {
        console.error("Remove Whitelist Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi xóa email khỏi whitelist" 
        });
    }
});

// Update whitelist entry
router.put('/whitelist/:email', protect, isSuperAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const { notes, is_active } = req.body;
        const normalizedEmail = decodeURIComponent(email).trim().toLowerCase();

        const updates = {};
        if (notes !== undefined) updates.notes = notes;
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Không có trường nào để cập nhật" 
            });
        }

        const updated = await Whitelist.updateEmail(normalizedEmail, updates);

        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                message: "Email không tồn tại trong whitelist" 
            });
        }

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'UPDATE_WHITELIST', JSON.stringify({ 
                email: normalizedEmail,
                updates: updates
            })]
        );

        res.json({
            success: true,
            message: "Đã cập nhật whitelist",
            data: updated
        });
    } catch (err) {
        console.error("Update Whitelist Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi cập nhật whitelist" 
        });
    }
});

module.exports = router;