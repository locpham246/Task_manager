# Task Manager System - Complete Guide

## 📋 Table of Contents
1. [Docker Compose Files](#docker-compose-files)
2. [Quick Start](#quick-start)
3. [Database Management](#database-management)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Troubleshooting](#troubleshooting)
6. [API Documentation](#api-documentation)

---

## 🐳 Docker Compose Files

### Which File to Use?

**For Local Development (Docker Desktop):**
- Use: `docker-compose.yml`
- Network: `bridge` driver (local Docker Compose)
- No `deploy` sections (not needed for local)

**For Production/Portainer (Docker Swarm):**
- Use: `docker-compose.swarm.yml`
- Network: `overlay` driver (required for Docker Swarm)
- Has `deploy` sections for Swarm orchestration

**Summary:**
- ✅ **Local testing:** `docker-compose.yml`
- ✅ **Portainer deployment:** `docker-compose.swarm.yml`

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Git repository cloned

### Start All Services

```powershell
cd personal_task
docker-compose up -d --build
```

### Check Status

```powershell
docker-compose ps
```

### Stop Services

```powershell
docker-compose down
```

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 💾 Database Management

### Initialize Database (First Time)

The database schema is automatically initialized via `backend/migrations/init_database.sql` when you run:

```powershell
docker-compose exec postgres psql -U postgres -d task_manager < backend/migrations/init_database.sql
```

Or manually:
```powershell
Get-Content backend\migrations\init_database.sql | docker-compose exec -T postgres psql -U postgres -d task_manager
```

### View All Users

```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "SELECT id, email, full_name, role FROM users;"
```

### Change User Role

```powershell
# Set to super_admin
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE users SET role = 'super_admin' WHERE email = 'your-email@ductridn.edu.vn';"

# Set to admin
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE users SET role = 'admin' WHERE email = 'your-email@ductridn.edu.vn';"

# Set to member
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE users SET role = 'member' WHERE email = 'your-email@ductridn.edu.vn';"
```

### View Email Whitelist

```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "SELECT email, is_active, added_at, notes FROM email_whitelist;"
```

### Add Email to Whitelist

```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "INSERT INTO email_whitelist (email, notes, is_active) VALUES ('email@ductridn.edu.vn', 'Added manually', true) ON CONFLICT (email) DO UPDATE SET is_active = true;"
```

### Remove Email from Whitelist

```powershell
# Soft delete (deactivate)
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE email_whitelist SET is_active = false WHERE email = 'email@ductridn.edu.vn';"

# Hard delete
docker-compose exec postgres psql -U postgres -d task_manager -c "DELETE FROM email_whitelist WHERE email = 'email@ductridn.edu.vn';"
```

### View All Tables

```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "\dt"
```

### Interactive PostgreSQL Shell

```powershell
docker-compose exec postgres psql -U postgres -d task_manager
```

Then run SQL commands directly.

---

## 👤 User Roles & Permissions

### Role Hierarchy

1. **`member`** (Default)
   - Can create and manage their own tasks
   - Can view shared documents
   - Cannot access admin features

2. **`admin`**
   - All member permissions
   - Can view all users and activities
   - Cannot manage user roles or whitelist

3. **`super_admin`**
   - All admin permissions
   - Can manage user roles
   - Can manage email whitelist
   - Can delete users
   - Full system access

### Set Yourself as Super Admin

**Method 1: Using Docker Command**
```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE users SET role = 'super_admin' WHERE email = 'loc.pp@ductridn.edu.vn';"
```

**Method 2: Using pgAdmin4 or Database Tool**
- Connect to: `localhost:5432`
- Database: `task_manager`
- User: `postgres`
- Password: `postgres`
- Run: `UPDATE users SET role = 'super_admin' WHERE email = 'your-email@ductridn.edu.vn';`

**⚠️ IMPORTANT:** After changing role in database, you **MUST** refresh your JWT token:

1. **Option A:** Log out and log back in (easiest)
2. **Option B:** Use token refresh endpoint (see Troubleshooting)

---

## 🔧 Troubleshooting

### 403 Forbidden Errors

**Problem:** Getting 403 errors on admin endpoints after changing your role in database.

**Cause:** Your JWT token still has the old role. Tokens are created at login time and don't auto-update when database changes.

**Solution:**

**Option 1: Log Out and Log Back In (Recommended)**
- Click user menu → "Đăng xuất" (Logout)
- Log back in with Google OAuth
- New token will have updated role

**Option 2: Refresh Token (Without Logging Out)**
- Open browser console (F12)
- Run this code:
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  if (d.success) {
    localStorage.setItem('token', d.token);
    console.log('✅ Token refreshed! New role:', d.user.role);
    window.location.reload();
  }
});
```

### Port 5000 Already in Use

**Problem:** `Error: bind: address already in use`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Stop the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or change port in docker-compose.yml
# Change "5000:5000" to "5001:5000"
```

### Backend Container Restarting

**Problem:** Backend keeps restarting.

**Check logs:**
```powershell
docker-compose logs backend --tail 50
```

**Common causes:**
- Missing environment variables (GOOGLE_CLIENT_ID, JWT_SECRET)
- Database connection failed
- Database tables don't exist (run init script)

### Database Connection Failed

**Problem:** "Lỗi kết nối cơ sở dữ liệu"

**Check:**
```powershell
# Verify PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -d task_manager -c "SELECT 1;"

# Check if tables exist
docker-compose exec postgres psql -U postgres -d task_manager -c "\dt"
```

**If tables missing:**
```powershell
Get-Content backend\migrations\init_database.sql | docker-compose exec -T postgres psql -U postgres -d task_manager
```

### Google OAuth Not Working

**Problem:** 401 Unauthorized or "Cấu hình Google OAuth không đúng"

**Check:**
1. Verify `GOOGLE_CLIENT_ID` in docker-compose.yml matches frontend `main.jsx`
2. Check backend logs: `docker-compose logs backend | Select-String "GOOGLE_CLIENT_ID"`
3. Ensure email is whitelisted

### CORS Errors

**Problem:** CORS policy blocking requests

**Check:** Backend CORS is configured for `localhost` on all ports. If accessing from different origin, add it to `ALLOWED_ORIGINS` environment variable.

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh JWT token with latest role
- `POST /api/auth/track-activity` - Track user activity
- `POST /api/auth/logout` - Logout and track

### Admin Endpoints (Admin/SuperAdmin)

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user role (SuperAdmin only)
- `DELETE /api/admin/users/:id` - Delete user (SuperAdmin only)
- `GET /api/admin/activities` - Get user activities
- `GET /api/admin/audit-logs` - Get audit logs (SuperAdmin only)

### Whitelist Endpoints (SuperAdmin only)

- `GET /api/admin/whitelist` - Get all whitelisted emails
- `POST /api/admin/whitelist` - Add email to whitelist
- `PUT /api/admin/whitelist/:email` - Update whitelist entry
- `DELETE /api/admin/whitelist/:email` - Remove email from whitelist

### Task Endpoints (All authenticated users)

- `GET /api/todos` - Get all tasks (filtered by user role)
- `POST /api/todos` - Create new task
- `PUT /api/todos/:id` - Update task
- `DELETE /api/todos/:id` - Delete task

### Document Endpoints (All authenticated users)

- `GET /api/documents` - Get shared documents
- `POST /api/documents` - Share new document
- `PUT /api/documents/:id/shares` - Update document shares
- `DELETE /api/documents/:id` - Delete document

---

## 🌐 Environment Variables

### Required for Backend

Set these in `docker-compose.yml` or `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=task_manager
DB_HOST=postgres
DB_PORT=5432
```

### Optional

```env
VITE_API_URL=http://localhost:5000
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## 📝 Quick Commands Reference

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Execute database command
docker-compose exec postgres psql -U postgres -d task_manager -c "SQL_COMMAND"

# Interactive database shell
docker-compose exec postgres psql -U postgres -d task_manager
```

---

## 📦 Project Structure

```
personal_task/
├── backend/          # Node.js/Express API
├── frontend/         # React/Vite application
├── docker-compose.yml           # For local Docker Compose
├── docker-compose.swarm.yml     # For Portainer/Docker Swarm
├── backend/Dockerfile
├── frontend/Dockerfile
└── backend/migrations/          # Database migration scripts
```

---

## ✅ Status Checklist

- [x] Docker Compose configured
- [x] PostgreSQL running
- [x] Backend running
- [x] Frontend running
- [x] Database schema initialized
- [x] Email whitelist configured
- [x] User role set to super_admin
- [x] JWT token refreshed (after role change)

---

For more details, see migration files in `backend/migrations/` directory.
