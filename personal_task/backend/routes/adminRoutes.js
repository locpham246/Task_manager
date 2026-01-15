const express = require('express');
const router = express.Router();
const pool = require('../configs/db');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

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
        const result = await pool.query(`
            SELECT id, email, role, last_active_at, 
            (CASE WHEN last_active_at > NOW() - INTERVAL '5 minutes' THEN true ELSE false END) as is_online 
            FROM users
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách user" });
    }
});

module.exports = router;