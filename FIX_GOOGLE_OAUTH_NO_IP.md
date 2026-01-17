# Fix Google OAuth - Không thể dùng IP

## 🔴 Vấn đề

**Google OAuth Console không cho phép:**
- ❌ IP addresses (như `192.168.40.132:3000`)
- ❌ URIs có path trong "Authorized JavaScript origins"
- ✅ Chỉ cho phép domain names (như `http://it.ductridn.com`)

## ✅ Giải pháp: Dùng Domain trong Google OAuth

### Bước 1: Sửa NPM để forward đúng

**NPM phải forward tới service name hoặc IP, nhưng Google OAuth chỉ nhận domain:**

**Option A: Forward tới service name (Khuyến nghị)**

1. Vào NPM: `http://192.168.40.132:81`
2. Proxy Hosts → Edit `it.ductridn.com`
3. Tab "Details":
   - **Forward Hostname/IP:** `ductri-task-manager_frontend` (tên service, không có http://)
   - **Forward Port:** `80` (port trong container)
4. Click **"Save"**

**Option B: Nếu service name không work, dùng IP tạm thời**

1. Forward Hostname/IP: `192.168.40.132`
2. Forward Port: `3000`
3. Nhưng Google OAuth sẽ dùng domain `it.ductridn.com` (không dùng IP)

---

### Bước 2: Cấu hình Google OAuth Console

**Chỉ thêm DOMAIN (không có IP, không có path):**

#### Authorized JavaScript origins:

**Chỉ thêm các domain sau (không có path, không có IP):**

```
http://it.ductridn.com
https://it.ductridn.com
```

**KHÔNG thêm:**
- ❌ `http://192.168.40.132:3000` (IP không được phép)
- ❌ `https://it.ductridn.com/api` (Có path không được phép trong origins)

#### Authorized redirect URIs:

**Có thể có path, nhưng phải dùng domain:**

```
http://it.ductridn.com/api/auth/google/callback
https://it.ductridn.com/api/auth/google/callback
```

**KHÔNG thêm:**
- ❌ `http://192.168.40.132:3000/api/auth/google/callback` (IP không được phép)

---

## 🎯 Workflow

### Development (Port 3000):

1. **Truy cập trực tiếp:** `http://192.168.40.132:3000`
2. **Google OAuth sẽ fail** vì origin là IP
3. **Giải pháp:** Dùng domain `it.ductridn.com` qua NPM

### Production (Domain):

1. **Truy cập:** `http://it.ductridn.com` hoặc `https://it.ductridn.com`
2. **NPM forward tới:** `ductri-task-manager_frontend:80` hoặc `192.168.40.132:3000`
3. **Google OAuth work** vì origin là domain

---

## ✅ Checklist

### NPM Config:
- [ ] Forward Hostname/IP: `ductri-task-manager_frontend` (hoặc `192.168.40.132`)
- [ ] Forward Port: `80` (nếu dùng service name) hoặc `3000` (nếu dùng IP)
- [ ] Test: `http://it.ductridn.com` → Hiển thị login page

### Google OAuth Console:
- [ ] Authorized JavaScript origins:
  - ✅ `http://it.ductridn.com`
  - ✅ `https://it.ductridn.com`
  - ❌ KHÔNG thêm IP
  - ❌ KHÔNG thêm path
- [ ] Authorized redirect URIs:
  - ✅ `http://it.ductridn.com/api/auth/google/callback`
  - ✅ `https://it.ductridn.com/api/auth/google/callback`
  - ❌ KHÔNG thêm IP
- [ ] Click SAVE

### Test:
- [ ] `http://it.ductridn.com` → Login page hiển thị
- [ ] Click "Đăng nhập bằng Google" → Không còn 403
- [ ] OAuth flow hoạt động

---

## 🚨 Lưu ý quan trọng

**Google OAuth chỉ work với domain:**
- ✅ `http://it.ductridn.com` → Work
- ✅ `https://it.ductridn.com` → Work
- ❌ `http://192.168.40.132:3000` → KHÔNG work (IP không được phép)

**Vì vậy:**
- Development: Có thể dùng port 3000 trực tiếp, nhưng Google OAuth sẽ fail
- Production: Phải dùng domain `it.ductridn.com` qua NPM

---

## 📝 Tóm tắt

1. **NPM:** Forward `it.ductridn.com` → `ductri-task-manager_frontend:80` (hoặc IP:3000)
2. **Google OAuth:** Chỉ thêm domain `it.ductridn.com` (không có IP)
3. **Truy cập:** Dùng `http://it.ductridn.com` (không dùng IP:3000 cho OAuth)
