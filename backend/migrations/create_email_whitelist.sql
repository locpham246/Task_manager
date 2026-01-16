-- Migration: Create email_whitelist table for access control
-- This table stores approved email addresses that are allowed to access the system

CREATE TABLE IF NOT EXISTS email_whitelist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_email_whitelist_active ON email_whitelist(is_active);

-- Add some initial whitelist entries if needed
-- Example: INSERT INTO email_whitelist (email, notes) VALUES ('user@ductridn.edu.vn', 'Initial whitelist entry');
