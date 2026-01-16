-- Migration: Add support for multiple assignees per task
-- This creates a junction table for many-to-many relationship between tasks and users

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
-- This ensures existing tasks keep their current assignee
-- Using ON CONFLICT to prevent errors if migration is run multiple times
INSERT INTO task_assignees (task_id, user_id, assigned_at)
SELECT id, user_id, created_at
FROM todos
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM task_assignees ta 
    WHERE ta.task_id = todos.id AND ta.user_id = todos.user_id
  )
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Note: We keep the user_id column in todos for backward compatibility
-- and to maintain the "primary" assignee concept if needed
-- The task_assignees table now handles multiple assignees
