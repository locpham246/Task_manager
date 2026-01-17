# Nginx Proxy Manager Setup - Fix 502 Bad Gateway

## 🔴 Current Problem

**Error:** `502 Bad Gateway` when accessing `http://it.ductridn.com/login`

**Status:** ✅ All services are running (1/1)
- `ductri-task-manager_backend` - 1/1 ✅
- `ductri-task-manager_frontend` - 1/1 ✅
- `ductri-task-manager_postgres` - 1/1 ✅
- `ductri-task-manager_proxy-manager` - 1/1 ✅

**Issue:** Nginx Proxy Manager is receiving requests but doesn't know where to route them.

---

## ✅ Solution: Configure Proxy Host in NPM

### Step 1: Access Nginx Proxy Manager

1. **Open:** `http://your-server-ip:81` or `http://it.ductridn.com:81`
2. **Login:**
   - Default email: `admin@example.com`
   - Default password: `changeme` (change after first login)

### Step 2: Add Frontend Proxy Host

1. Click **Proxy Hosts** (in left menu)
2. Click **Add Proxy Host** button

3. **Details Tab:**
   - **Domain Names:** `it.ductridn.com`
   - **Scheme:** `http` (select from dropdown)
   - **Forward Hostname/IP:** `frontend` ⚠️ **Important: Use service name, not IP!**
   - **Forward Port:** `80`
   - ✅ **Block Common Exploits** (check this)
   - ✅ **Websockets Support** (check this - needed for some features)

4. Click **Save**

### Step 3: Add Backend API Proxy Host

**Option A: Use Subdomain (Recommended)**

1. Click **Add Proxy Host**
2. **Details Tab:**
   - **Domain Names:** `api.ductridn.com`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `backend` ⚠️ **Use service name!**
   - **Forward Port:** `5000`
   - ✅ **Websockets Support**

3. **Update Frontend Environment Variable:**
   ```yaml
   VITE_API_URL: https://api.ductridn.com/api
   ```

**Option B: Use Path `/api`**

1. Click **Add Proxy Host**
2. **Details Tab:**
   - **Domain Names:** `it.ductridn.com`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `backend`
   - **Forward Port:** `5000`
   - Click **Advanced** tab
   - **Custom Locations:**
     - **Location:** `/api`
     - **Forward Hostname/IP:** `backend`
     - **Forward Port:** `5000`
     - **Scheme:** `http`
     - Click **Add Location**

3. **Frontend already configured:** `VITE_API_URL: https://it.ductridn.com/api`

### Step 4: Enable SSL (HTTPS) - Recommended

After creating proxy hosts:

1. Click **Edit** on `it.ductridn.com` proxy host
2. Go to **SSL** tab
3. Select **Request a new SSL Certificate with Let's Encrypt**
4. ✅ **Force SSL** (redirect HTTP → HTTPS)
5. ✅ **HTTP/2 Support**
6. ✅ **I agree to the Let's Encrypt Terms of Service**
7. **Email:** Your email address
8. Click **Save**

Repeat for `api.ductridn.com` if using subdomain.

---

## 🔍 Verify Configuration

### Test from Browser:

1. **Frontend:** `http://it.ductridn.com` or `https://it.ductridn.com`
   - Should show login page (not 502 error)

2. **Backend API:** `http://api.ductridn.com/api/auth/test` or `http://it.ductridn.com/api/auth/test`
   - Should return response (not 502)

### Test from Docker Network:

```bash
# From any container in ductri-network, test if NPM can reach services
docker exec -it <npm-container> wget -O- http://frontend:80
docker exec -it <npm-container> wget -O- http://backend:5000/api/auth/test
```

---

## ⚠️ Important: Service Names in Docker

**In NPM "Forward Hostname/IP", use:**
- ✅ `frontend` (Docker service name)
- ✅ `backend` (Docker service name)

**NOT:**
- ❌ `localhost`
- ❌ `127.0.0.1`
- ❌ `192.168.40.132`
- ❌ `ductri-task-manager_frontend`

**Why?** Docker Swarm DNS resolves service names automatically within the `ductri-network`.

---

## 🚨 Common Issues

### Issue 1: Still Getting 502 After Configuration

**Check 1: Service Names**
- In NPM, ensure you're using `frontend` and `backend` (not IPs)
- Verify services are in same network (`ductri-network`)

**Check 2: Services Running**
- In Portainer → Services
- Verify `frontend` shows `1/1` (not `0/1`)
- Verify `backend` shows `1/1` (not `0/1`)

**Check 3: Ports**
- Frontend: Port `80` (Nginx serving React app)
- Backend: Port `5000` (Node.js Express)

### Issue 2: Can't Reach Services from NPM Container

**Test connectivity:**
```bash
# Get NPM container ID
docker ps | grep nginx-proxy-manager

# Test if it can reach frontend
docker exec -it <npm-container-id> wget -O- http://frontend:80

# Test if it can reach backend
docker exec -it <npm-container-id> wget -O- http://backend:5000/api/auth/test
```

**If connection fails:**
- Verify all services are in `ductri-network`
- Check network in Portainer → Networks → `ductri-network`
- Verify NPM container is also in this network

### Issue 3: SSL Certificate Fails

**Common causes:**
- DNS not pointing to server IP
- Port 80 blocked by firewall
- Too many certificate requests (Let's Encrypt rate limit)

**Fix:**
- Verify DNS: `nslookup it.ductridn.com` should return your server IP
- Check firewall allows ports 80 and 443
- Wait if rate limited (try again in an hour)

---

## 📝 Quick Setup Checklist

- [ ] Login to NPM at `http://server-ip:81`
- [ ] Add Proxy Host for Frontend:
  - Domain: `it.ductridn.com`
  - Forward to: `frontend:80`
- [ ] Add Proxy Host for Backend:
  - Domain: `api.ductridn.com` OR Path: `/api`
  - Forward to: `backend:5000`
- [ ] Enable SSL/HTTPS for both
- [ ] Update `VITE_API_URL` if using subdomain
- [ ] Test: `https://it.ductridn.com` should work

---

## ✅ Expected Result

After configuration:
- ✅ `https://it.ductridn.com` → Shows login page (no 502)
- ✅ `https://api.ductridn.com/api/auth/test` → Returns API response (no 502)
- ✅ All services showing `1/1` in Portainer
