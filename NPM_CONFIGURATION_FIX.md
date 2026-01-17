# Fix Nginx Proxy Manager Configuration

## 🔴 Vấn đề hiện tại

Trang hiển thị "Congratulations!" của Nginx Proxy Manager → Proxy host chưa được cấu hình đúng hoặc chưa save.

## ✅ Cấu hình đúng trong NPM

### Tab "Details" - Proxy Host chính

**Cấu hình cho `it.ductridn.com`:**

1. **Domain Names:** `it.ductridn.com` ✅

2. **Scheme:** `http` ✅

3. **Forward Hostname/IP:** `ductri-task-manager_frontend` ✅
   - ⚠️ **Lưu ý:** Trong Docker Swarm, service name có prefix stack name
   - Nếu stack name là `ductri-task-manager` → Service name = `ductri-task-manager_frontend`
   - Nếu stack name khác → Kiểm tra trong Portainer → Services → Xem tên service thực tế

4. **Forward Port:** `80` ✅

5. **Options (quan trọng):**
   - ✅ **Block Common Exploits:** BẬT (ON)
   - ✅ **Websockets Support:** BẬT (ON) - Cần cho một số tính năng
   - ⬜ **Cache Assets:** TẮT (OFF) - Để development dễ debug

6. **Access List:** `Publicly Accessible` ✅

7. **Click "Save"** ⚠️ **Quan trọng!**

---

### Tab "Custom Locations" - Backend API

**Cấu hình `/api` path:**

1. **Location:** `/api` ✅

2. **Scheme:** `http` ✅

3. **Forward Hostname/IP:** `ductri-task-manager_backend` ✅
   - ⚠️ Tên service đầy đủ với prefix stack name

4. **Forward Port:** `5000` ✅

5. **Click "Save"** trong dialog chính (không phải trong location)

---

## 🔍 Kiểm tra tên service chính xác

**Nếu không chắc tên service:**

1. Vào **Portainer** → **Services**
2. Tìm service frontend → Xem **Name** (cột đầu tiên)
3. Copy tên đầy đủ vào NPM "Forward Hostname/IP"

**Hoặc từ terminal:**

```bash
# List services trong stack
docker service ls | grep frontend
docker service ls | grep backend
```

---

## 🚨 Các lỗi thường gặp

### Lỗi 1: Vẫn hiển thị "Congratulations!"

**Nguyên nhân:**
- Chưa click "Save"
- Domain name sai
- Forward hostname/IP sai

**Cách sửa:**
1. Click **"Save"** trong dialog (không phải "Cancel")
2. Đợi 2-3 giây
3. Refresh browser (`Ctrl + F5`)

### Lỗi 2: 502 Bad Gateway

**Nguyên nhân:**
- Service name sai (thiếu prefix)
- Port sai
- Service chưa chạy (`0/1` replicas)

**Cách sửa:**
1. Kiểm tra Portainer → Services → Frontend phải `1/1` (không phải `0/1`)
2. Đảm bảo Forward Hostname/IP đúng: `ductri-task-manager_frontend` (không phải `frontend`)
3. Đảm bảo Forward Port: `80`

### Lỗi 3: Cannot connect to service

**Nguyên nhân:**
- Services không cùng Docker network
- NPM container không thể resolve service name

**Cách sửa:**
1. Kiểm tra tất cả services trong cùng network:
   ```bash
   docker network inspect ductri-task-manager_ductri-network
   ```
2. Phải thấy: `ductri-task-manager_frontend`, `ductri-task-manager_backend`, `ductri-task-manager_proxy-manager`
3. Nếu thiếu → Re-deploy stack

---

## 📝 Checklist cấu hình

### Tab Details:
- [ ] Domain Names: `it.ductridn.com`
- [ ] Scheme: `http`
- [ ] Forward Hostname/IP: `ductri-task-manager_frontend` (tên service đầy đủ)
- [ ] Forward Port: `80`
- [ ] Block Common Exploits: **ON** ✅
- [ ] Websockets Support: **ON** ✅
- [ ] Access List: `Publicly Accessible`
- [ ] Click **"Save"** ⚠️

### Tab Custom Locations:
- [ ] Location: `/api`
- [ ] Scheme: `http`
- [ ] Forward Hostname/IP: `ductri-task-manager_backend`
- [ ] Forward Port: `5000`
- [ ] Click **"Save"** trong dialog chính

### Tab SSL (Tùy chọn - sau khi Details hoạt động):
- [ ] Request SSL Certificate
- [ ] Force SSL: **ON**
- [ ] HTTP/2 Support: **ON**
- [ ] Click **"Save"**

---

## ✅ Sau khi cấu hình

1. **Refresh browser:** `Ctrl + F5` (hard refresh)
2. **Test:** `http://it.ductridn.com` hoặc `https://it.ductridn.com`
3. **Kết quả mong đợi:**
   - ✅ Hiển thị trang login (không phải "Congratulations!")
   - ✅ Không còn redirect sang `ductridn.edu.vn`
   - ✅ API hoạt động: `https://it.ductridn.com/api/auth/test`

---

## 🎯 Quick Reference

**Service Names trong Docker Swarm (nếu stack name = `ductri-task-manager`):**
- Frontend: `ductri-task-manager_frontend`
- Backend: `ductri-task-manager_backend`
- PostgreSQL: `ductri-task-manager_postgres`
- NPM: `ductri-task-manager_proxy-manager`

**Ports:**
- Frontend: `80` (Nginx serving React build)
- Backend: `5000` (Node.js Express)
- NPM Admin: `81` (Web UI)
