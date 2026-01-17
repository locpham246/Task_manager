# Fix NPM 502 - Complete Solution

## 🔴 Vấn đề đã phát hiện

1. **nginx.conf có `server_name it.ductridn.com`** → NPM forward có thể không match
2. **Backend ALLOWED_ORIGINS thiếu HTTP origin**
3. **Frontend cần rebuild với nginx config mới**

## ✅ Đã sửa

### 1. Sửa nginx.conf

**Đã thay đổi:**
```nginx
server_name it.ductridn.com;  # ❌ Cũ
server_name _;  # ✅ Mới - Accept any hostname
```

**Lý do:** NPM forward có thể gửi Host header khác, nginx cần accept mọi hostname.

### 2. Backend ALLOWED_ORIGINS

**Đã có:** `https://it.ductridn.com,http://it.ductridn.com,http://192.168.40.132:3000`

---

## 🚀 Các bước deploy lại

### Bước 1: Rebuild Frontend Image

**Vì đã sửa nginx.conf, cần rebuild frontend:**

```bash
cd personal_task
docker-compose -f docker-compose.swarm.yml build frontend --no-cache
```

**Hoặc trong Portainer:**
1. **Stacks** → `ductri-task-manager` → **Editor**
2. Paste lại docker-compose.swarm.yml (đã có nginx.conf mới)
3. Click **"Update the stack"**

### Bước 2: Update Stack

```bash
docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
```

**Hoặc trong Portainer:**
- **Stacks** → `ductri-task-manager` → **Update the stack**

### Bước 3: Verify NPM Config

**Trong NPM (`http://192.168.40.132:81`):**

1. **Proxy Hosts** → Edit `it.ductridn.com`
2. Tab **"Details":**
   - **Forward Hostname/IP:** `192.168.40.132` (hoặc `ductri-task-manager_frontend` nếu service name work)
   - **Forward Port:** `3000` (hoặc `80` nếu dùng service name)
   - **Block Common Exploits:** ✅ ON
   - **Websockets Support:** ✅ ON
3. Click **"Save"**

### Bước 4: Update Backend Service (nếu cần)

**Trong Portainer:**
- **Services** → `ductri-task-manager_backend` → **Update the service**
- Để áp dụng ALLOWED_ORIGINS mới

---

## ✅ Test sau khi deploy

### Test 1: NPM Forward

1. Truy cập: `http://it.ductridn.com`
2. **Kết quả mong đợi:** Hiển thị login page (không phải "Congratulations!")

### Test 2: Favicon

1. Check Network tab trong DevTools
2. `favicon.ico` phải trả về 200 (không phải 502)

### Test 3: Google OAuth

1. Click **"Đăng nhập bằng Google"**
2. **Kết quả mong đợi:** Mở popup Google login (không còn 403)

---

## 🎯 Checklist

- [ ] Rebuild frontend image (vì đã sửa nginx.conf)
- [ ] Update stack trong Portainer hoặc docker stack deploy
- [ ] Verify NPM config: Forward to `192.168.40.132:3000` (hoặc service name)
- [ ] Update backend service (nếu cần)
- [ ] Test: `http://it.ductridn.com` → Login page
- [ ] Test: `favicon.ico` → 200 OK
- [ ] Test: Google OAuth → Không còn 403

---

## 🚨 Nếu vẫn 502

### Kiểm tra NPM Logs:

1. Portainer → Containers → `proxy-manager` → **Logs**
2. Refresh `http://it.ductridn.com`
3. Xem logs để biết lỗi cụ thể

### Kiểm tra Frontend Container:

```bash
# Test từ bên trong frontend container
docker exec -it <frontend-container-id> wget -O- http://localhost

# Phải trả về HTML với <div id="root"></div>
```

### Kiểm tra Network:

```bash
# Test từ NPM container
docker exec -it <npm-container-id> wget -O- http://192.168.40.132:3000

# Phải trả về HTML
```

---

## 📝 Tóm tắt thay đổi

1. ✅ **nginx.conf:** `server_name _;` (accept any hostname)
2. ✅ **ALLOWED_ORIGINS:** Đã có HTTP và HTTPS origins
3. ⚠️ **Cần rebuild frontend** để áp dụng nginx.conf mới
4. ⚠️ **Cần update stack** để deploy image mới
