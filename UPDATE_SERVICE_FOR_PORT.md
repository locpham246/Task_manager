# Update Service để áp dụng Port 3000

## 🔴 Vấn đề: Connection Refused trên port 3000

**Lỗi:** `ERR_CONNECTION_REFUSED` khi truy cập `192.168.40.132:3000`

**Nguyên nhân:** Service chưa được update sau khi thay đổi docker-compose

## ✅ Cách fix: Update Service trong Portainer

### Bước 1: Vào Portainer → Services

1. Mở Portainer trên server Docker
2. Vào **Services**
3. Tìm service: `ductri-task-manager_frontend`

### Bước 2: Update Service

**Option A: Update Service (Khuyến nghị)**

1. Click vào service `ductri-task-manager_frontend`
2. Click **"Update the service"**
3. Chọn **"Recreate"** hoặc **"Force update"**
4. Click **"Update the service"** để confirm

**Option B: Re-deploy Stack**

1. Vào **Stacks**
2. Tìm stack: `ductri-task-manager`
3. Click **"Editor"** hoặc **"Update the stack"**
4. Paste lại nội dung `docker-compose.swarm.yml` (đã có port 3000)
5. Click **"Update the stack"**

### Bước 3: Kiểm tra Port được expose

**Sau khi update:**

1. Vào **Services** → `ductri-task-manager_frontend`
2. Click **"Service details"**
3. Xem **Published Ports:**
   - Phải thấy: `3000:80/tcp` ✅

**Hoặc trong Portainer → Services:**
- Cột **Published Ports** phải hiển thị `3000:80`

### Bước 4: Test lại

**Sau khi update xong (đợi 10-20 giây):**
- Truy cập: `http://192.168.40.132:3000`
- Phải hiển thị trang login ✅

---

## 🚨 Nếu vẫn không được

### Kiểm tra Firewall

**Trên server Docker:**

```bash
# Kiểm tra firewall
sudo ufw status
# hoặc
sudo iptables -L -n -v | grep 3000

# Nếu firewall đang chặn, cho phép:
sudo ufw allow 3000/tcp
```

### Kiểm tra Service đang chạy

**Trong Portainer:**
- Services → Frontend phải `1/1` (không phải `0/1`)
- Nếu `0/1` → Xem **Logs** để biết lỗi

### Test từ server Docker

```bash
# Test từ bên trong server
curl http://localhost:3000

# Hoặc test từ container
docker exec -it <frontend-container-id> wget -O- http://localhost
```

---

## 📝 Checklist

- [ ] Update service trong Portainer
- [ ] Kiểm tra Published Ports = `3000:80`
- [ ] Service status = `1/1`
- [ ] Firewall cho phép port 3000
- [ ] Test: `http://192.168.40.132:3000` → Hiển thị login page
