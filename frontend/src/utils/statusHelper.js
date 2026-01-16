export const getStatus = (lastActiveAt) => {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const diffInMinutes = (now - lastActive) / 1000 / 60;

  if (diffInMinutes < 5) return 'Online'; 
  return 'Offline';
};