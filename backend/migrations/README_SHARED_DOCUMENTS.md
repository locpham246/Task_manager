# Shared Documents Migration Guide

## ✅ Database Migration Required

To enable document sharing between users, you need to run the migration SQL script.

### Quick Steps in pgAdmin4:

1. **Open pgAdmin4** and connect to your database
2. **Right-click your database** → **Query Tool**
3. **Copy and paste this SQL:**

```sql
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
```

4. **Click Execute** (or press F5)

### What This Does:

- ✅ Creates `shared_documents` table for storing document information
- ✅ Creates `document_shares` junction table for many-to-many sharing
- ✅ Creates indexes for better query performance
- ✅ Sets up foreign keys with CASCADE delete

### After Running Migration:

- All users (Admin, SuperAdmin, Member) can share documents
- Documents can be shared with multiple users
- Users can see documents they shared or documents shared with them
- Admin/SuperAdmin can see all documents

---

## Features Enabled:

✅ **Document Sharing:** All users can share documents with other members  
✅ **Multi-User Sharing:** Share one document with multiple people  
✅ **Access Control:** Users see documents they shared or received  
✅ **Admin Visibility:** Admin/SuperAdmin see all documents  
✅ **Delete Permission:** Only owner or Admin/SuperAdmin can delete
