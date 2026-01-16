-- Migration: Add documentation_links column to todos table
-- Run this SQL in your PostgreSQL database

-- Add documentation_links column as JSONB to store array of links
ALTER TABLE todos ADD COLUMN IF NOT EXISTS documentation_links JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_todos_documentation_links ON todos USING GIN (documentation_links);

-- Example of how data will be stored:
-- documentation_links: ["https://example.com/doc1", "https://example.com/doc2"]
