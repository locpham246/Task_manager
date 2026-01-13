const pool = require('../configs/db');

exports.getAllTasks = async (req, res) => {
    try {
        let query;
        let values = [];
        if (req.user.role === 'member') {
            query = 'SELECT * FROM todos WHERE user_id = $1';
            values = [req.user.id];
        } else {
            query = 'SELECT t.*, u.full_name as owner_name FROM todos t JOIN users u ON t.user_id = u.id';
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách task" });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa" });
    }
};