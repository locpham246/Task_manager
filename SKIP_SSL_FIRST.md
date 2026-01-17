# Tạm thời bỏ qua SSL - Dùng HTTP trước

## ✅ Cách làm: Tắt SSL trong NPM

### Bước 1: Về tab "Details" (bỏ qua SSL)

1. Trong dialog "Edit Proxy Host"
2. Click tab **"Details"** (không phải SSL)
3. Kiểm tra:
   - Domain: `it.ductridn.com`
   - Forward to: `ductri-task-manager_frontend:80`
   - Click **"Save"** (KHÔNG vào tab SSL)

### Bước 2: Test với HTTP

Sau khi Save:
- Truy cập: `http://it.ductridn.com` (HTTP, không có S)
- Phải hiển thị trang login (không phải "Congratulations!")

### Bước 3: Bật SSL sau (khi đã OK)

Sau khi HTTP hoạt động:
1. Vào lại Edit Proxy Host
2. Tab **"SSL"** → Request SSL Certificate
3. Nếu vẫn lỗi → Bỏ qua, dùng HTTP tạm thời

---

## 🎯 Mục tiêu ngay bây giờ

**Chỉ cần HTTP hoạt động:**
- ✅ `http://it.ductridn.com` → Hiển thị trang login
- ✅ Không cần HTTPS ngay bây giờ

**HTTPS sẽ làm sau khi HTTP đã OK.**
