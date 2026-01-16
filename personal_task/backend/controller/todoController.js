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
    const client = await pool.connect(); 
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const checkRes = await client.query('SELECT user_id FROM todos WHERE id = $1', [id]);

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ message: "Task không tồn tại" });
        }

        const taskOwnerId = checkRes.rows[0].user_id;
        if (userRole !== 'admin' && userRole !== 'super_admin' && taskOwnerId !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền xóa task của người khác" });
        }

        await client.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json({ success: true, message: "Xóa task thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thực thi lệnh xóa" });
    } finally {
        client.release();
    }
};