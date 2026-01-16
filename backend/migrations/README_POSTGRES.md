# PostgreSQL Migration Required

## ⚠️ Important: You need to run this migration for documentation links to work!

The application will work without the `documentation_links` column, but **documentation links will not be saved or displayed** until you add this column to your database.

## Quick Steps in pgAdmin4:

1. **Open pgAdmin4** and connect to your database
2. **Right-click your database** → **Query Tool**
3. **Copy and paste this SQL:**

```sql
ALTER TABLE todos ADD COLUMN IF NOT EXISTS documentation_links JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_todos_documentation_links ON todos USING GIN (documentation_links);
```

4. **Click Execute** (or press F5)

## What this does:

- Adds `documentation_links` column to store an array of URLs
- Creates an index for better query performance
- Sets default value to empty array `[]`

## After running the migration:

- Documentation links will be saved when creating/editing tasks
- Links will appear in the task table
- Links will be clickable and open in new tabs

## Current Status:

✅ **Application works without migration** (links just won't be saved)  
⚠️ **Run migration to enable documentation links feature**
