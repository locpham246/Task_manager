-- Migration: Add shared documents feature
-- Allows all users (Admin, SuperAdmin, Member) to share documents with other members

-- Create shared_documents table
CREATE TABLE IF NOT EXISTS shared_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url TEXT NOT NULL,
    shared_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document_shares junction table (many-to-many: documents to users)
CREATE TABLE IF NOT EXISTS document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES shared_documents(id) ON DELETE CASCADE,
    shared_with_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, shared_with_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_documents_shared_by ON shared_documents(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user_id ON document_shares(shared_with_user_id);

-- Note: 
-- - shared_by: The user who created/shared the document
-- - document_shares: Links documents to users who can access them
-- - All users can create documents
-- - Documents can be shared with multiple users
