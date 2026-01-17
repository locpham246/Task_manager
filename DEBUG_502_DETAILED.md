# Debug 502 Bad Gateway - Chi tiết

## 🔴 Vấn đề: 502 Bad Gateway

NPM không thể forward request tới frontend service.

## 🔍 Kiểm tra bước từng bước

### Bước 1: Kiểm tra NPM Logs (Quan trọng nhất)

**Xem logs để biết lỗi cụ thể:**

1. Vào **Portainer** → **Containers**
2. Tìm container: `ductri-task-manager_proxy-manager`
3. Click **Logs**
4. **Clear logs** (xóa logs cũ)
5. Trong browser, refresh `http://it.ductridn.com`
6. Xem logs NPM → **Copy toàn bộ dòng có lỗi 502**

**Các lỗi thường gặp:**

**A. "Connection refused":**
```
nginx.1 | connect() failed (111: Connection refused) while connecting to upstream
```
→ **Nguyên nhân:** Frontend service không chạy (`0/1`) hoặc port sai

**B. "Name or service not known":**
```
nginx.1 | host not found in upstream "frontend" / "wrong-service-name"
```
→ **Nguyên nhân:** Service name sai trong NPM

**C. "Connection timeout":**
```
nginx.1 | upstream timed out (110: Connection timed out)
```
→ **Nguyên nhân:** Network issue hoặc service không response

---

### Bước 2: Test từ NPM Container

**Kiểm tra NPM có thể reach frontend không:**

```bash
# Lấy container ID của NPM
docker ps | grep proxy-manager

# Test connectivity
docker exec -it <npm-container-id> ping -c 3 ductri-task-manager_frontend

# Test HTTP request
docker exec -it <npm-container-id> wget -O- http://ductri-task-manager_frontend:80
```

**Kết quả mong đợi:**
- ✅ `ping` thành công (có response)
- ✅ `wget` trả về HTML với `<div id="root"></div>`

**Nếu ping fail:**
- Service name sai → Sửa trong NPM
- Network không đúng → Re-deploy stack

**Nếu wget fail:**
- Frontend container không serve đúng
- Port sai (không phải `80`)

---

### Bước 3: Kiểm tra cấu hình NPM (Double check)

**Vào NPM:** `http://server-ip:81` hoặc `http://it.ductridn.com:81`

1. **Proxy Hosts** → Click vào entry `it.ductridn.com`
2. **Xem lại tab "Details":**
   - Domain: `it.ductridn.com` ✅
   - Forward Hostname/IP: `ductri-task-manager_frontend` ✅ (tên service đầy đủ)
   - Forward Port: `80` ✅
   - Scheme: `http` ✅
3. **Xem Status:**
   - Phải hiển thị "Online" (màu xanh) ✅
   - Nếu "Offline" (màu đỏ) → Click vào để bật lại

**Nếu cấu hình sai:**
- Click **"Edit"**
- Sửa **Forward Hostname/IP** thành: `ductri-task-manager_frontend`
- Sửa **Forward Port** thành: `80`
- Click **"Save"**

---

### Bước 4: Test Frontend Container trực tiếp

**Kiểm tra frontend có serve đúng không:**

```bash
# Lấy container ID của frontend
docker ps | grep frontend

# Test từ bên trong container
docker exec -it <frontend-container-id> wget -O- http://localhost

# Hoặc từ host machine (nếu có expose port tạm thời)
curl -H "Host: it.ductridn.com" http://localhost:8080  # Nếu expose port 8080
```

**Kết quả mong đợi:**
- ✅ Trả về HTML của React app
- ✅ Có `<div id="root"></div>` trong HTML

**Nếu không có response:**
- Container frontend có vấn đề
- Cần rebuild frontend image

---

### Bước 5: Kiểm tra Network

**Tất cả services phải cùng network:**

```bash
# List networks
docker network ls | grep ductri

# Inspect network
docker network inspect ductri-task-manager_ductri-network
```

**Phải thấy trong "Containers" hoặc "Services":**
- ✅ `ductri-task-manager_frontend`
- ✅ `ductri-task-manager_backend`
- ✅ `ductri-task-manager_proxy-manager`
- ✅ `ductri-task-manager_postgres`

**Nếu thiếu:**
- Re-deploy stack:
  ```bash
  cd personal_task
  docker stack rm ductri-task-manager
  sleep 30
  docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
  ```

---

## 🎯 Quick Fix Checklist

- [ ] **Xem NPM Logs** → Copy lỗi cụ thể
- [ ] **Test từ NPM container:** `ping ductri-task-manager_frontend` → Phải thành công
- [ ] **Test HTTP từ NPM:** `wget http://ductri-task-manager_frontend:80` → Phải trả về HTML
- [ ] **Kiểm tra NPM config:** Forward Hostname/IP = `ductri-task-manager_frontend`, Port = `80`
- [ ] **Kiểm tra service status:** Portainer → Services → Frontend phải `1/1`
- [ ] **Kiểm tra network:** Tất cả services trong cùng network

---

## 🚨 Nếu vẫn 502 sau khi check tất cả

**Option 1: Re-create Proxy Host**

1. Trong NPM → Proxy Hosts
2. **Delete** entry `it.ductridn.com`
3. **Add Proxy Host** mới:
   - Domain: `it.ductridn.com`
   - Forward to: `ductri-task-manager_frontend:80`
   - Click **Save**

**Option 2: Rebuild Frontend**

```bash
cd personal_task
docker-compose -f docker-compose.swarm.yml build frontend --no-cache
docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
```

**Option 3: Test với expose port tạm thời**

Sửa `docker-compose.swarm.yml` tạm thời:
```yaml
frontend:
  ports:
    - "8080:80"  # Tạm thời
```
Test: `http://server-ip:8080`
Nếu work → Vấn đề ở NPM
Nếu không work → Vấn đề ở frontend container

---

## 📝 Báo lại logs NPM

**Copy logs NPM và gửi lại để tôi phân tích:**

1. Portainer → proxy-manager → Logs
2. Clear logs
3. Refresh `http://it.ductridn.com`
4. Copy dòng có `502` hoặc `error`
