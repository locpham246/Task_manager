import { getStatus } from '../utils/statusHelper';

const UserActivityTable = ({ users }) => (
  <table>
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
          <td><strong>{u.role.toUpperCase()}</strong></td>
          <td>{new Date(u.login_at).toLocaleString()}</td>
          <td>{new Date(u.last_active_at).toLocaleTimeString()}</td>
          <td style={{ color: getStatus(u.last_active_at) === 'Online' ? 'green' : 'gray' }}>
             {getStatus(u.last_active_at)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);