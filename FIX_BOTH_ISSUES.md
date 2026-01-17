# Fix NPM và Google OAuth - Cả 2 vấn đề

## 🔴 Vấn đề 1: NPM chưa forward đúng

**`http://it.ductridn.com` vẫn hiển thị "Congratulations!"**

→ NPM chưa forward request tới frontend

## ✅ Sửa NPM Config

### Kiểm tra và sửa:

1. **Vào NPM:** `http://192.168.40.132:81`
2. **Proxy Hosts** → Tìm entry `it.ductridn.com`
3. **Click "Edit"**

### Tab "Details" - Kiểm tra:

- **Domain Names:** `it.ductridn.com` ✅
- **Scheme:** `http` ✅
- **Forward Hostname/IP:** Phải là `192.168.40.132` (hoặc `ductri-task-manager_frontend`)
- **Forward Port:** Phải là `3000` (hoặc `80` nếu dùng service name)
- **Block Common Exploits:** ✅ ON
- **Websockets Support:** ✅ ON

### Nếu chưa đúng, sửa:

1. **Forward Hostname/IP:** `192.168.40.132`
2. **Forward Port:** `3000`
3. Click **"Save"**
4. Đợi 2-3 giây

### Test:

- `http://it.ductridn.com` → Phải hiển thị login page (không phải "Congratulations!")

---

## 🔴 Vấn đề 2: Google OAuth 403 với IP

**Lỗi:** `The given origin is not allowed for the given client ID`

**Nguyên nhân:** Đang truy cập qua `http://192.168.40.132:3000` → Origin là IP → Google từ chối

## ✅ Giải pháp: Dùng Domain thay vì IP

**Google OAuth chỉ work với domain, không work với IP.**

### Cách sửa:

**Sau khi NPM đã forward đúng:**

1. **KHÔNG dùng:** `http://192.168.40.132:3000` ❌
2. **Dùng:** `http://it.ductridn.com` ✅

### Google OAuth Console đã cấu hình:

**Authorized JavaScript origins:**
```
http://it.ductridn.com
https://it.ductridn.com
```

**Authorized redirect URIs:**
```
http://it.ductridn.com/api/auth/google/callback
https://it.ductridn.com/api/auth/google/callback
```

**Lưu ý:** Đã có domain `it.ductridn.com` trong Google Console → Chỉ cần dùng domain để truy cập.

---

## 🎯 Workflow đúng

### ❌ SAI:
1. Truy cập: `http://192.168.40.132:3000` → Google OAuth 403 (vì origin là IP)

### ✅ ĐÚNG:
1. Sửa NPM: Forward `it.ductridn.com` → `192.168.40.132:3000`
2. Truy cập: `http://it.ductridn.com` → Google OAuth work (vì origin là domain)

---

## 📝 Checklist

### NPM:
- [ ] Forward Hostname/IP: `192.168.40.132`
- [ ] Forward Port: `3000`
- [ ] Block Common Exploits: ON
- [ ] Websockets Support: ON
- [ ] Click Save
- [ ] Test: `http://it.ductridn.com` → Login page (không phải "Congratulations!")

### Google OAuth:
- [ ] Đã thêm `http://it.ductridn.com` vào origins ✅
- [ ] Đã thêm `https://it.ductridn.com` vào origins ✅
- [ ] Đã thêm redirect URIs ✅

### Test:
- [ ] `http://it.ductridn.com` → Hiển thị login page
- [ ] Click "Đăng nhập bằng Google" → Không còn 403
- [ ] OAuth flow hoạt động

---

## 🚨 Lưu ý quan trọng

**Port 3000 trực tiếp (`http://192.168.40.132:3000`):**
- Frontend hiển thị OK ✅
- Google OAuth sẽ FAIL ❌ (vì origin là IP)

**Domain qua NPM (`http://it.ductridn.com`):**
- Frontend hiển thị OK ✅ (sau khi NPM forward đúng)
- Google OAuth sẽ WORK ✅ (vì origin là domain)

**→ Phải dùng domain `it.ductridn.com` để Google OAuth work!**
