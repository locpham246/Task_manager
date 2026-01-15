import { getStatus } from '../utils/statusHelper';

const UserActivityTable = ({ users }) => (
  <table className="dt-table"> {/* Thêm class cho đẹp */}
    <thead>
      <tr>
        <th>Nhân viên</th>
        <th>Quyền</th>
        <th>Đăng nhập lúc</th>
        <th>Hoạt động cuối</th>
        <th>Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      {users.map(u => (
        <tr key={u.id}>
          <td>{u.email}</td>
          <td><strong>{u.role?.toUpperCase()}</strong></td>
          <td>{u.login_at ? new Date(u.login_at).toLocaleString() : '---'}</td>
          <td>{u.last_active_at ? new Date(u.last_active_at).toLocaleTimeString() : '---'}</td>
          <td style={{ color: getStatus(u.last_active_at) === 'Online' ? 'green' : 'gray', fontWeight: 'bold' }}>
             {getStatus(u.last_active_at)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default UserActivityTable; 