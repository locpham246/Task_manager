# ⚠️ IMPORTANT: Run Email Whitelist Migration

## Error You're Seeing

```
error: relation "email_whitelist" does not exist
```

This means the `email_whitelist` table hasn't been created in your database yet.

## Solution: Run the Migration

### Step 1: Open pgAdmin4

1. Open pgAdmin4
2. Connect to your PostgreSQL database
3. Navigate to your database (the one you're using for this project)

### Step 2: Open Query Tool

1. Right-click on your database
2. Select "Query Tool"
3. A new query window will open

### Step 3: Copy and Run the Migration SQL

Copy the entire SQL below and paste it into the Query Tool, then click "Execute" (F5):

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

### Step 4: Add Your Email to Whitelist

**⚠️ CRITICAL**: After creating the table, you MUST add your email to the whitelist, otherwise you won't be able to log in!

```sql
-- Add your super admin email
INSERT INTO email_whitelist (email, notes) 
VALUES ('loc.pp@ductridn.edu.vn', 'Super Admin - Initial whitelist');

-- Add other approved emails as needed
-- INSERT INTO email_whitelist (email, notes) 
-- VALUES ('user@ductridn.edu.vn', 'Approved user');
```

### Step 5: Verify

Check that the table was created and your email is in it:

```sql
SELECT * FROM email_whitelist;
```

You should see at least one row with your email.

### Step 6: Restart Backend Server

After running the migration:
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm start`

## What Happens After Migration

- ✅ Whitelist management interface will work
- ✅ Only whitelisted emails can log in
- ✅ Even same-domain users (@ductridn.edu.vn) will be blocked if not whitelisted
- ✅ All new users get default role 'member'

## Temporary Workaround (Not Recommended)

The backend has been updated to allow access if the table doesn't exist (for backward compatibility during migration). However, **you should run the migration as soon as possible** to enable proper access control.

---

**File Location**: `personal_task/backend/migrations/create_email_whitelist.sql`
