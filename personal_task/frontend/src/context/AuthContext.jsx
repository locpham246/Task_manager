import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  const trackActivity = async () => {
    if (user) {
      console.log("Heartbeat sent for:", user.email);
    }
  };

  useEffect(() => {
    const interval = setInterval(trackActivity, 60000); 
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};