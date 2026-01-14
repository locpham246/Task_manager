const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const pool = require('../configs/db'); 

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, picture } = ticket.getPayload();
        if (!email.endsWith('@ductridn.edu.vn')) {
            return res.status(403).json({ 
                success: false, 
                message: 'Truy cập bị từ chối. Vui lòng sử dụng Email trường Đức Trí (@ductridn.edu.vn).' 
            });
        }

        const user = await User.upsertUser(email, name, picture);
        const serverToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            user, 
        });

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ 
            success: false, 
            message: 'Xác thực Google thất bại hoặc Token hết hạn.' 
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByEmail(req.user.email);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name, 
                role: user.role,
                picture: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};


exports.trackActivity = async (req, res) => {
    try {
        await pool.query(
            `UPDATE users 
             SET last_active_at = CURRENT_TIMESTAMP, is_online = true 
             WHERE email = $1`,
            [req.user.email]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Track Activity Error:", error);
        res.status(500).json({ success: false });
    }
};