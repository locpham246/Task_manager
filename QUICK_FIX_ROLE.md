# 🔧 Quick Fix: Still Showing as Member

## The Problem
You updated the database role to `super_admin`, but you're still seeing yourself as `member` in the website.

**Why?** Your JWT token still has the old role stored in it.

---

## ✅ **EASIEST FIX: Log Out and Log Back In**

1. **Click "Đăng xuất" (Logout)** in the top right menu
2. **Log back in** with Google OAuth
3. **Done!** You'll now have `super_admin` role

This creates a **new JWT token** with the updated role from the database.

---

## 🔍 Verify Database First

Run this in pgAdmin4 to confirm your role is correct:

```sql
SELECT email, role FROM users WHERE email = 'loc.pp@ductridn.edu.vn';
```

**Should show:** `role = 'super_admin'`

If it shows `member`, update it:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'loc.pp@ductridn.edu.vn';
```

---

## 🚀 Alternative: Use Refresh Endpoint (No Logout Needed)

If you don't want to log out, use the browser console:

1. **Open Developer Tools** (Press F12)
2. **Go to Console tab**
3. **Paste and run this:**

```javascript
const token = localStorage.getItem('token');
if (!token) {
  console.error('No token found! Please log in first.');
} else {
  fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token refreshed! New role:', data.user.role);
      alert('Token refreshed! Role: ' + data.user.role + '\nPage will reload...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.error('❌ Error:', data.message);
      alert('Error: ' + data.message);
    }
  })
  .catch(err => {
    console.error('Error:', err);
    alert('Error refreshing token');
  });
}
```

4. **Page will reload** with your new role!

---

## 📝 Summary

**The Issue:** JWT token has old role, database has new role.

**The Fix:** 
- ✅ **Easiest:** Log out → Log back in
- ✅ **Alternative:** Run refresh script in console

**After fix:** You'll see `super_admin` role in the website! 🎉
