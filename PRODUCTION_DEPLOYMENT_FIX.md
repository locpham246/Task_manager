# Production Deployment Fix - http://it.ductridn.com

## ✅ Code Changes Made

1. **Backend CORS** - Updated to allow `http://it.ductridn.com`
2. **Frontend API URL** - Now uses environment variable instead of hardcoded localhost
3. **Vite Config** - Added `it.ductridn.com` to allowed hosts

## 🔧 Required Actions

### 1. Update Google OAuth Client ID (CRITICAL)

**In Google Cloud Console:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `1084886023567-rrrqtka0lt87gcuggf8147ov62qcvd6f.apps.googleusercontent.com`
3. Click **Edit**
4. Under **Authorized JavaScript origins**, add:
   - `http://it.ductridn.com`
5. Under **Authorized redirect URIs**, add:
   - `http://it.ductridn.com/login`
6. Click **Save**

**Without this, Google OAuth will fail with "The given origin is not allowed" error!**

### 2. Update Docker Compose Environment Variables

**In your production server (`/home/adminit/task-manager/`):**

Update `.env` file or docker-compose.yml with:

```yaml
backend:
  environment:
    ALLOWED_ORIGINS: http://it.ductridn.com,http://localhost:5173,http://localhost

frontend:
  environment:
    VITE_API_URL: http://it.ductridn.com:5000/api
    # OR if backend is on same domain:
    # VITE_API_URL: http://localhost:5000/api
```

**If backend is accessible via `it.ductridn.com:5000`, use:**
```yaml
VITE_API_URL: http://it.ductridn.com:5000/api
```

**If backend is only accessible internally, use internal IP:**
```yaml
VITE_API_URL: http://192.168.40.132:5000/api
```

### 3. Rebuild and Restart Services

```bash
cd /home/adminit/task-manager
docker-compose down
docker-compose build --no-cache frontend backend
docker-compose up -d
```

Or if using Portainer:
- Update stack configuration with new environment variables
- Redeploy stack

### 4. Verify Backend API is Accessible

Test if backend API is accessible from frontend domain:

```bash
curl -I http://it.ductridn.com:5000/api/auth/test
# OR
curl -I http://192.168.40.132:5000/api/auth/test
```

Should return HTTP 200 or 404 (not CORS error).

### 5. Check Nginx/Reverse Proxy Configuration

If using Nginx as reverse proxy, ensure:

```nginx
# Frontend
server {
    listen 80;
    server_name it.ductridn.com;
    
    location / {
        proxy_pass http://localhost:80;
        # OR if frontend serves on different port:
        # proxy_pass http://localhost:5173;
    }
}

# Backend API
server {
    listen 5000;
    server_name it.ductridn.com;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Troubleshooting

### CORS Error Still Happening?

1. Check backend logs:
   ```bash
   docker-compose logs backend | grep CORS
   ```

2. Verify `ALLOWED_ORIGINS` environment variable is set:
   ```bash
   docker-compose exec backend env | grep ALLOWED_ORIGINS
   ```

3. Restart backend:
   ```bash
   docker-compose restart backend
   ```

### Google OAuth Still Failing?

1. **Verify origin is added** in Google Cloud Console (step 1 above)
2. **Wait 5-10 minutes** after adding - Google may cache changes
3. **Clear browser cache** and try again
4. **Check browser console** for specific error message

### API Connection Failed?

1. Check `VITE_API_URL` is set correctly:
   ```bash
   docker-compose exec frontend env | grep VITE_API_URL
   ```

2. Test API from frontend container:
   ```bash
   docker-compose exec frontend wget -O- http://it.ductridn.com:5000/api/auth/test
   # OR
   docker-compose exec frontend wget -O- http://192.168.40.132:5000/api/auth/test
   ```

3. Rebuild frontend if API URL changed:
   ```bash
   docker-compose build --no-cache frontend
   docker-compose up -d frontend
   ```

## ✅ Verification Checklist

- [ ] Google OAuth Client ID has `http://it.ductridn.com` in Authorized origins
- [ ] `ALLOWED_ORIGINS` environment variable includes `http://it.ductridn.com`
- [ ] `VITE_API_URL` points to correct backend (production domain or internal IP)
- [ ] Backend is accessible from frontend domain
- [ ] Services rebuilt and restarted
- [ ] No CORS errors in browser console
- [ ] No "origin not allowed" errors for Google OAuth

## 📝 Summary of Changes

1. ✅ **Backend CORS** - Now allows `http://it.ductridn.com`
2. ✅ **Frontend API** - Uses `VITE_API_URL` environment variable
3. ✅ **Vite Config** - Allows `it.ductridn.com` host
4. ⚠️ **REQUIRED:** Update Google OAuth Client ID in Google Cloud Console
5. ⚠️ **REQUIRED:** Set `VITE_API_URL` environment variable in production
