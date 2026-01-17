# Debug 502 Bad Gateway - NPM Configuration

## 🔴 Vấn đề hiện tại

- Trang hiển thị "Congratulations!" → Proxy host chưa hoạt động
- Lỗi `502 Bad Gateway` → NPM không thể forward request tới frontend

## ✅ Checklist kiểm tra

### 1. Kiểm tra Proxy Host trong NPM

**Vào NPM Admin:** `http://server-ip:81` hoặc `http://it.ductridn.com:81`

**Kiểm tra:**
- [ ] Có proxy host nào cho `it.ductridn.com` không?
- [ ] Proxy host có status "Online" (màu xanh) không?
- [ ] Click "Edit" trên proxy host `it.ductridn.com`

**Trong tab "Details":**
- [ ] **Domain Names:** `it.ductridn.com` (không có dấu cách, không có port)
- [ ] **Scheme:** `http` (không phải `https` cho forward)
- [ ] **Forward Hostname/IP:** `ductri-task-manager_frontend` ⚠️ **QUAN TRỌNG!**
  - ❌ KHÔNG phải: `frontend`
  - ❌ KHÔNG phải: `192.168.40.132`
  - ❌ KHÔNG phải: `localhost`
  - ✅ ĐÚNG: `ductri-task-manager_frontend` (tên service đầy đủ trong Docker Swarm)
- [ ] **Forward Port:** `80`
- [ ] **Block Common Exploits:** ✅ BẬT (ON)
- [ ] **Websockets Support:** ✅ BẬT (ON)
- [ ] **Đã click "Save"** ⚠️ **Quan trọng!**

---

### 2. Xác định tên service chính xác

**Cách 1: Trong Portainer**
1. Vào **Services** → Tìm service frontend
2. Copy **tên đầy đủ** (ví dụ: `ductri-task-manager_frontend`)
3. Dán vào NPM "Forward Hostname/IP"

**Cách 2: Từ terminal**
```bash
docker service ls | grep frontend
```
Sẽ hiển thị tên service, ví dụ:
```
ID        NAME                            MODE     REPLICAS   IMAGE
abc123    ductri-task-manager_frontend    replicated   1/1    ductri-frontend:latest
```
Copy `ductri-task-manager_frontend` (cột NAME)

**Cách 3: Kiểm tra stack name**
```bash
docker stack ls
```
Stack name sẽ là prefix của service name.

---

### 3. Kiểm tra Frontend Service đang chạy

**Trong Portainer:**
- Vào **Services** → `ductri-task-manager_frontend`
- **Replicas phải là:** `1/1` ✅ (không phải `0/1`)

**Nếu `0/1`:**
- Click vào service → Xem **Logs** để biết lỗi
- Click **Update the service** → **Force update** hoặc **Recreate**

---

### 4. Kiểm tra Network

**Tất cả services phải trong cùng network:**

1. Vào Portainer → **Networks**
2. Tìm network: `ductri-task-manager_ductri-network` (hoặc tên tương tự)
3. Click vào network → Xem **Connected containers/services**
4. Phải thấy:
   - ✅ `ductri-task-manager_frontend`
   - ✅ `ductri-task-manager_backend`
   - ✅ `ductri-task-manager_proxy-manager`
   - ✅ `ductri-task-manager_postgres`

**Nếu thiếu service:**
- Re-deploy stack:
  ```bash
  cd personal_task
  docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
  ```

---

### 5. Test từ NPM container

**Kiểm tra NPM có thể reach frontend không:**

```bash
# Lấy container ID của NPM
docker ps | grep nginx-proxy-manager

# Test từ NPM container
docker exec -it <npm-container-id> wget -O- http://ductri-task-manager_frontend:80

# Hoặc test với ping
docker exec -it <npm-container-id> ping -c 3 ductri-task-manager_frontend
```

**Kết quả mong đợi:**
- ✅ `wget` trả về HTML với `<div id="root"></div>`
- ✅ `ping` thành công (có response)

**Nếu không work:**
- Service name sai → Sửa trong NPM
- Network không đúng → Re-deploy stack

---

### 6. Kiểm tra Frontend container serve đúng

**Test trực tiếp từ frontend container:**

```bash
# Lấy container ID của frontend
docker ps | grep frontend

# Test từ bên trong container
docker exec -it <frontend-container-id> wget -O- http://localhost

# Hoặc kiểm tra files
docker exec -it <frontend-container-id> ls -la /usr/share/nginx/html/
```

**Kết quả mong đợi:**
- ✅ `wget` trả về HTML (không phải redirect)
- ✅ Có file `index.html` trong `/usr/share/nginx/html/`

---

### 7. Xem NPM Logs

**Khi có lỗi 502:**

1. Vào Portainer → Container `ductri-task-manager_proxy-manager`
2. Click **Logs**
3. Refresh `https://it.ductridn.com` trong browser
4. Xem logs → Sẽ thấy:
   - Request tới NPM
   - NPM forward tới đâu
   - Lỗi gì (nếu có)

**Ví dụ logs bình thường:**
```
nginx.1    | 2026-01-17 13:00:00 - "GET /login HTTP/1.1" from 192.168.x.x - 200
```

**Ví dụ logs lỗi:**
```
nginx.1    | 2026-01-17 13:00:00 - "GET /login HTTP/1.1" from 192.168.x.x - 502
nginx.1    | upstream: http://ductri-task-manager_frontend:80, ...
nginx.1    | connect() failed (111: Connection refused)
```

**Nếu thấy "Connection refused":**
- Frontend service không chạy (`0/1`)
- Service name sai trong NPM
- Port sai (không phải `80`)

---

## 🎯 Quick Fix Steps

### Bước 1: Xác định tên service
```bash
docker service ls | grep frontend
# Copy tên đầy đủ (ví dụ: ductri-task-manager_frontend)
```

### Bước 2: Sửa trong NPM
1. Vào NPM: `http://server-ip:81`
2. Proxy Hosts → Edit `it.ductridn.com`
3. **Forward Hostname/IP:** Dán tên service đầy đủ
4. **Forward Port:** `80`
5. Click **"Save"**

### Bước 3: Kiểm tra service running
- Portainer → Services → Frontend phải `1/1`

### Bước 4: Test
- Refresh browser: `Ctrl + F5`
- `https://it.ductridn.com` → Phải hiển thị login page (không phải "Congratulations!")

---

## 🚨 Nếu vẫn không được

### Option 1: Xóa và tạo lại Proxy Host

1. Trong NPM → Proxy Hosts
2. **Delete** proxy host `it.ductridn.com`
3. **Add Proxy Host** mới:
   - Domain: `it.ductridn.com`
   - Forward to: `ductri-task-manager_frontend:80`
   - Click **Save**

### Option 2: Re-deploy Stack

```bash
cd personal_task
docker stack rm ductri-task-manager
# Đợi 30 giây
docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
```

Sau đó cấu hình lại NPM.

---

## ✅ Expected Result

Sau khi fix:
- ✅ `https://it.ductridn.com` → Hiển thị trang login (không phải "Congratulations!")
- ✅ `https://it.ductridn.com/favicon.ico` → Trả về favicon (không 502)
- ✅ NPM logs không còn 502 errors
