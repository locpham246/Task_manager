const pool = require('../configs/db');

exports.getAllTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        let query;
        let values = [];

        if (req.user.role === 'member') {
            query = `
                SELECT id, title, description, status, created_at, updated_at 
                FROM todos 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3`;
            values = [req.user.id, limit, offset];
        } else {
            query = `
                SELECT t.id, t.title, t.description, t.status, t.created_at, t.updated_at, 
                       u.full_name as owner_name, u.avatar as owner_avatar
                FROM todos t 
                LEFT JOIN users u ON t.user_id = u.id 
                ORDER BY t.created_at DESC 
                LIMIT $1 OFFSET $2`;
            values = [limit, offset];
        }

        const result = await pool.query(query, values);
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

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // 1. Kiểm tra quyền xóa
        const checkRes = await pool.query('SELECT title, user_id FROM todos WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) return res.status(404).json({ message: "Task không tồn tại" });

        const task = checkRes.rows[0];
        if (userRole !== 'admin' && userRole !== 'super_admin' && task.user_id !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền xóa task này" });
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