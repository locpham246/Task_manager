-- Migration: Add IP address and device tracking to users table
-- This allows tracking user sessions with IP and device information

-- Add columns for IP and device tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip_address VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_device_info TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_start TIMESTAMP;

-- Update existing rows to set session_start to last_active_at if session_start is NULL
UPDATE users SET session_start = last_active_at WHERE session_start IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_session_start ON users(session_start);
CREATE INDEX IF NOT EXISTS idx_users_last_ip ON users(last_ip_address);
