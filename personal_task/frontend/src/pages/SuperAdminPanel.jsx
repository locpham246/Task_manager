import { useEffect, useState } from 'react';
import UserActivityTable from '../components/UserActivityTable';
import axios from 'axios';

const SuperAdminPanel = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/api/admin/activities');
      setActivities(res.data);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Bảng điều khiển Super Admin</h2>
      <div className="stats">
        <p>Tổng số người đang Online: {activities.filter(a => getStatus(a.last_active_at) === 'Online').length}</p>
      </div>
      <UserActivityTable users={activities} />
    </div>
  );
};