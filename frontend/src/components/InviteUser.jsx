import React, { useState } from 'react';
import api from '../services/api';
import '../styles/InviteUser.css';

const InviteUser = ({ onInviteSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState(null);

    const handleInvite = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setMessage('Vui lòng nhập email');
            setMessageType('error');
            return;
        }

        if (!email.endsWith('@ductridn.edu.vn')) {
            setMessage('Chỉ có thể mời người dùng có email @ductridn.edu.vn');
            setMessageType('error');
            return;
        }

        try {
            setLoading(true);
            setMessage(null);
            const response = await api.post('/admin/invite-user', { email: email.trim() });
            
            setMessage(response.data.message);
            setMessageType('success');
            setEmail('');
            
            if (onInviteSuccess) {
                onInviteSuccess();
            }
        } catch (err) {
            setMessage(err.response?.data?.message || 'Không thể gửi lời mời');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="invite-user-card">
            <div className="invite-header">
                <h3><i className="fas fa-user-plus"></i> Mời người dùng tham gia</h3>
                <p>Mời thành viên mới vào hệ thống bằng email @ductridn.edu.vn</p>
            </div>
            
            <form onSubmit={handleInvite} className="invite-form">
                <div className="form-group">
                    <label>Email người dùng</label>
                    <div className="input-with-icon">
                        <i className="fas fa-envelope"></i>
                        <input
                            type="email"
                            placeholder="user@ductridn.edu.vn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                {message && (
                    <div className={`invite-message ${messageType}`}>
                        <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        {message}
                    </div>
                )}

                <button type="submit" className="invite-btn" disabled={loading}>
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Đang gửi...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-paper-plane"></i> Gửi lời mời
                        </>
                    )}
                </button>
            </form>

            <div className="invite-info">
                <p><i className="fas fa-info-circle"></i> Người dùng sẽ nhận được thông báo và có thể đăng nhập bằng Google OAuth với email này.</p>
            </div>
        </div>
    );
};

export default InviteUser;
