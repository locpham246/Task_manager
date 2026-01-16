# Environment Variables Explained - Simple Guide

## 🤔 What Are These Variables?

These are **configuration settings** that tell your backend server:
- **Which email account** to use for sending emails
- **What password** to use (App Password, not your regular password)

Think of them like **login credentials** for the email service.

---

## 📝 Step-by-Step: What to Do

### Step 1: Find or Create `.env` File

1. Go to: `personal_task/backend/` folder
2. Look for a file named `.env` (it might be hidden)
3. If it doesn't exist, **create a new file** named `.env` (no extension, just `.env`)

**Location:** `D:\Locproject\Task_manager-home\personal_task\backend\.env`

---

### Step 2: Add These Lines to `.env` File

Open the `.env` file and add these 3 lines:

```env
GMAIL_USER=your-email@ductridn.edu.vn
GMAIL_APP_PASSWORD=your-16-char-app-password
SYSTEM_URL=http://localhost:5173
```

---

### Step 3: Replace with YOUR Actual Values

**Example 1: If your email is `admin@ductridn.edu.vn`**

```env
GMAIL_USER=admin@ductridn.edu.vn
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
SYSTEM_URL=http://localhost:5173
```

**Example 2: If your email is `loc.pp@ductridn.edu.vn`**

```env
GMAIL_USER=loc.pp@ductridn.edu.vn
GMAIL_APP_PASSWORD=wxyz abcd efgh ijkl
SYSTEM_URL=http://localhost:5173
```

---

## 🔑 How to Get the App Password

### What is App Password?
- It's a **special password** for apps (not your regular Google password)
- It's **16 characters** long (looks like: `abcd efgh ijkl mnop`)
- You need to **generate it** from your Google account

### How to Generate:

1. **Go to Google Account**: https://myaccount.google.com/
2. Click **"Security"** (left sidebar)
3. Under **"How you sign in to Google"**, find **"2-Step Verification"**
   - If it's OFF → Turn it ON first (required!)
4. After 2-Step Verification is ON, you'll see **"App Passwords"**
5. Click **"App Passwords"**
6. Select:
   - **App**: Choose "Mail"
   - **Device**: Choose "Other (Custom name)" → Type "Task Management System"
7. Click **"Generate"**
8. **Copy the password** (it will look like: `abcd efgh ijkl mnop`)
   - **Remove spaces** when adding to `.env`: `abcdefghijklmnop`

---

## 📋 Complete Example

Let's say:
- Your email: `loc.pp@ductridn.edu.vn`
- Your App Password: `abcd efgh ijkl mnop`

Your `.env` file should look like this:

```env
# Database settings (you probably already have these)
GOOGLE_CLIENT_ID=your-google-client-id
JWT_SECRET=your-jwt-secret
DB_USER=your-db-user
DB_HOST=localhost
DB_NAME=your-db-name
DB_PASSWORD=your-db-password
DB_PORT=5432
PORT=5000

# Gmail SMTP (Google Workspace) - ADD THESE NEW LINES
GMAIL_USER=loc.pp@ductridn.edu.vn
GMAIL_APP_PASSWORD=abcdefghijklmnop
SYSTEM_URL=http://localhost:5173
```

**Important Notes:**
- ✅ Use your **actual email** (the one you use to log in)
- ✅ Use the **App Password** (not your regular password!)
- ✅ **Remove spaces** from App Password
- ✅ No quotes needed around values

---

## ❌ Common Mistakes

### ❌ Wrong:
```env
GMAIL_USER="loc.pp@ductridn.edu.vn"  # Don't use quotes
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # Don't keep spaces
```

### ✅ Correct:
```env
GMAIL_USER=loc.pp@ductridn.edu.vn  # No quotes
GMAIL_APP_PASSWORD=abcdefghijklmnop  # No spaces
```

---

## 🔍 How to Check if It's Working

1. **Save the `.env` file**
2. **Restart your backend server** (stop and start again)
3. **Try inviting a user** from the admin panel
4. **Check the email inbox** - you should receive the invitation!

---

## 🆘 Still Confused?

**Think of it like this:**
- `GMAIL_USER` = Your email address (like a username)
- `GMAIL_APP_PASSWORD` = Special password for apps (like a password)
- `SYSTEM_URL` = Where your website is (for email links)

Just like logging into Gmail, but for your app to send emails automatically!

---

## 📍 File Location Reminder

Your `.env` file should be here:
```
D:\Locproject\Task_manager-home\personal_task\backend\.env
```

If you can't find it, **create a new file** named `.env` in that folder!
