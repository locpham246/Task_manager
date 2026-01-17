# Fix DNS Issue - it.ductridn.com

## 🔴 Vấn đề

**DNS đang trỏ sai:**
```
it.ductridn.com → 192.168.41.197 ❌
```

**Nhưng server Docker của bạn:**
```
192.168.40.132 ✅
```

---

## ✅ Giải pháp: Sửa DNS Record

### Bước 1: Xác định IP server Docker

**Kiểm tra IP server hiện tại:**

```bash
# Trên server Docker
ip addr show
# Hoặc
ifconfig

# Tìm IP của card mạng chính (thường là eth0 hoặc ens33)
```

**Hoặc kiểm tra từ Portainer:**
- Vào Portainer → Host/Endpoints
- Xem IP của Docker host

**IP server phải là:**
- `192.168.40.132` (nếu đây là server Docker)
- HOẶC `192.168.41.197` (nếu server Docker đã đổi IP)

---

### Bước 2: Sửa DNS Record

**Nếu server Docker là `192.168.40.132`:**

1. **Vào DNS Server (DC01.ductridn.edu - 192.168.1.237)**
   - Đăng nhập vào Windows Server DNS Manager
   - Hoặc liên hệ quản trị viên DNS

2. **Tìm zone `ductridn.com`**

3. **Tìm A record `it` trong zone:**
   - Tên: `it`
   - Type: `A`
   - Data/Value: Hiện tại là `192.168.41.197`

4. **Sửa A record:**
   - Tên: `it` (giữ nguyên)
   - Type: `A` (giữ nguyên)
   - Data/Value: `192.168.40.132` ← **Đổi thành IP server Docker**

5. **Save/Apply**

**Nếu server Docker là `192.168.41.197`:**

- Không cần sửa DNS
- Vấn đề có thể là:
  - Server `192.168.41.197` chưa có Docker services
  - Hoặc có firewall chặn port 80/443
  - Hoặc có service khác đang chạy trên port 80/443

---

### Bước 3: Chờ DNS Propagate

**Sau khi sửa DNS:**
- DNS local: Propagate ngay lập tức
- DNS cache: Có thể cache 5-30 phút

**Xóa DNS cache (nếu cần):**

```bash
# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
# Hoặc
sudo resolvectl flush-caches
```

**Kiểm tra lại:**

```bash
nslookup it.ductridn.com

# Phải trả về:
# Address: 192.168.40.132 (IP server Docker)
```

---

### Bước 4: Kiểm tra Firewall

**Sau khi sửa DNS, đảm bảo firewall cho phép:**

```bash
# Kiểm tra firewall trên server Docker
sudo ufw status
# hoặc
sudo iptables -L -n -v | grep -E '80|443'

# Nếu firewall đang chặn, cho phép:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 🎯 Quick Verification

**Sau khi sửa DNS:**

1. **Flush DNS cache:**
   ```bash
   ipconfig /flushdns  # Windows
   ```

2. **Kiểm tra DNS mới:**
   ```bash
   nslookup it.ductridn.com
   # Phải trả về IP server Docker
   ```

3. **Test từ browser (Incognito mode):**
   - Mở tab ẩn danh
   - Truy cập: `https://it.ductridn.com`
   - Phải hiển thị trang login (không redirect)

---

## 🚨 Nếu không thể sửa DNS

**Tạm thời sử dụng file hosts:**

**Trên máy Windows của bạn:**

1. Mở Notepad với quyền Administrator

2. Mở file:
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```

3. Thêm dòng:
   ```
   192.168.40.132  it.ductridn.com
   ```

4. Save file

5. Flush DNS:
   ```bash
   ipconfig /flushdns
   ```

6. Test: `https://it.ductridn.com`

**⚠️ Lưu ý:** Chỉ áp dụng cho máy bạn. Người khác vẫn cần sửa DNS chính.

---

## 📝 Checklist

- [ ] Xác định IP server Docker (`192.168.40.132` hoặc `192.168.41.197`)
- [ ] Sửa A record `it` trong DNS zone `ductridn.com`
- [ ] Đổi IP từ `192.168.41.197` → `192.168.40.132`
- [ ] Flush DNS cache (`ipconfig /flushdns`)
- [ ] Kiểm tra lại (`nslookup it.ductridn.com`)
- [ ] Test browser (Incognito mode)
- [ ] Kiểm tra firewall cho phép port 80/443

---

## ✅ Expected Result

Sau khi sửa DNS:
- ✅ `nslookup it.ductridn.com` → `192.168.40.132`
- ✅ `https://it.ductridn.com` → Hiển thị trang login (không redirect)
- ✅ Không còn redirect sang `ductridn.edu.vn`
