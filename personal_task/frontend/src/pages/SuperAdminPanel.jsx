import { useEffect, useState } from 'react';
import UserActivityTable from '../components/UserActivityTable';
import api from '../services/api';
import { getStatus } from '../utils/statusHelper'; 

const SuperAdminPanel = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/activities');
        setActivities(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Bảng điều khiển Super Admin</h2>
      <div className="stats">
        <p>Online: {activities.filter(a => getStatus(a.last_active_at) === 'Online').length}</p>
      </div>
      <UserActivityTable users={activities} />
    </div>
  );
};

export default SuperAdminPanel; 