# Fix Redirect to ductridn.edu.vn Issue

## 🔴 Vấn đề

Truy cập `https://it.ductridn.com` bị redirect sang `https://ductridn.edu.vn/vi/`

## 🔍 Nguyên nhân có thể

1. **DNS đang trỏ sai** - `it.ductridn.com` đang trỏ tới server của `ductridn.edu.vn`
2. **Browser cache** - Browser đã cache redirect cũ
3. **Có proxy/load balancer khác** trước Nginx Proxy Manager
4. **Frontend container không serve đúng** - Container chưa build hoặc serve sai

---

## ✅ Cách kiểm tra và sửa

### Bước 1: Kiểm tra DNS

**Kiểm tra DNS record:**

```bash
# Trên server hoặc máy local
nslookup it.ductridn.com

# Hoặc
dig it.ductridn.com

# Hoặc kiểm tra online:
# https://www.whatsmydns.net/#A/it.ductridn.com
```

**DNS phải trỏ về IP của server Docker:**
- ✅ `A record`: `it.ductridn.com` → `192.168.40.132` (IP server của bạn)
- ❌ KHÔNG được trỏ về IP của `ductridn.edu.vn`

**Nếu DNS sai:**
1. Vào DNS provider (GoDaddy, Namecheap, Cloudflare, etc.)
2. Tìm record cho `it.ductridn.com`
3. Đảm bảo A record trỏ về `192.168.40.132`
4. Đợi DNS propagate (5-30 phút)

---

### Bước 2: Xóa Browser Cache

**Clear cache và cookies:**

1. **Chrome/Edge:**
   - `Ctrl + Shift + Delete` (Windows) hoặc `Cmd + Shift + Delete` (Mac)
   - Chọn "Cached images and files" và "Cookies"
   - Time range: "All time"
   - Click "Clear data"

2. **Hoặc dùng Incognito/Private mode:**
   - `Ctrl + Shift + N` (Chrome) hoặc `Ctrl + Shift + P` (Firefox)

3. **Hoặc xóa cache cho domain cụ thể:**
   - F12 → Application → Storage → Clear site data

---

### Bước 3: Test trực tiếp từ container frontend

**Kiểm tra container có serve đúng không:**

```bash
# Lấy container ID của frontend
docker ps | grep frontend

# Test từ container
docker exec -it <frontend-container-id> wget -O- http://localhost

# Hoặc test từ server
curl http://localhost:80 -H "Host: it.ductridn.com"

# Kiểm tra từ container khác trong network
docker exec -it <npm-container-id> wget -O- http://frontend:80
```

**Kết quả mong đợi:**
- ✅ Phải trả về HTML của React app (có `<div id="root"></div>`)
- ❌ KHÔNG phải redirect 301/302

---

### Bước 4: Kiểm tra Nginx Proxy Manager logs

**Xem logs để biết request đi đâu:**

1. Vào Portainer
2. Tìm container `ductri-task-manager_proxy-manager`
3. Click **Logs**
4. Refresh trang `https://it.ductridn.com`
5. Xem logs để thấy:
   - Request có tới NPM không?
   - NPM forward tới đâu?
   - Có lỗi gì không?

---

### Bước 5: Test bypass NPM (nếu cần)

**Tạm thời test trực tiếp container:**

```bash
# Expose port tạm thời (thêm vào docker-compose.swarm.yml tạm thời)
# Chỉ để test, xóa sau khi xác nhận
```

**Hoặc kiểm tra nội dung container:**

```bash
# Vào container frontend
docker exec -it <frontend-container-id> sh

# Kiểm tra files
ls -la /usr/share/nginx/html/

# Xem index.html
cat /usr/share/nginx/html/index.html

# Phải có:
# - index.html
# - assets/ folder với JS/CSS files
```

---

### Bước 6: Kiểm tra có proxy khác không

**Kiểm tra firewall/routing rules:**

```bash
# Kiểm tra iptables
sudo iptables -L -n -v | grep 80
sudo iptables -L -n -v | grep 443

# Kiểm tra có service nào listen port 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Chỉ NPM container nên listen port 80/443
# Nếu có service khác → tắt hoặc đổi port
```

---

## 🎯 Quick Fix Checklist

- [ ] **Kiểm tra DNS:** `nslookup it.ductridn.com` → Phải về `192.168.40.132`
- [ ] **Clear browser cache:** Ctrl+Shift+Delete → Clear all
- [ ] **Test Incognito mode:** Mở tab ẩn danh, thử lại
- [ ] **Kiểm tra NPM logs:** Portainer → proxy-manager → Logs
- [ ] **Test container:** `docker exec -it <frontend> wget -O- http://localhost`
- [ ] **Kiểm tra firewall:** `sudo netstat -tlnp | grep :80`

---

## 🚨 Nếu vẫn không được

**Các bước debug tiếp:**

1. **Tạm thời expose port frontend trực tiếp:**
   - Sửa `docker-compose.swarm.yml`:
     ```yaml
     frontend:
       ports:
         - "8080:80"  # Tạm thời
     ```
   - Test: `http://server-ip:8080`
   - Nếu work → Vấn đề ở NPM hoặc DNS
   - Nếu không work → Vấn đề ở frontend container

2. **Kiểm tra build frontend:**
   ```bash
   # Rebuild frontend
   cd personal_task
   docker-compose -f docker-compose.swarm.yml build frontend
   
   # Update service
   docker stack deploy -c docker-compose.swarm.yml ductri-task-manager
   ```

3. **Kiểm tra network:**
   ```bash
   # Tất cả services phải trong cùng network
   docker network inspect ductri-task-manager_ductri-network
   
   # Phải thấy: frontend, backend, proxy-manager, postgres
   ```

---

## 📝 Expected Result

Sau khi fix:
- ✅ `https://it.ductridn.com` → Hiển thị trang login (không redirect)
- ✅ `https://it.ductridn.com/login` → Hiển thị trang login
- ✅ Không còn redirect sang `ductridn.edu.vn`
