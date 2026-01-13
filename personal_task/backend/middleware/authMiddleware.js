const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// TRẠM 1: Xác thực người dùng qua Token
exports.protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(" ")[1]; 
        
        if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByEmail(decoded.email); 
        if (!user) return res.status(401).json({ message: "User không tồn tại" });

        req.user = user; 
        next();
    } catch (error) {
        res.status(401).json({ message: "Token không hợp lệ" });
    }
};


exports.isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        return res.status(403).json({ message: "Từ chối: Bạn không có quyền Admin" });
    }
};