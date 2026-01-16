# Email Setup Guide - Gmail SMTP for Google Workspace

## 📧 Setting Up Email Notifications

Since you're using **Google Workspace** (`@ductridn.edu.vn`), you get **2,000 emails/day** - perfect for invitations!

---

## 🔧 Step 1: Generate Gmail App Password

### For Google Workspace Account:

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (must be enabled first)
3. **App Passwords** → **Select app** → Choose "Mail"
4. **Select device** → Choose "Other (Custom name)" → Enter "Task Management System"
5. **Generate** → Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

**Important:** 
- Remove spaces when using: `abcdefghijklmnop`
- Keep this password secret!

---

## 🔧 Step 2: Add to Environment Variables

Add these to your `.env` file in `personal_task/backend/`:

```env
# Gmail SMTP Configuration (Google Workspace)
GMAIL_USER=your-email@ductridn.edu.vn
GMAIL_APP_PASSWORD=abcdefghijklmnop

# System URL (for email links)
SYSTEM_URL=http://localhost:5173
# Or for production:
# SYSTEM_URL=https://your-domain.com
```

**Example:**
```env
GMAIL_USER=admin@ductridn.edu.vn
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
SYSTEM_URL=http://localhost:5173
```

---

## ✅ Step 3: Test Email Sending

After adding the environment variables:

1. **Restart your backend server**
2. **Invite a user** through the admin panel
3. **Check the email** - invitation should arrive within seconds!

---

## 🚨 Troubleshooting

### "Email service not configured"
- ✅ Check `.env` file has `GMAIL_USER` and `GMAIL_APP_PASSWORD`
- ✅ Restart backend server after adding variables

### "Invalid login" or "Authentication failed"
- ✅ Make sure 2-Step Verification is enabled
- ✅ Use App Password (not your regular password)
- ✅ Remove spaces from App Password
- ✅ Check email is correct: `your-email@ductridn.edu.vn`

### "Email not sending"
- ✅ Check Google Workspace admin hasn't disabled SMTP
- ✅ Verify App Password is still valid
- ✅ Check backend console for error messages

### "Rate limit exceeded"
- ✅ Google Workspace: 2,000 emails/day limit
- ✅ For your use case (invitations only), this is MORE than enough!

---

## 📊 Email Limits

| Account Type | Daily Limit | Your Usage |
|--------------|-------------|------------|
| **Google Workspace** | 2,000/day | ~15-75/month ✅ |
| Free Gmail | 500/day | N/A |

**Your limit:** 2,000 emails/day = **60,000/month** (way more than needed!)

---

## 🔒 Security Notes

1. **Never commit `.env` file** to Git
2. **App Password is secret** - don't share it
3. **Use different App Password** for production vs development
4. **Rotate App Passwords** periodically

---

## 🎯 What Happens When Admin Invites User?

1. ✅ Admin clicks "Gửi lời mời" (Send invitation)
2. ✅ System validates email (@ductridn.edu.vn)
3. ✅ **Email is sent** with invitation link
4. ✅ User receives email with instructions
5. ✅ User clicks link → goes to login page
6. ✅ User logs in with Google OAuth
7. ✅ User is added to system automatically

---

## 📝 Email Template

The invitation email includes:
- ✅ Welcome message
- ✅ Inviter's name
- ✅ Login instructions
- ✅ Direct link to login page
- ✅ Professional design with school branding

---

## 🚀 Ready to Use!

Once you've added the environment variables and restarted the server, email notifications will work automatically! 🎉
