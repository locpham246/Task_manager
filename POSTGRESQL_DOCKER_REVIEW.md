# PostgreSQL Docker Configuration Review

## 📊 Database Setup Overview

Your application uses **PostgreSQL running in a Docker container**. pgAdmin4 is just a **management tool** (like phpMyAdmin for MySQL) - it does NOT host the database itself.

### ✅ Database Source: Docker PostgreSQL Container

The actual database is:
- **Container**: `postgres` service in Docker Swarm
- **Image**: `postgres:15-alpine`
- **Database Name**: `task_manager` (from `POSTGRES_DB` or `DB_NAME` env var)
- **User**: `postgres` (from `POSTGRES_USER` or `DB_USER` env var)
- **Password**: From `POSTGRES_PASSWORD` or `DB_PASSWORD` env var
- **Port**: `5432` (internal Docker network, not exposed externally)

---

## 🔍 How It Works

### 1. **Docker Compose Configuration** (`docker-compose.swarm.yml`)

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: ${DB_USER:-postgres}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    POSTGRES_DB: ${DB_NAME:-task_manager}
    PGDATA: /var/lib/postgresql/data/pgdata
  volumes:
    - postgres_data:/var/lib/postgresql/data
  networks:
    - ductri-network
```

### 2. **Backend Connection** (`backend/configs/db.js`)

```javascript
const pool = new Pool({
  user: process.env.DB_USER,        // 'postgres'
  host: process.env.DB_HOST,        // 'postgres' (Docker service name)
  database: process.env.DB_NAME,   // 'task_manager'
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,        // 5432
});
```

**Key Point**: `DB_HOST=postgres` (not `localhost`) because the backend connects via Docker network.

---

## 📝 Database Schema

Your database has these tables (as shown in pgAdmin4):

1. **users** - User accounts with roles
2. **todos** - Tasks/todos
3. **audit_logs** - Activity logs
4. **email_whitelist** - Allowed email addresses
5. **task_assignees** - Task assignments
6. **shared_documents** - Document sharing
7. **document_shares** - Document share permissions

---

## 🔗 pgAdmin4 Connection

When you connect pgAdmin4 to the database:

1. **Host**: Docker container IP or `localhost` (if port 5432 is exposed)
2. **Port**: `5432`
3. **Database**: `task_manager`
4. **Username**: `postgres`
5. **Password**: Your `DB_PASSWORD` value

**Important**: Any changes you make in pgAdmin4 **DO affect** the Docker PostgreSQL database because pgAdmin4 is just a client connecting to the same database.

---

## ✅ Verification Steps

### Check if Database Exists

```bash
# Connect to PostgreSQL container
docker exec -it <postgres-container-id> psql -U postgres

# List databases
\l

# Connect to task_manager database
\c task_manager

# List tables
\dt

# Exit
\q
```

### Check Backend Connection

Look for this in backend logs:
```
✅ All required environment variables are set
Đã kết nối PostgreSQL thành công!
```

If you see `Lỗi kết nối DB: error: database "task_manager" does not exist`, the database needs to be created.

---

## 🛠️ Common Issues

### Issue 1: Database Doesn't Exist

**Error**: `database "task_manager" does not exist`

**Solution**:
```bash
docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE task_manager;"
```

### Issue 2: Wrong Connection Host

**Error**: `Connection refused` or `Host not found`

**Solution**: Ensure `DB_HOST=postgres` (Docker service name, not `localhost`)

### Issue 3: Password Mismatch

**Error**: `password authentication failed`

**Solution**: Ensure `DB_PASSWORD` in backend matches `POSTGRES_PASSWORD` in docker-compose

---

## 📋 Environment Variables Summary

### Backend `.env` (for local development)
```env
DB_USER=postgres
DB_HOST=postgres          # Docker service name
DB_NAME=task_manager
DB_PASSWORD=your_password
DB_PORT=5432
```

### Docker Swarm (Portainer)
```yaml
environment:
  DB_HOST: postgres        # Docker service name
  DB_USER: ${DB_USER:-postgres}
  DB_PASSWORD: ${DB_PASSWORD:-postgres}
  DB_NAME: ${DB_NAME:-task_manager}
  DB_PORT: 5432
```

---

## 🎯 Summary

- ✅ **Database Source**: Docker PostgreSQL container (`postgres` service)
- ✅ **pgAdmin4**: Just a client tool, changes DO affect the Docker database
- ✅ **Backend Connection**: Via Docker network using service name `postgres`
- ✅ **Database Name**: `task_manager`
- ✅ **Data Persistence**: Stored in Docker volume `postgres_data`

---

## 📚 Related Files

- `docker-compose.swarm.yml` - PostgreSQL service definition
- `backend/configs/db.js` - Database connection pool
- `backend/migrations/init_database.sql` - Initial schema (if exists)
