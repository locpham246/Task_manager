import { useState } from 'react';
import { getStatus } from '../utils/statusHelper';
import { formatLoginTime, formatLastActivity, maskIP } from '../utils/timeHelper';

const UserActivityTable = ({ users }) => {
  const [expandedIPs, setExpandedIPs] = useState({});

  const toggleIP = (userId) => {
    setExpandedIPs(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <table className="dt-table">
      <thead>
        <tr>
          <th>Nhân viên</th>
          <th>Quyền</th>
          <th>Đăng nhập lúc</th>
          <th>Hoạt động cuối</th>
          <th>IP & Thiết bị</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => {
          const isIPExpanded = expandedIPs[u.id];
          const displayIP = u.last_ip_address ? (isIPExpanded ? u.last_ip_address : maskIP(u.last_ip_address)) : '---';
          
          return (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td><strong>{u.role?.toUpperCase()}</strong></td>
              <td>{u.session_start ? formatLoginTime(u.session_start) : '---'}</td>
              <td>{u.last_active_at ? formatLastActivity(u.last_active_at) : '---'}</td>
              <td>
                {u.last_ip_address ? (
                  <div className="ip-device-cell">
                    <span 
                      className="ip-display" 
                      onClick={() => toggleIP(u.id)}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      title="Click để xem/hide IP đầy đủ"
                    >
                      {displayIP}
                    </span>
                    {u.last_device_info && (
                      <span className="device-info"> • {u.last_device_info}</span>
                    )}
                  </div>
                ) : (
                  '---'
                )}
              </td>
              <td style={{ color: getStatus(u.last_active_at) === 'Online' ? 'green' : 'gray', fontWeight: 'bold' }}>
                {getStatus(u.last_active_at)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default UserActivityTable;
