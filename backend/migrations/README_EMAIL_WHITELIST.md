# Email Whitelist Migration Guide

## Overview
This migration creates the `email_whitelist` table to enforce access control. Only users whose emails are in the whitelist can access the system, even if they have the same domain (@ductridn.edu.vn).

## Migration Steps

### 1. Run the Migration SQL

Open pgAdmin4 or your PostgreSQL client and run:

```sql
-- Migration: Create email_whitelist table for access control
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
```

### 2. Add Initial Whitelist Entries

After running the migration, add emails that should have access:

```sql
-- Add your super admin email
INSERT INTO email_whitelist (email, notes) 
VALUES ('loc.pp@ductridn.edu.vn', 'Super Admin - Initial whitelist');

-- Add other approved emails
INSERT INTO email_whitelist (email, notes) 
VALUES ('user1@ductridn.edu.vn', 'Approved user');

-- Add more as needed...
```

### 3. Verify the Migration

Check that the table was created:

```sql
SELECT * FROM email_whitelist;
```

## Important Notes

⚠️ **CRITICAL**: After running this migration, **ONLY whitelisted emails can log in**. Make sure to add at least your own email before testing!

- Even users with @ductridn.edu.vn domain will be blocked if not whitelisted
- All new users are created with default role 'member'
- Roles are managed internally, not from Google OAuth
- SuperAdmin can manage the whitelist via API endpoints

## API Endpoints (SuperAdmin Only)

- `GET /api/admin/whitelist` - Get all whitelisted emails
- `POST /api/admin/whitelist` - Add email to whitelist
- `DELETE /api/admin/whitelist/:email` - Remove email from whitelist
- `PUT /api/admin/whitelist/:email` - Update whitelist entry

## Security

- All whitelist operations are logged in `audit_logs`
- Only SuperAdmin can manage the whitelist
- Email addresses are normalized (lowercase, trimmed) before checking
