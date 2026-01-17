# Fix Backend Issues - Database và Environment Variables

## 🔴 Vấn đề 1: Database không tồn tại

**Lỗi:** `error: database "task_manager" does not exist`

## ✅ Giải pháp: Tạo database trong PostgreSQL

### Cách 1: Tạo database qua Portainer (Dễ nhất)

1. Vào **Portainer** → **Containers**
2. Tìm container: `ductri-task-manager_postgres`
3. Click **"Console"** hoặc **"Exec"**
4. Chạy:
   ```bash
   psql -U postgres
   ```
5. Trong PostgreSQL console:
   ```sql
   CREATE DATABASE task_manager;
   \l  -- List databases để verify
   \q  -- Exit
   ```

### Cách 2: Tạo database từ host (nếu có psql)

```bash
# Lấy container ID
docker ps | grep postgres

# Tạo database
docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE task_manager;"

# Verify
docker exec -it <postgres-container-id> psql -U postgres -c "\l"
```

### Cách 3: Kiểm tra database hiện tại

Có thể database đã tồn tại với tên khác:

```bash
docker exec -it <postgres-container-id> psql -U postgres -c "\l"
```

Nếu thấy `task_db` hoặc tên khác, có 2 option:
- **Option A:** Đổi tên database trong backend env → `DB_NAME: task_db`
- **Option B:** Tạo database mới `task_manager` như trên

---

## 🔴 Vấn đề 2: Environment Variables thiếu

**Lỗi:** `Missing required environment variables: GOOGLE_CLIENT_ID, JWT_SECRET`

**Nguyên nhân:** Container cũ chưa có env vars mới

## ✅ Giải pháp: Update Service với env vars đầy đủ

### Docker Compose đã có env vars đúng:

```yaml
backend:
  environment:
    GOOGLE_CLIENT_ID: "1084886023567-rrrqtka0lt87gcuggf8147ov62qcvd6f.apps.googleusercontent.com"
    JWT_SECRET: "12345678"
    DB_NAME: task_manager  # Đảm bảo đúng tên database
```

### Update Service trong Portainer:

1. Vào **Services** → `ductri-task-manager_backend`
2. Click **"Update the service"**
3. Hoặc **Re-deploy stack** với docker-compose mới

---

## 🎯 Quick Fix - Tất cả các bước

### Bước 1: Tạo Database

```bash
# Lấy postgres container ID từ Portainer hoặc:
docker ps | grep postgres

# Tạo database
docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE task_manager;"
```

### Bước 2: Kiểm tra DB_NAME trong Environment

**Trong Portainer:**
- Services → `ductri-task-manager_backend` → Environment variables
- `DB_NAME` phải là: `task_manager` (không phải `task_db`)

### Bước 3: Update Backend Service

**Trong Portainer:**
- Services → `ductri-task-manager_backend`
- **"Update the service"** → **"Recreate"**
- Để áp dụng env vars mới

### Bước 4: Verify Backend Logs

```bash
docker service logs -f ductri-task-manager_backend
```

**Kết quả mong đợi:**
- ✅ `✅ All required environment variables are set`
- ✅ `Server running on port 5000`
- ✅ **KHÔNG còn** `database "task_manager" does not exist`

---

## 📝 Checklist

- [ ] Tạo database `task_manager` trong PostgreSQL
- [ ] Kiểm tra `DB_NAME` = `task_manager` trong backend env
- [ ] Update backend service để áp dụng env vars mới
- [ ] Verify backend logs - không còn lỗi database
- [ ] Test API: `curl http://localhost:5000/api/auth/test` hoặc từ browser

---

## 🚨 Nếu vẫn lỗi

### Kiểm tra database connection:

```bash
# Test kết nối từ backend container
docker exec -it <backend-container-id> psql -h postgres -U postgres -d task_manager -c "SELECT 1;"
```

### Nếu lỗi "password authentication failed":

- Kiểm tra `DB_PASSWORD` trong backend env phải khớp với PostgreSQL password
- Trong docker-compose: `POSTGRES_PASSWORD: "Canhsat246!"`
- Backend env: `DB_PASSWORD: "Canhsat246!"`
