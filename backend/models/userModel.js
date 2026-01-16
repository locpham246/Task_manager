const pool = require('../configs/db');

const User = {
  upsertUser: async (email, name, picture, ipAddress = null, deviceInfo = null) => {
    // Fix type mismatch by explicitly casting email to VARCHAR in subquery
    // On login, set session_start to current time
    const query = `
      INSERT INTO users (email, full_name, avatar, role, last_active_at, is_online, session_start, last_ip_address, last_device_info)
      VALUES ($1::VARCHAR(255), $2, $3, COALESCE((SELECT role FROM users WHERE email = $1::VARCHAR(255)), 'member'), CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, $4, $5)
      ON CONFLICT (email) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        avatar = EXCLUDED.avatar,
        last_active_at = CURRENT_TIMESTAMP, 
        is_online = true,
        session_start = CURRENT_TIMESTAMP,
        last_ip_address = EXCLUDED.last_ip_address,
        last_device_info = EXCLUDED.last_device_info
      RETURNING *;`;
    const values = [email, name || null, picture || null, ipAddress, deviceInfo];
    try {
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (error) {
      console.error("Database error in upsertUser:", error);
      throw error;
    }
  },
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const res = await pool.query(query, [email]);
    return res.rows[0];
  },
  // Logout or tracking time
  setOffline: async (email) => {
    return await pool.query('UPDATE users SET is_online = false WHERE email = $1', [email]);
  }
};

module.exports = User;