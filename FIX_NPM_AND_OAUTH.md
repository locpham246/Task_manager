# Fix NPM Config và Google OAuth

## 🔴 Vấn đề 1: NPM chưa forward đúng

**Hiện tại trong NPM:**
- Forward Hostname/IP: `192.168.40.132` ❌
- Forward Port: `3000` ❌

**Phải sửa thành:**
- Forward Hostname/IP: `ductri-task-manager_frontend` ✅
- Forward Port: `80` ✅

## ✅ Sửa NPM Config

### Bước 1: Vào NPM Admin

1. Truy cập: `http://192.168.40.132:81` hoặc `http://it.ductridn.com:81`
2. Login vào NPM

### Bước 2: Edit Proxy Host

1. **Proxy Hosts** → Tìm entry `it.ductridn.com`
2. Click **"Edit"**

### Bước 3: Sửa tab "Details"

**Xóa IP và port cũ, thay bằng service name:**

- **Domain Names:** `it.ductridn.com` (giữ nguyên)
- **Scheme:** `http` (giữ nguyên)
- **Forward Hostname/IP:** `ductri-task-manager_frontend` ⚠️ **SỬA TỪ `192.168.40.132`**
- **Forward Port:** `80` ⚠️ **SỬA TỪ `3000`**
- **Block Common Exploits:** ✅ BẬT (ON)
- **Websockets Support:** ✅ BẬT (ON)
- Click **"Save"**

### Bước 4: Test

Sau khi Save:
- `http://it.ductridn.com` → Phải hiển thị trang login (không phải "Congratulations!")

---

## 🔴 Vấn đề 2: Google OAuth Origin không được phép

**Lỗi:** `The given origin is not allowed for the given client ID`

**Nguyên nhân:** Google OAuth Client ID chưa có origin `http://192.168.40.132:3000` hoặc `http://it.ductridn.com`

## ✅ Sửa Google OAuth Console

### Bước 1: Vào Google Cloud Console

1. Truy cập: https://console.cloud.google.com/
2. Chọn project của bạn
3. **APIs & Services** → **Credentials**
4. Tìm OAuth 2.0 Client ID: `1084886023567-rrrqtka0lt87gcuggf8147ov62qcvd6f.apps.googleusercontent.com`
5. Click vào để edit

### Bước 2: Thêm Authorized JavaScript origins

**Thêm các origins sau:**

```
http://192.168.40.132:3000
http://it.ductridn.com
https://it.ductridn.com
```

**Lưu ý:**
- Thêm từng origin một
- Click **"+ ADD URI"** cho mỗi origin
- Click **"SAVE"** sau khi thêm tất cả

### Bước 3: Thêm Authorized redirect URIs (nếu cần)

**Thêm các redirect URIs:**

```
http://192.168.40.132:3000/api/auth/google/callback
http://it.ductridn.com/api/auth/google/callback
https://it.ductridn.com/api/auth/google/callback
```

---

## ✅ Sửa Backend ALLOWED_ORIGINS

**Cập nhật `docker-compose.swarm.yml` để cho phép cả HTTP origin:**

```yaml
backend:
  environment:
    ALLOWED_ORIGINS: "https://it.ductridn.com,http://it.ductridn.com,http://192.168.40.132:3000"
```

**Hoặc trong Portainer:**
- Services → `ductri-task-manager_backend` → Environment variables
- Sửa `ALLOWED_ORIGINS` thành:
  ```
  https://it.ductridn.com,http://it.ductridn.com,http://192.168.40.132:3000
  ```
- Update service để áp dụng

---

## 🎯 Checklist

### NPM Config:
- [ ] Forward Hostname/IP = `ductri-task-manager_frontend` (không phải IP)
- [ ] Forward Port = `80` (không phải 3000)
- [ ] Block Common Exploits = ON
- [ ] Websockets Support = ON
- [ ] Click Save
- [ ] Test: `http://it.ductridn.com` → Hiển thị login page

### Google OAuth:
- [ ] Thêm `http://192.168.40.132:3000` vào Authorized JavaScript origins
- [ ] Thêm `http://it.ductridn.com` vào Authorized JavaScript origins
- [ ] Thêm `https://it.ductridn.com` vào Authorized JavaScript origins
- [ ] Thêm redirect URIs tương ứng
- [ ] Click SAVE trong Google Console

### Backend:
- [ ] Update `ALLOWED_ORIGINS` để bao gồm cả HTTP origins
- [ ] Update service để áp dụng env vars mới

---

## ✅ Sau khi fix

**Test:**
1. `http://it.ductridn.com` → Hiển thị login page ✅
2. Click "Đăng nhập bằng Google" → Không còn lỗi 403 ✅
3. OAuth flow hoạt động bình thường ✅

---

## 🚨 Lưu ý

**Sau khi NPM hoạt động:**
- Có thể xóa port 3000 mapping (không cần nữa)
- Hoặc giữ lại để backup/test
- Frontend sẽ truy cập qua `http://it.ductridn.com` hoặc `https://it.ductridn.com`
