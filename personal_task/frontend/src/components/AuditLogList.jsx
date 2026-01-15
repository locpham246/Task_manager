import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/TodoList.css';

const AuditLogList = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Đường dẫn chuẩn bây giờ là /admin/audit-logs (vì service/api đã có tiền tố /api)
                const res = await api.get('/admin/audit-logs'); 
                setLogs(res.data);
            } catch (err) {
                console.error("Không thể tải log", err);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="content-card">
            <div className="list-header">
                <h3><i className="fas fa-history"></i> Nhật ký hoạt động</h3>
            </div>
            <div className="table-responsive">
                <table className="dt-table">
                    <thead>
                        <tr>
                            <th>Nhân viên</th>
                            <th>Hành động</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td><strong>{log.full_name || 'Hệ thống'}</strong></td>
                                <td>
                                    <span className={`action-badge ${log.action}`}>
                                        {log.action}
                                    </span>
                                    <p className="log-detail-text" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                    </p>
                                </td>
                                <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogList;