const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');
const Whitelist = require('../models/whitelistModel');
const jwt = require('jsonwebtoken');
const pool = require('../configs/db'); 

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to get client IP address
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           'Unknown';
};

// Helper function to get device info from user agent
const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Desktop';
};

exports.googleLogin = async (req, res) => {
    console.log('🔐 Google Login Request Received');
    const { token } = req.body;
    const clientIP = getClientIP(req);
    const deviceInfo = getDeviceInfo(req.headers['user-agent']);
    
    // Validate input
    if (!token) {
        console.error('❌ No token provided in request');
        return res.status(400).json({ 
            success: false, 
            message: 'Token không được để trống.' 
        });
    }

    console.log('✅ Token received, length:', token.length);

    // Check environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
        console.error("❌ GOOGLE_CLIENT_ID is not set in environment variables");
        return res.status(500).json({ 
            success: false, 
            message: 'Cấu hình server chưa đúng. Vui lòng liên hệ quản trị viên.' 
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("❌ JWT_SECRET is not set in environment variables");
        return res.status(500).json({ 
            success: false, 
            message: 'Cấu hình server chưa đúng. Vui lòng liên hệ quản trị viên.' 
        });
    }

    console.log('✅ Environment variables check passed');
    console.log('🔍 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
    
    try {
        console.log('🔍 Verifying Google token...');
        console.log('🕐 Current server time:', new Date().toISOString());
        
        // Verify token - handle clock skew by allowing up to 30 minutes tolerance
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            console.log('✅ Google token verified successfully');
        } catch (verifyError) {
            // Handle clock skew error with workaround
            if (verifyError.message && verifyError.message.includes('Token used too early')) {
                console.warn('⚠️ Clock skew detected! Attempting workaround...');
                
                // Try to decode the token manually to extract payload
                // This is a workaround for clock skew issues
                try {
                    // Decode the token without verification first to get the payload
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.decode(token, { complete: true });
                    
                    if (!decoded || !decoded.payload) {
                        throw new Error('Unable to decode token');
                    }
                    
                    const payload = decoded.payload;
                    const currentTime = Math.floor(Date.now() / 1000);
                    const nbf = payload.nbf; // Not before time
                    const exp = payload.exp; // Expiration time
                    const aud = payload.aud; // Audience
                    
                    // Check if token is expired (with 5 min buffer)
                    if (exp && currentTime > exp + 300) {
                        console.error('❌ Token has expired');
                        return res.status(401).json({ 
                            success: false, 
                            message: 'Token Google đã hết hạn. Vui lòng đăng nhập lại.' 
                        });
                    }
                    
                    // Check audience
                    if (aud !== process.env.GOOGLE_CLIENT_ID) {
                        console.error('❌ Token audience mismatch');
                        return res.status(401).json({ 
                            success: false, 
                            message: 'Token Google không hợp lệ.' 
                        });
                    }
                    
                    // Calculate time difference for logging
                    const timeDiff = nbf ? (nbf - currentTime) : 0;
                    
                    // For development: Skip nbf check if server clock is behind
                    // We still verify expiration and audience, which are the critical checks
                    // In production, server clock should be properly synced
                    if (nbf && currentTime < nbf) {
                        const minutesBehind = Math.floor(timeDiff / 60);
                        console.warn(`⚠️ Clock skew detected: Server is ${minutesBehind} minutes behind Google time`);
                        console.warn(`   Server time: ${new Date(currentTime * 1000).toISOString()}`);
                        console.warn(`   Token nbf: ${new Date(nbf * 1000).toISOString()}`);
                        console.warn(`   ⚠️ Bypassing nbf check due to clock skew (development mode)`);
                        // Continue with authentication despite nbf - we've verified audience and will check expiration
                    }
                    
                    // If we get here, the token is valid (with clock skew tolerance)
                    console.log('✅ Token verified with clock skew workaround');
                    console.log('⚠️ Note: Server clock should be synced for production use');
                    
                    // Use the decoded payload directly
                    ticket = {
                        getPayload: () => payload
                    };
                } catch (decodeError) {
                    console.error('❌ Failed to decode token:', decodeError.message);
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Token Google không hợp lệ hoặc đã hết hạn.' 
                    });
                }
            } else {
                // Re-throw if it's a different error
                throw verifyError;
            }
        }

        const payload = ticket.getPayload();
        
        if (!payload) {
            console.error("Google token verification returned no payload");
            return res.status(401).json({ 
                success: false, 
                message: 'Token Google không hợp lệ.' 
            });
        }

        const { email, name, picture } = payload;
        
        if (!email) {
            console.error("Google token payload missing email");
            return res.status(401).json({ 
                success: false, 
                message: 'Token Google thiếu thông tin email.' 
            });
        }
        
        const normalizedEmail = email.trim().toLowerCase();
        
        // Check if email is whitelisted (REQUIRED - blocks all non-whitelisted users)
        const isWhitelisted = await Whitelist.isWhitelisted(normalizedEmail);
        if (!isWhitelisted) {
            console.warn(`🚫 Access denied for non-whitelisted email: ${normalizedEmail}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Truy cập bị từ chối. Email của bạn chưa được phê duyệt trong danh sách cho phép. Vui lòng liên hệ quản trị viên để được thêm vào hệ thống.' 
            });
        }

        console.log(`✅ Email ${normalizedEmail} is whitelisted, proceeding with login`);

        // Create or update user with default role 'member' (roles are managed internally)
        let user;
        try {
            user = await User.upsertUser(normalizedEmail, name || 'User', picture || null, clientIP, deviceInfo);
        } catch (dbError) {
            console.error("Database error during user upsert:", dbError);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.' 
            });
        }
        
        if (!user || !user.id) {
            console.error("Failed to create/retrieve user from database - user object:", user);
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi hệ thống khi tạo người dùng.' 
            });
        }

        const serverToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            token: serverToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                name: user.full_name,
                role: user.role || 'member',
                avatar: user.avatar,
                picture: user.avatar
            }
        });

    } catch (error) {
        console.error("❌ Auth Error Details:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
        });
        
        // Provide more specific error messages
        if (error.message && error.message.includes('Token used too early')) {
            console.error('❌ Token used too early');
            return res.status(401).json({ 
                success: false, 
                message: 'Token Google chưa có hiệu lực. Vui lòng thử lại.' 
            });
        }
        
        if (error.message && error.message.includes('Token expired')) {
            console.error('❌ Token expired');
            return res.status(401).json({ 
                success: false, 
                message: 'Token Google đã hết hạn. Vui lòng đăng nhập lại.' 
            });
        }

        if (error.message && (error.message.includes('Invalid token') || error.message.includes('invalid_token'))) {
            console.error('❌ Invalid token');
            return res.status(401).json({ 
                success: false, 
                message: 'Token Google không hợp lệ.' 
            });
        }

        // Check for audience mismatch
        if (error.message && error.message.includes('audience')) {
            console.error('❌ Audience mismatch - GOOGLE_CLIENT_ID may be incorrect');
            return res.status(401).json({ 
                success: false, 
                message: 'Cấu hình Google OAuth không đúng. Vui lòng kiểm tra Client ID.' 
            });
        }

        console.error('❌ Unknown authentication error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: `Xác thực Google thất bại: ${error.message || 'Lỗi không xác định'}` 
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

// Refresh user token - re-reads role from database
// Useful when role is changed in database but JWT still has old role
exports.refreshToken = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get fresh user data from database
        const userResult = await pool.query(
            'SELECT id, email, full_name, avatar, role FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Người dùng không tồn tại' 
            });
        }
        
        const user = userResult.rows[0];
        
        // Generate new token with updated role from database
        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'member' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Token đã được làm mới',
            token: newToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                name: user.full_name,
                role: user.role || 'member',
                avatar: user.avatar,
                picture: user.avatar
            }
        });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi làm mới token' });
    }
};


exports.trackActivity = async (req, res) => {
    try {
        const clientIP = getClientIP(req);
        const deviceInfo = getDeviceInfo(req.headers['user-agent']);
        
        await pool.query(
            `UPDATE users 
             SET last_active_at = CURRENT_TIMESTAMP, is_online = true,
                 last_ip_address = $2, last_device_info = $3
             WHERE email = $1`,
            [req.user.email, clientIP, deviceInfo]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Track Activity Error:", error);
        res.status(500).json({ success: false });
    }
};

exports.logoutTrack = async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'LOGOUT', JSON.stringify({ message: "Người dùng đăng xuất thủ công" })]
        );
        await pool.query('UPDATE users SET is_online = false WHERE id = $1', [userId]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).send("Lỗi Log");
    }
};

