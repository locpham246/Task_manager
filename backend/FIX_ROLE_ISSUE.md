# Fix: Role Not Updating After Database Change

## 🔍 The Problem

When you change a user's role in the database, the JWT token still contains the **old role**. The system reads the role from the JWT token, not from the database on each request.

**Why?**
- JWT token is created during login with the role from database
- Token is stored in browser (localStorage)
- Token contains: `{ id, email, role }`
- Middleware reads role from JWT, not database
- Even if you update database, JWT still has old role

---

## ✅ Solution 1: Log Out and Log Back In (Easiest)

1. **Log out** from the application
2. **Log back in** with Google OAuth
3. New JWT token will be created with **updated role from database**

This is the **simplest and recommended** solution.

---

## ✅ Solution 2: Use Token Refresh Endpoint (New Feature)

I've added a new endpoint that refreshes your token with the latest role from database:

### How to Use:

**Option A: Via Browser Console**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Run this code:

```javascript
// Get current token
const token = localStorage.getItem('token') || sessionStorage.getItem('token');

// Call refresh endpoint
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
    // Update token in storage
    localStorage.setItem('token', data.token);
    // Update user in context
    window.location.reload(); // Refresh page to get new role
    console.log('✅ Token refreshed! New role:', data.user.role);
  } else {
    console.error('❌ Error:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

**Option B: Add Refresh Button (Future Enhancement)**
We could add a "Refresh Session" button in the UI, but for now, use Solution 1 or Option A.

---

## ✅ Solution 3: Direct Database Update + Logout/Login

1. **Update database** (you already did this):
   ```sql
   UPDATE users SET role = 'super_admin' WHERE email = 'loc.pp@ductridn.edu.vn';
   ```

2. **Verify in database**:
   ```sql
   SELECT email, role FROM users WHERE email = 'loc.pp@ductridn.edu.vn';
   ```
   Should show: `role = 'super_admin'`

3. **Log out** from the application

4. **Log back in** - you'll get a new JWT with `super_admin` role

---

## 🔍 Verify Your Current Role

### Check Database:
```sql
SELECT id, email, role FROM users WHERE email = 'loc.pp@ductridn.edu.vn';
```

### Check JWT Token (in browser):
1. Open Developer Tools (F12)
2. Application/Storage → Local Storage
3. Find `token` key
4. Copy the token value
5. Go to https://jwt.io
6. Paste token in "Encoded" section
7. Check the `role` field in the payload

**If database shows `super_admin` but JWT shows `member`:** You need to log out and log back in!

---

## 🛠️ Quick Fix Script

If you want to quickly refresh your token, save this as a bookmark or run in console:

```javascript
javascript:(function(){
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) { alert('No token found! Please log in first.'); return; }
  fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(d => {
    if (d.success) {
      localStorage.setItem('token', d.token);
      alert('Token refreshed! Role: ' + d.user.role);
      window.location.reload();
    } else {
      alert('Error: ' + d.message);
    }
  })
  .catch(e => alert('Error: ' + e.message));
})();
```

---

## 📝 Summary

**The Issue:** JWT token stores role at login time, doesn't update when database changes.

**The Fix:** 
1. ✅ **Easiest:** Log out → Log back in
2. ✅ **Alternative:** Use `/api/auth/refresh` endpoint
3. ✅ **Manual:** Update database → Logout → Login

**After fix:** Your role will match what's in the database!

---

## 🚨 Prevention

In the future, when changing roles:
1. Update role in database
2. Tell the user to **log out and log back in**
3. Or use the refresh endpoint

The refresh endpoint is now available at: `POST /api/auth/refresh`
