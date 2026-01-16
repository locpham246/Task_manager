-- Migration: Add created_at column to users table if it doesn't exist
-- This ensures the users table matches the schema definition

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows that might have NULL created_at
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
