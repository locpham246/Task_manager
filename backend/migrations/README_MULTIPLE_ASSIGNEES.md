# Multiple Assignees Migration Guide

## ✅ Database Migration Required

To enable multiple assignees per task, you need to run the migration SQL script.

### Quick Steps in pgAdmin4:

1. **Open pgAdmin4** and connect to your database
2. **Right-click your database** → **Query Tool**
3. **Copy and paste this SQL:**

```sql
-- Create task_assignees junction table
CREATE TABLE IF NOT EXISTS task_assignees (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);

-- Migrate existing data: Copy user_id from todos to task_assignees
INSERT INTO task_assignees (task_id, user_id, assigned_at)
SELECT id, user_id, created_at
FROM todos
WHERE user_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;
```

4. **Click Execute** (or press F5)

### What This Does:

- ✅ Creates `task_assignees` table for many-to-many relationship
- ✅ Creates indexes for better query performance
- ✅ Migrates existing tasks to maintain current assignees
- ✅ Maintains backward compatibility (keeps `user_id` in `todos` table)

### After Running Migration:

- Tasks can now be assigned to multiple people
- Frontend will show multi-select dropdown for assignees
- Multiple assignees will display in the task list
- All existing tasks keep their current assignee

---

## Features Enabled:

✅ **Multiple Assignees:** Assign tasks to multiple team members  
✅ **Backward Compatible:** Single assignee still works  
✅ **Member Visibility:** Members see all tasks they're assigned to  
✅ **Admin Features:** Admins can assign to multiple people  
✅ **Display:** Multiple avatars shown in task list
