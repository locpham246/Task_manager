# Fix NPM Config - Đúng cách

## 🔴 Vấn đề

**NPM không forward được vì:**
- Service name `ductri-task-manager_frontend` có thể không resolve được từ NPM container
- Hoặc network không đúng

## ✅ Giải pháp: Dùng IP + Port tạm thời

**Vì port 3000 đã chạy được, dùng IP:3000 trong NPM:**

### Sửa NPM Config:

1. Vào NPM: `http://192.168.40.132:81`
2. Proxy Hosts → Edit `it.ductridn.com`
3. Tab "Details":
   - **Forward Hostname/IP:** `192.168.40.132` ✅ (IP của server)
   - **Forward Port:** `3000` ✅ (Port frontend đang expose)
4. Click **"Save"**

**Lưu ý:** Đây là giải pháp tạm thời. Sau khi test OK, có thể thử lại service name.

---

## 🔴 Vấn đề 2: Google OAuth 403

**Lỗi:** `The given origin is not allowed for the given client ID`

**Nguyên nhân:** Origin `http://192.168.40.132:3000` chưa được thêm vào Google OAuth Console

## ✅ Sửa Google OAuth Console

### Bước 1: Vào Google Cloud Console

1. Truy cập: https://console.cloud.google.com/
2. Chọn project của bạn
3. **APIs & Services** → **Credentials**
4. Tìm OAuth 2.0 Client ID: `1084886023567-rrrqtka0lt87gcuggf8147ov62qcvd6f.apps.googleusercontent.com`
5. Click vào để **Edit**

### Bước 2: Thêm Authorized JavaScript origins

**Trong phần "Authorized JavaScript origins", click "+ ADD URI" và thêm:**

```
http://192.168.40.132:3000
http://it.ductridn.com
https://it.ductridn.com
```

**Lưu ý:** Thêm từng cái một, mỗi cái một dòng.

### Bước 3: Thêm Authorized redirect URIs

**Trong phần "Authorized redirect URIs", click "+ ADD URI" và thêm:**

```
http://192.168.40.132:3000/api/auth/google/callback
http://it.ductridn.com/api/auth/google/callback
https://it.ductridn.com/api/auth/google/callback
```

### Bước 4: Save

Click **"SAVE"** ở dưới cùng của trang.

**Lưu ý:** Có thể mất 1-2 phút để Google cập nhật.

---

## ✅ Test sau khi sửa

### Test 1: NPM Forward

1. Truy cập: `http://it.ductridn.com`
2. Phải hiển thị trang login (không phải "Congratulations!")

### Test 2: Google OAuth

1. Truy cập: `http://192.168.40.132:3000/login`
2. Click **"Đăng nhập bằng Google"**
3. Phải mở popup Google login (không còn lỗi 403)

---

## 🎯 Checklist

- [ ] Sửa NPM: Forward to `192.168.40.132:3000`
- [ ] Thêm `http://192.168.40.132:3000` vào Google OAuth Console
- [ ] Thêm `http://it.ductridn.com` vào Google OAuth Console
- [ ] Thêm `https://it.ductridn.com` vào Google OAuth Console
- [ ] Thêm redirect URIs tương ứng
- [ ] Click SAVE trong Google Console
- [ ] Test: `http://it.ductridn.com` → Login page
- [ ] Test: Google OAuth → Không còn 403

---

## 🚨 Nếu vẫn không được

### Kiểm tra NPM Logs:

1. Portainer → Containers → `proxy-manager` → Logs
2. Refresh `http://it.ductridn.com`
3. Xem logs để biết lỗi cụ thể

### Kiểm tra Google OAuth:

- Đảm bảo đã SAVE trong Google Console
- Đợi 1-2 phút để Google cập nhật
- Clear browser cache và thử lại
