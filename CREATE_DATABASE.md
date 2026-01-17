# Tạo Database task_manager

## ✅ Cách 1: Vào container PostgreSQL (Dễ nhất)

### Bước 1: Tìm container ID

```bash
docker ps | grep postgres
```

Hoặc trong Portainer:
- **Containers** → Tìm `ductri-task-manager_postgres`

### Bước 2: Vào container

```bash
docker exec -it <postgres-container-id> psql -U postgres
```

**Hoặc nếu dùng tên service:**
```bash
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres
```

### Bước 3: Tạo database

Trong PostgreSQL console:
```sql
CREATE DATABASE task_manager;
```

### Bước 4: Verify và exit

```sql
\l  -- List databases để kiểm tra
\q  -- Exit
```

---

## ✅ Cách 2: Tạo database trực tiếp (Không cần vào console)

```bash
# Lấy container ID
docker ps | grep postgres

# Tạo database trực tiếp
docker exec -it <postgres-container-id> psql -U postgres -c "CREATE DATABASE task_manager;"

# Verify
docker exec -it <postgres-container-id> psql -U postgres -c "\l"
```

---

## ✅ Cách 3: Dùng Portainer Console

1. Vào **Portainer** → **Containers**
2. Tìm container: `ductri-task-manager_postgres`
3. Click **"Console"** hoặc **"Exec"**
4. Chọn shell: `sh` hoặc `/bin/sh`
5. Chạy:
   ```bash
   psql -U postgres
   ```
6. Trong PostgreSQL console:
   ```sql
   CREATE DATABASE task_manager;
   \l
   \q
   ```

---

## 🎯 Quick Command (Copy-paste)

```bash
# Lấy container ID và tạo database
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -c "CREATE DATABASE task_manager;"
```

---

## ✅ Verify Database đã tạo

```bash
# List databases
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -c "\l"
```

**Phải thấy:**
```
   Name    |  Owner   | Encoding |  Collate   |   Ctype    |
-----------+----------+----------+------------+------------+
 task_manager | postgres | UTF8     | en_US.utf8 | en_US.utf8 |
```

---

## 🚨 Nếu lỗi "database already exists"

**Không sao!** Database đã tồn tại, tiếp tục bước tiếp theo.

**Nếu muốn xóa và tạo lại:**
```sql
DROP DATABASE task_manager;
CREATE DATABASE task_manager;
```

---

## 📝 Sau khi tạo database

1. ✅ Database `task_manager` đã tạo
2. Update backend service để restart với database mới
3. Check logs: `docker service logs -f ductri-task-manager_backend`
4. Phải thấy: `Server running on port 5000` (không còn lỗi database)
