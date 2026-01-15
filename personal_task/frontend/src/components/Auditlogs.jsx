import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        api.get('/admin/audit-logs').then(res => setLogs(res.data));
    }, []);

    return (
        <div className="content-card">
            <h3>Nhật ký hoạt động hệ thống</h3>
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
                            <td>{log.full_name}</td>
                            <td><strong>{log.action}</strong>: {log.details}</td>
                            <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};