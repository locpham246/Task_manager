const jwt = require('jsonwebtoken');
exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Bạn chưa đăng nhập hoặc phiên làm việc không hợp lệ" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error("JWT Error:", error.message);
        return res.status(401).json({ message: "Phiên làm việc đã hết hạn, vui lòng đăng nhập lại" });
    }
};

exports.isAdmin = (req, res, next) => {
    const rolesAllowed = ['admin', 'super_admin'];
    if (req.user && rolesAllowed.includes(req.user.role)) {
        next();
    } else {
        return res.status(403).json({ message: "Truy cập bị từ chối: Cần quyền quản trị" });
    }
};

exports.isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({ message: "Thao tác này chỉ dành cho Super Admin" });
    }
};