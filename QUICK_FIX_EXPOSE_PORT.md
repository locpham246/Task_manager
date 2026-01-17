# Quick Fix: Expose Port Trực tiếp - Bypass NPM

## ✅ Đã sửa: Expose port 8080 cho frontend

**Đã thêm port mapping trong `docker-compose.swarm.yml`:**
```yaml
deploy:
  ports:
    - target: 80
      published: 8080
      protocol: tcp
      mode: host
```

## 🚀 Cách deploy lại

### Bước 1: Update stack

**Trong Portainer:**
1. Vào **Services**
2. Tìm service `ductri-task-manager_frontend`
3. Click **"Update the service"**
4. Hoặc **Re-deploy stack:**
   ```bash
   cd personal_task
   docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
   ```

### Bước 2: Test trực tiếp

**Sau khi deploy:**
- Truy cập: `http://server-ip:8080` hoặc `http://192.168.40.132:8080`
- Phải hiển thị trang login ✅

**Lợi ích:**
- ✅ Bypass NPM hoàn toàn
- ✅ Test frontend trực tiếp
- ✅ Không phụ thuộc vào NPM config

---

## 📝 Sau khi test OK

**Nếu port 8080 hoạt động:**
- Frontend code OK ✅
- Vấn đề ở NPM config ❌

**Tiếp theo:**
- Sửa NPM config sau (hoặc dùng port 8080 tạm thời)
- Hoặc expose port 443 cho HTTPS

---

## 🔒 Expose HTTPS sau (nếu cần)

Nếu muốn HTTPS mà không dùng NPM:
- Cần SSL certificate
- Cấu hình nginx trong frontend container
- Hoặc dùng NPM cho HTTPS (sửa config sau)
