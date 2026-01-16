import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/TodoList.css';
import '../styles/AuditLogList.css';

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

    const formatActionDetails = (details) => {
        if (!details) return '';
        
        try {
            const parsed = typeof details === 'string' ? JSON.parse(details) : details;
            
            // Create a formatted list of key-value pairs
            const formattedParts = [];
            
            if (parsed.taskId || parsed.taskld) {
                formattedParts.push(`Task ID: ${parsed.taskId || parsed.taskld}`);
            }
            if (parsed.taskTitle) {
                formattedParts.push(`Tiêu đề: "${parsed.taskTitle}"`);
            }
            if (parsed.assigneeId || parsed.assigneeld) {
                formattedParts.push(`Người được giao: ID ${parsed.assigneeId || parsed.assigneeld}`);
            }
            if (parsed.deletedAt) {
                const date = new Date(parsed.deletedAt).toLocaleString('vi-VN');
                formattedParts.push(`Đã xóa lúc: ${date}`);
            }
            if (parsed.changes) {
                const changes = parsed.changes;
                const changeList = [];
                
                // Status translation
                const statusMap = {
                    'pending': 'Chờ xử lý',
                    'in_progress': 'Đang làm',
                    'done': 'Hoàn thành'
                };
                
                // Priority translation
                const priorityMap = {
                    'low': 'Thấp',
                    'medium': 'Trung bình',
                    'high': 'Cao'
                };
                
                if (changes.title) changeList.push(`Tiêu đề: "${changes.title}"`);
                if (changes.description) changeList.push(`Mô tả: "${changes.description}"`);
                if (changes.status) {
                    const statusText = statusMap[changes.status] || changes.status;
                    changeList.push(`Trạng thái: ${statusText}`);
                }
                if (changes.priority) {
                    const priorityText = priorityMap[changes.priority] || changes.priority;
                    changeList.push(`Ưu tiên: ${priorityText}`);
                }
                if (changes.dueDate) changeList.push(`Hạn chót: ${new Date(changes.dueDate).toLocaleDateString('vi-VN')}`);
                if (changes.assignee) changeList.push(`Người được giao: ID ${changes.assignee}`);
                if (changeList.length > 0) {
                    formattedParts.push(`Thay đổi: ${changeList.join(', ')}`);
                }
            }
            if (parsed.message) {
                formattedParts.push(parsed.message);
            }
            
            return formattedParts.join(' • ');
        } catch (e) {
            // If parsing fails, return as is
            return typeof details === 'string' ? details : JSON.stringify(details);
        }
    };

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
                                    {log.details && (
                                        <div className="log-detail-formatted">
                                            {formatActionDetails(log.details)}
                                        </div>
                                    )}
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