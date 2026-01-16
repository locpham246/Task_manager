# Fix All Issues

## Issue 1: Cross-Origin-Opener-Policy Warning ⚠️

**Status:** This is just a **warning**, not an error. It doesn't break functionality.

**What it is:** Vite's hot module reload (HMR) client warning. It's safe to ignore.

**If you want to suppress it:** The headers are already configured in `vite.config.js`. This warning appears in development only and won't affect production.

---

## Issue 2: Duplicate Key Error ✅ FIXED

**Error:** `duplicate key value violates unique constraint "task_assignees_task_id_user_id_key"`

**Cause:** You ran the migration SQL multiple times, trying to insert the same data again.

**Fix:** I've updated the migration SQL to check if data already exists before inserting.

**What to do:**
- The error is harmless - it just means the data already exists
- The migration SQL is now fixed for future runs
- **No action needed** - your database is fine!

---

## Issue 3: Still Showing as Member 🔴 **THIS IS THE MAIN ISSUE**

**Problem:** Your JWT token still has the old `member` role, even though the database shows `super_admin`.

**Why:** JWT tokens store the role at login time. When you change the role in the database, the token doesn't automatically update.

---

## ✅ **SOLUTION: Log Out and Log Back In**

This is the **easiest and most reliable** fix:

1. **Click "Đăng xuất" (Logout)** button in the top right menu
2. **You'll be redirected to login page**
3. **Click "Đăng nhập với Google"** again
4. **Done!** You'll now have `super_admin` role

**Why this works:** Logging out clears the old JWT token. Logging back in creates a new token with the updated role from the database.

---

## 🔍 Verify Your Database First

Run this in pgAdmin4 to make sure your role is correct:

```sql
SELECT email, role FROM users WHERE email = 'loc.pp@ductridn.edu.vn';
```

**Should show:** `role = 'super_admin'`

If it shows `member`, update it:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'loc.pp@ductridn.edu.vn';
```

Then **log out and log back in**.

---

## 🚀 Alternative: Refresh Token (No Logout Needed)

If you don't want to log out, use the browser console:

1. **Press F12** to open Developer Tools
2. **Go to Console tab**
3. **Paste and run this code:**

```javascript
const token = localStorage.getItem('token');
if (!token) {
  alert('No token found! Please log in first.');
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
      alert('✅ Token refreshed! New role: ' + data.user.role + '\nPage will reload...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      alert('❌ Error: ' + data.message);
    }
  })
  .catch(err => {
    console.error('Error:', err);
    alert('Error refreshing token');
  });
}
```

4. **Page will automatically reload** with your new role!

---

## 📝 Summary

| Issue | Status | Action Needed |
|-------|--------|---------------|
| COOP Warning | ⚠️ Warning only | Ignore (safe) |
| Duplicate Key Error | ✅ Fixed | None (already handled) |
| Still Member Role | 🔴 **Main Issue** | **Log out → Log back in** |

---

## 🎯 Quick Steps to Fix Role Issue

1. ✅ Verify database: `SELECT email, role FROM users WHERE email = 'loc.pp@ductridn.edu.vn';`
2. ✅ If not `super_admin`, run: `UPDATE users SET role = 'super_admin' WHERE email = 'loc.pp@ductridn.edu.vn';`
3. ✅ **Log out** from the website
4. ✅ **Log back in** with Google OAuth
5. ✅ You'll now have `super_admin` access!

---

**After logging out and back in, everything will work correctly!** 🎉
