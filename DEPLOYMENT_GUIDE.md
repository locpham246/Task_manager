# Deployment & Advanced Guide

## 📋 Table of Contents
1. [Docker Compose Files Explained](#docker-compose-files-explained)
2. [Database Schema & Migrations](#database-schema--migrations)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Document Sharing Rules](#document-sharing-rules)
5. [Email Service Options](#email-service-options)
6. [Environment Configuration](#environment-configuration)

---

## 🐳 Docker Compose Files Explained

### Which File to Use?

**`docker-compose.yml` (Local Development):**
- ✅ Use for local development with Docker Desktop
- Network: `bridge` driver (local Docker Compose)
- No `deploy` sections
- Ports: Direct mapping (5000:5000, 5173:80)

**`docker-compose.swarm.yml` (Production/Portainer):**
- ✅ Use for Portainer/Docker Swarm deployment
- Network: `overlay` driver (required for Docker Swarm)
- Has `deploy` sections for Swarm orchestration
- Same ports but configured for Swarm networking

**Key Differences:**

| Feature | docker-compose.yml | docker-compose.swarm.yml |
|---------|-------------------|-------------------------|
| Network Driver | `bridge` | `overlay` |
| Deploy Sections | ❌ No | ✅ Yes |
| Replicas | N/A (single instance) | Configurable |
| Restart Policy | `unless-stopped` | `any` (Swarm) |
| Use Case | Local dev | Production/Swarm |

---

## 💾 Database Schema & Migrations

### Schema Overview

**Core Tables:**
- `users` - User accounts with roles
- `todos` - Tasks with single assignee
- `document_shares` - Document sharing relationships
- `shared_documents` - Document metadata
- `email_whitelist` - Email access control
- `audit_logs` - System activity logs
- `task_assignees` - Multiple assignees (if enabled)

**Current Status:** ✅ Complete - All features supported

### Running Migrations

**Initialize Database (First Time):**
```powershell
Get-Content backend\migrations\init_database.sql | docker-compose exec -T postgres psql -U postgres -d task_manager
```

**Individual Migrations:**
```powershell
# Email whitelist
docker-compose exec postgres psql -U postgres -d task_manager < backend/migrations/create_email_whitelist.sql

# IP/Device tracking
docker-compose exec postgres psql -U postgres -d task_manager < backend/migrations/add_ip_device_tracking.sql

# Shared documents
docker-compose exec postgres psql -U postgres -d task_manager < backend/migrations/add_shared_documents.sql
```

---

## 👤 User Roles & Permissions

### Role Hierarchy

**1. Member (member) - Default**
- Can create and manage their own tasks
- Can view shared documents
- Cannot access admin features

**2. Admin (admin)**
- All member permissions
- Can view all users and activities
- Cannot manage user roles or whitelist

**3. Super Admin (super_admin)**
- All admin permissions
- Can manage user roles
- Can manage email whitelist
- Can delete users
- Full system access

### Permission Matrix

| Feature | Member | Admin | Super Admin |
|---------|--------|-------|-------------|
| View own tasks | ✅ | ✅ | ✅ |
| View all tasks | ❌ | ✅ | ✅ |
| Assign tasks to others | ❌ | ✅ | ✅ |
| Edit any task | ❌ | ✅ | ✅ |
| Invite users | ❌ | ❌ | ✅ |
| Manage roles | ❌ | ❌ | ✅ |
| Manage whitelist | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |

---

## 📄 Document Sharing Rules

### Access Control

**All Roles Can:**
- Share documents with other users
- View documents they have access to

**Members Can:**
- Manage only documents they created/shared
- Update sharing settings for their own documents
- Delete their own documents
- ❌ Cannot delete documents shared by others (protected)

**Admins & Super Admins Can:**
- View all documents in the system
- Full control over all documents
- Update sharing settings for any document
- Delete any document

### Security Features

**Original File Protection:**
- Members cannot delete documents shared by others
- Only the original creator or Admin/SuperAdmin can delete
- Prevents accidental or malicious deletion

**Audit Logging:**
All document actions are logged:
- `SHARE_DOCUMENT` - When a document is shared
- `UPDATE_DOCUMENT_SHARES` - When sharing settings change
- `DELETE_DOCUMENT` - When a document is deleted

---

## 📧 Email Service Options

### Recommended: Gmail SMTP (FREE)

**Why:**
- ✅ 100% FREE (500 emails/day for free Gmail)
- ✅ Easy to set up
- ✅ You're already using Google OAuth
- ✅ 500 emails/day = 15,000/month (more than enough!)

**Setup:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Alternative Options:**

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Gmail SMTP** | 500/day | FREE |
| **AWS SES** | 3,000/month (1 year) | $0.10/1,000 |
| **MailerSend** | 3,000/month | ~$10/month |
| **Brevo** | 300/day | ~$25/month |

**Volume Estimate:**
- Invitations: ~5-20/month
- Password resets: ~0-5/month
- Notifications: ~10-50/month
- **Total: ~15-75 emails/month**

**Conclusion:** Any free tier is MORE than enough! 🎉

---

## ⚙️ Environment Configuration

### Backend Environment Variables

**Required:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# JWT Secret (minimum 32 characters)
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=task_manager
DB_HOST=postgres
DB_PORT=5432

# Node Environment
NODE_ENV=production
```

**Optional:**
```env
# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# System URL
SYSTEM_URL=http://localhost:5173
```

### Frontend Environment Variables

**Required:**
```env
# API URL (backend)
VITE_API_URL=http://localhost:5000

# Google OAuth Client ID (must match backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Setting Environment Variables

**Method 1: .env File (Recommended)**
Create `.env` file in `backend/` and `frontend/` directories.

**Method 2: docker-compose.yml**
Add under `environment:` section for each service.

**Method 3: System Environment Variables**
Set in your system and Docker will pick them up.

---

## 🚀 Deployment Steps

### Local Development

1. **Clone repository:**
```powershell
git clone <repository-url>
cd personal_task
```

2. **Set up environment variables:**
- Create `backend/.env` with required variables
- Create `frontend/.env` with VITE_ variables

3. **Start services:**
```powershell
docker-compose up -d --build
```

4. **Initialize database:**
```powershell
Get-Content backend\migrations\init_database.sql | docker-compose exec -T postgres psql -U postgres -d task_manager
```

5. **Set first super admin:**
```powershell
docker-compose exec postgres psql -U postgres -d task_manager -c "UPDATE users SET role = 'super_admin' WHERE email = 'your-email@ductridn.edu.vn';"
```

### Production Deployment (Portainer/Docker Swarm)

1. **Upload to Portainer:**
- Stack → Add Stack
- Upload `docker-compose.swarm.yml`
- Configure environment variables

2. **Deploy:**
- Review configuration
- Deploy stack
- Monitor logs

3. **Initialize database:**
```powershell
# Access PostgreSQL container
docker exec -i <postgres-container-id> psql -U postgres -d task_manager < backend/migrations/init_database.sql
```

4. **Set first super admin:**
```powershell
docker exec <postgres-container-id> psql -U postgres -d task_manager -c "UPDATE users SET role = 'super_admin' WHERE email = 'your-email@ductridn.edu.vn';"
```

---

## 🔒 Security Best Practices

1. **Change default passwords:**
   - Update `DB_PASSWORD` in production
   - Use strong `JWT_SECRET` (minimum 32 characters)

2. **Email whitelist:**
   - Only whitelisted emails can access system
   - Manage via Super Admin panel

3. **Role management:**
   - Only Super Admins can change roles
   - Audit logs track all role changes

4. **CORS configuration:**
   - Configure `ALLOWED_ORIGINS` in backend
   - Restrict to your domain in production

5. **HTTPS in production:**
   - Use reverse proxy (Nginx) with SSL
   - Configure Let's Encrypt certificates

---

## 📊 Monitoring & Maintenance

### Check Service Status
```powershell
docker-compose ps
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

### Restart Services
```powershell
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Database Backup
```powershell
# Backup
docker-compose exec postgres pg_dump -U postgres task_manager > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres -d task_manager < backup.sql
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend keeps restarting:**
- Check logs: `docker-compose logs backend`
- Verify environment variables
- Check database connection

**Database connection failed:**
- Verify PostgreSQL is running: `docker-compose ps postgres`
- Check database credentials
- Ensure tables exist (run init script)

**403 Forbidden errors:**
- JWT token has old role - refresh token or log out/in
- Check user role in database
- Verify permissions

**CORS errors:**
- Check `ALLOWED_ORIGINS` in backend
- Verify frontend URL matches configuration

---

## 📝 Additional Resources

- **Main README:** See `README.md` for quick start guide
- **Migrations:** See `backend/migrations/README.md` for migration details
- **API Documentation:** See README.md API section

---

For quick start instructions, see `README.md`.
