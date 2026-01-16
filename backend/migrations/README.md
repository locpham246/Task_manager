# Database Migrations

## How to Run Migrations in pgAdmin4

### Step 1: Open pgAdmin4
1. Launch pgAdmin4 application
2. Connect to your PostgreSQL server
3. Navigate to your database (the one specified in your `.env` file as `DB_NAME`)

### Step 2: Open Query Tool
1. Right-click on your database
2. Select **Query Tool** from the context menu
3. A new query editor window will open

### Step 3: Run the Migration
1. Open the file: `add_documentation_links.sql`
2. Copy the SQL commands from the file
3. Paste them into the Query Tool
4. Click the **Execute** button (or press F5)

### Step 4: Verify
Run this query to verify the column was added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'todos' AND column_name = 'documentation_links';
```

You should see:
- `column_name`: documentation_links
- `data_type`: jsonb

## Migration Files

### add_documentation_links.sql
Adds `documentation_links` JSONB column to the `todos` table for storing shared documentation URLs.

**What it does:**
- Adds `documentation_links` column (JSONB type)
- Sets default value to empty array `[]`
- Creates a GIN index for better query performance

**Safe to run multiple times:** Yes (uses `IF NOT EXISTS`)
