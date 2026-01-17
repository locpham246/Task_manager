# Portainer Troubleshooting - Services 0/1 Replicas

## 🔴 Problem: `ductri-task-manager_backend` and `ductri-task-manager_frontend` showing 0/1

**Symptom:** Services show `replicated 0 / 1 Scale` with "No log line matching the '' filter"

**Cause:** Docker images don't exist or can't be built

---

## ✅ Solution Steps

### Step 1: Verify Files are on Server

**On your production server (`/home/adminit/task-manager/`), check:**

```bash
# Check if backend and frontend directories exist
ls -la /home/adminit/task-manager/
# Should see: backend/, frontend/, docker-compose.swarm.yml

# Check if Dockerfiles exist
ls -la /home/adminit/task-manager/backend/Dockerfile
ls -la /home/adminit/task-manager/frontend/Dockerfile
```

### Step 2: Build Images Manually (Recommended)

**In Portainer:**

1. Go to **Images**
2. Click **Build a new image**
3. **Build Backend:**
   - **Build method:** `dockerfile`
   - **Name:** `ductri-backend:latest`
   - **Location:** `/home/adminit/task-manager/backend`
   - **Dockerfile:** `Dockerfile`
   - Click **Build the image**

4. **Build Frontend:**
   - **Build method:** `dockerfile`
   - **Name:** `ductri-frontend:latest`
   - **Location:** `/home/adminit/task-manager/frontend`
   - **Dockerfile:** `Dockerfile`
   - Click **Build the image**

**OR via SSH:**

```bash
cd /home/adminit/task-manager

# Build backend
docker build -t ductri-backend:latest ./backend

# Build frontend
docker build -t ductri-frontend:latest ./frontend

# Verify images exist
docker images | grep ductri
```

### Step 3: Update Stack in Portainer

1. Go to **Stacks** → Select your stack
2. Click **Editor**
3. Update with latest `docker-compose.swarm.yml` from GitHub
4. **Important:** Ensure build contexts are correct:
   ```yaml
   backend:
     build:
       context: ./backend
       dockerfile: Dockerfile
   ```

### Step 4: Redeploy Stack

1. Click **Update the stack**
2. Check **Re-pull the image** if using remote images
3. Click **Update the stack**

---

## 🔍 Alternative: Use Pre-built Images from Registry

If build fails, you can use a different approach:

### Option A: Build on Manager Node

```bash
# SSH into Docker Swarm manager node
docker build -t ductri-backend:latest ./backend
docker build -t ductri-frontend:latest ./frontend

# Tag for Swarm (if needed)
docker tag ductri-backend:latest ductri-backend:latest
docker tag ductri-frontend:latest ductri-frontend:latest
```

### Option B: Use Docker Registry

If you have a Docker registry:

```bash
# Push images to registry
docker tag ductri-backend:latest your-registry/ductri-backend:latest
docker push your-registry/ductri-backend:latest

# Then update docker-compose.swarm.yml:
backend:
  image: your-registry/ductri-backend:latest
```

---

## 🔧 Check Service Logs in Portainer

1. Click on service name: `ductri-task-manager_backend`
2. Click **Logs** tab
3. Look for errors:
   - **"image not found"** → Build the image
   - **"build context not found"** → Check file paths
   - **"permission denied"** → Check file permissions

---

## 📋 Verify Build Context Paths

**In Portainer Stack Editor, ensure build paths are correct:**

```yaml
backend:
  build:
    context: ./backend  # Relative to docker-compose.swarm.yml location
    dockerfile: Dockerfile

frontend:
  build:
    context: ./frontend  # Relative to docker-compose.swarm.yml location
    dockerfile: Dockerfile
```

**If docker-compose.swarm.yml is in `/home/adminit/task-manager/`:**
- Backend context: `/home/adminit/task-manager/backend`
- Frontend context: `/home/adminit/task-manager/frontend`

---

## 🚨 Common Issues

### Issue 1: Build Context Not Found

**Error:** `context not found: ./backend`

**Fix:**
- Ensure `docker-compose.swarm.yml` is in `/home/adminit/task-manager/`
- Verify `backend/` and `frontend/` directories exist
- Check file permissions: `chmod -R 755 /home/adminit/task-manager/`

### Issue 2: Dockerfile Not Found

**Error:** `dockerfile not found`

**Fix:**
- Check `backend/Dockerfile` exists
- Check `frontend/Dockerfile` exists
- Verify Dockerfile names are correct (capitalization matters)

### Issue 3: Environment Variables Missing

**Error:** Container starts but crashes immediately

**Fix:**
- In Portainer Stack Editor → **Environment variables**
- Ensure all required variables are set:
  - `GOOGLE_CLIENT_ID`
  - `JWT_SECRET`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

### Issue 4: Healthcheck Failing

**Error:** Service keeps restarting

**Fix:**
- Check backend is actually running on port 5000
- Verify healthcheck endpoint exists: `/api/auth/test`
- Temporarily disable healthcheck to test

---

## ✅ Quick Fix: Force Rebuild

**In Portainer:**

1. Stop the stack
2. Remove old images:
   ```bash
   docker rmi ductri-backend:latest ductri-frontend:latest
   ```
3. Build images manually (Step 2 above)
4. Start the stack again

---

## 📝 Verification Checklist

After fixing, verify:

- [ ] Images exist: `docker images | grep ductri`
- [ ] Services show `1/1` in Portainer
- [ ] Logs show application startup (not errors)
- [ ] Backend healthcheck passes
- [ ] Frontend serves on port 80
- [ ] Database connection works

---

## 🎯 Recommended Workflow

1. **Build images first:**
   ```bash
   cd /home/adminit/task-manager
   docker build -t ductri-backend:latest ./backend
   docker build -t ductri-frontend:latest ./frontend
   ```

2. **Then deploy stack in Portainer:**
   - Stack will use existing images
   - No build needed during deployment

3. **Update stack:**
   - Pull latest `docker-compose.swarm.yml` from GitHub
   - Update stack in Portainer
   - Rebuild images if code changed

This ensures images exist before Swarm tries to use them.
