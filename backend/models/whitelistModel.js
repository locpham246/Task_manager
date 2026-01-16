const pool = require('../configs/db');

const Whitelist = {
  // Check if email is whitelisted
  isWhitelisted: async (email) => {
    try {
      // Check if table exists first
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'email_whitelist'
      `);
      
      if (tableCheck.rows.length === 0) {
        console.warn('⚠️ email_whitelist table does not exist. Allowing access (migration not run yet).');
        // If table doesn't exist, allow access (backward compatibility during migration)
        return true;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const query = `
        SELECT id, email, is_active 
        FROM email_whitelist 
        WHERE email = $1 AND is_active = true
      `;
      const res = await pool.query(query, [normalizedEmail]);
      return res.rows.length > 0;
    } catch (error) {
      if (error.code === '42P01') { // Table does not exist
        console.warn('⚠️ email_whitelist table does not exist. Allowing access (migration not run yet).');
        return true; // Allow access if table doesn't exist (backward compatibility)
      }
      throw error;
    }
  },

  // Get all whitelisted emails
  getAll: async () => {
    try {
      // Check if table exists first
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'email_whitelist'
      `);
      
      if (tableCheck.rows.length === 0) {
        console.warn('⚠️ email_whitelist table does not exist. Please run the migration.');
        return [];
      }

      const query = `
        SELECT w.*, u.email as added_by_email, u.full_name as added_by_name
        FROM email_whitelist w
        LEFT JOIN users u ON w.added_by = u.id
        ORDER BY w.added_at DESC
      `;
      const res = await pool.query(query);
      return res.rows;
    } catch (error) {
      if (error.code === '42P01') { // Table does not exist
        console.warn('⚠️ email_whitelist table does not exist. Please run the migration.');
        return [];
      }
      throw error;
    }
  },

  // Add email to whitelist
  addEmail: async (email, addedBy = null, notes = null) => {
    const normalizedEmail = email.trim().toLowerCase();
    const query = `
      INSERT INTO email_whitelist (email, added_by, notes, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) 
      DO UPDATE SET 
        is_active = true,
        added_by = COALESCE(EXCLUDED.added_by, $2),
        notes = COALESCE(EXCLUDED.notes, $3),
        added_at = CASE WHEN email_whitelist.is_active = false THEN CURRENT_TIMESTAMP ELSE email_whitelist.added_at END
      RETURNING *
    `;
    const res = await pool.query(query, [normalizedEmail, addedBy, notes]);
    return res.rows[0];
  },

  // Remove email from whitelist (soft delete by setting is_active = false)
  removeEmail: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const query = `
      UPDATE email_whitelist 
      SET is_active = false 
      WHERE email = $1
      RETURNING *
    `;
    const res = await pool.query(query, [normalizedEmail]);
    return res.rows[0];
  },

  // Permanently delete email from whitelist
  deleteEmail: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const query = 'DELETE FROM email_whitelist WHERE email = $1 RETURNING *';
    const res = await pool.query(query, [normalizedEmail]);
    return res.rows[0];
  },

  // Update whitelist entry
  updateEmail: async (email, updates) => {
    const normalizedEmail = email.trim().toLowerCase();
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.notes !== undefined) {
      setClause.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.is_active !== undefined) {
      setClause.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(normalizedEmail);
    const query = `
      UPDATE email_whitelist 
      SET ${setClause.join(', ')}
      WHERE email = $${paramIndex}
      RETURNING *
    `;
    const res = await pool.query(query, values);
    return res.rows[0];
  }
};

module.exports = Whitelist;
