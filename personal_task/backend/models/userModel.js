const pool = require('../configs/db');

const User = {
  upsertUser: async (email, name, picture) => {
    const query = `
      INSERT INTO users (email, full_name, avatar, last_active_at, is_online)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
      ON CONFLICT (email) 
      DO UPDATE SET 
        last_active_at = CURRENT_TIMESTAMP, 
        is_online = true 
      RETURNING *;
    `;
    const values = [email, name, picture];
    const res = await pool.query(query, values);
    return res.rows[0];
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