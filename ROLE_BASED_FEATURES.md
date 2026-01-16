# Role-Based Access Control (RBAC) Implementation

## Overview
The application implements role-based access control with three roles: **Super Admin**, **Admin**, and **Member**. Each role has different permissions and sees different content.

---

## Role Definitions

### 1. **Super Admin** (super_admin)
**Capabilities:**
- ✅ View all tasks across all users
- ✅ Create tasks and assign to any user
- ✅ Edit/Delete any task
- ✅ Invite users via email (@ductridn.edu.vn)
- ✅ Manage user roles (change member/admin/super_admin)
- ✅ View user management page
- ✅ View audit logs
- ✅ View user activities
- ✅ Access Super Admin panel (`/super-admin`)

**Dashboard Features:**
- Invite User section (blue button)
- Quick Actions section
- All tasks visible in task list
- User management link in sidebar
- Audit Logs link in sidebar

---

### 2. **Admin** (admin)
**Capabilities:**
- ✅ View all tasks across all users
- ✅ Create tasks and assign to any user
- ✅ Edit/Delete any task
- ✅ Invite users via email (@ductridn.edu.vn)
- ❌ Cannot change user roles (only Super Admin can)
- ❌ Cannot access Super Admin panel
- ❌ Cannot view audit logs (only Super Admin)

**Dashboard Features:**
- Invite User section (blue button)
- Quick Actions section
- All tasks visible in task list
- User management link in sidebar (but limited functionality)

---

### 3. **Member** (member)
**Capabilities:**
- ✅ View only their own tasks
- ✅ Create tasks (assigned to themselves automatically)
- ✅ Edit/Delete only their own tasks
- ✅ Update status of their own tasks
- ❌ Cannot assign tasks to others
- ❌ Cannot invite users
- ❌ Cannot see other users' tasks
- ❌ Cannot access admin features

**Dashboard Features:**
- No Invite User section
- No Quick Actions section
- Only their tasks visible in task list
- Upcoming deadlines alert (if any)
- No admin links in sidebar

---

## Task Assignment

### Current Implementation: **Single Assignee Only**
- Each task can be assigned to **ONE person only** via `user_id` column
- The database schema uses: `user_id INTEGER REFERENCES users(id)`

### To Support Multiple Assignees (Future Enhancement):
You would need to:
1. Create a junction table: `task_assignees`
2. Update backend to handle array of assignees
3. Update frontend to allow multi-select

**Example schema for multiple assignees:**
```sql
CREATE TABLE task_assignees (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);
```

---

## Dashboard Differences by Role

### Super Admin Dashboard:
- Header: Logo centered, search box, user menu
- Welcome section: "Chào mừng, [Name]!" with Super Admin badge
- Stats: Total tasks across all users
- Invite User card
- Quick Actions: Create task, Manage users, View Audit Logs
- Task List: All tasks with assignee column visible
- Sidebar: Dashboard, User Management, Audit Logs

### Admin Dashboard:
- Same as Super Admin but:
  - Cannot access Audit Logs
  - Cannot change user roles

### Member Dashboard:
- Header: Logo centered, search box, user menu
- Welcome section: "Chào mừng, [Name]!" with Member badge
- Stats: Only their tasks
- No Invite User card
- No Quick Actions
- Task List: Only their tasks, no assignee column
- Sidebar: Only Dashboard link
- Upcoming Deadlines alert (if applicable)

---

## Task List Features by Role

| Feature | Super Admin | Admin | Member |
|---------|-------------|-------|--------|
| See all tasks | ✅ | ✅ | ❌ |
| See own tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Assign to others | ✅ | ✅ | ❌ |
| Edit any task | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ✅ | ❌ |
| Edit own task | ✅ | ✅ | ✅ |
| See assignee column | ✅ | ✅ | ❌ |
| Filter by assignee | ✅ | ✅ | ❌ |
| Update task status | ✅ | ✅ | ✅ (own only) |

---

## Route Protection

- `/dashboard` - All authenticated users
- `/super-admin` - Super Admin only
- `/admin` - Admin and Super Admin (not implemented as separate page)

---

## Current Database Schema Status

Your current schema includes:
- ✅ `users` table with roles
- ✅ `todos` table with `user_id` (single assignee)
- ✅ `audit_logs` table
- ✅ `priority` column
- ✅ `due_date` column
- ✅ `documentation_links` JSONB column

**Status: ✅ Database is complete! No updates needed.**
