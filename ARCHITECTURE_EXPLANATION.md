# Architecture Explanation - Nginx Proxy Manager + Docker

## 🏗️ Your Current Setup

```
Internet
   ↓
[it.ductridn.com]
   ↓
[Nginx Proxy Manager] (Proxmox/Portainer)
   ↓
[Docker Swarm Network: ductri-network]
   ├── [Frontend Container] (Nginx serving built React app) - Port 80
   ├── [Backend Container] (Node.js/Express API) - Port 5000
   └── [PostgreSQL Container] (Database) - Port 5432
```

---

## 📋 How It Works

### 1. **Domain Access Flow**

```
User Browser (http://it.ductridn.com)
   ↓
[Nginx Proxy Manager] 
   ├── Checks domain: it.ductridn.com
   ├── Routes to: Frontend Container (port 80)
   └── OR: Routes API calls to Backend Container (port 5000)
```

### 2. **Nginx Proxy Manager Configuration**

**For Frontend (`http://it.ductridn.com`):**
- **Forward Hostname/IP:** Your Docker host IP or `frontend` service name
- **Forward Port:** `80`
- **Forward Scheme:** `http`
- **SSL:** Enable if you have SSL certificate

**For Backend API (`http://it.ductridn.com:5000` or subdomain):**
- **Option A:** Use subdomain (recommended)
  - Example: `api.ductridn.com` → Backend (port 5000)
- **Option B:** Use path
  - Example: `http://it.ductridn.com/api` → Backend (port 5000)

---

## 🔗 How Frontend → Backend → Database Connects

### **Frontend to Backend:**
```
Frontend (Browser) 
  → Makes API call to: VITE_API_URL 
  → Which is: http://it.ductridn.com:5000/api (or internal: http://backend:5000/api)
  → Goes through Nginx Proxy Manager
  → Reaches Backend Container
```

### **Backend to Database:**
```
Backend Container
  → Connects to: postgres (service name in Docker network)
  → OR: DB_HOST environment variable (set to "postgres")
  → Port: 5432 (PostgreSQL default)
  → Credentials: From DB_USER, DB_PASSWORD environment variables
```

**Important:** Backend connects to database using Docker service name `postgres`, NOT `localhost`!

---

## 🐳 Docker Service Names (Internal Networking)

Within Docker Swarm network `ductri-network`:

| Service Name | Container Internal Address | External Access |
|--------------|---------------------------|-----------------|
| `postgres` | `postgres:5432` | `localhost:5432` or `host-ip:5432` |
| `backend` | `backend:5000` | `localhost:5000` or `host-ip:5000` |
| `frontend` | `frontend:80` | `localhost:80` or `host-ip:80` |

**Key Point:** Containers talk to each other using **service names**, not localhost!

---

## 🔧 Configuration Examples

### **Nginx Proxy Manager Setup:**

**Proxy Host 1: Frontend**
- **Domain Names:** `it.ductridn.com`
- **Scheme:** `http`
- **Forward Hostname/IP:** `frontend` (Docker service name) OR Docker host IP
- **Forward Port:** `80`
- **Websockets Support:** ✅ Enable
- **SSL:** Enable if you have certificate

**Proxy Host 2: Backend API (Optional)**
- **Domain Names:** `api.ductridn.com` (or use path `/api`)
- **Scheme:** `http`
- **Forward Hostname/IP:** `backend` (Docker service name) OR Docker host IP
- **Forward Port:** `5000`
- **Websockets Support:** ✅ Enable (if needed)
- **SSL:** Enable if you have certificate

---

## 🎯 Environment Variables Explained

### **Backend Container:**

```yaml
DB_HOST: postgres  # ✅ Uses Docker service name (NOT localhost!)
DB_PORT: 5432
DB_USER: postgres
DB_PASSWORD: postgres
DB_NAME: task_manager
ALLOWED_ORIGINS: http://it.ductridn.com  # ✅ Production domain
```

**Why `DB_HOST: postgres`?**
- Docker DNS resolves `postgres` to the PostgreSQL container IP
- Works inside Docker network
- No need for IP addresses

### **Frontend Container:**

```yaml
VITE_API_URL: http://it.ductridn.com:5000/api
# OR if using subdomain:
# VITE_API_URL: http://api.ductridn.com/api
```

**Why not `http://backend:5000`?**
- Browser runs outside Docker network
- Cannot resolve Docker service names
- Must use public domain/IP

---

## 🔍 About localhost in docker-compose.swarm.yml

### **✅ KEEP localhost in healthcheck (Line 63):**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/auth/test'..."]
```

**Why?** Healthcheck runs **inside** the container, so `localhost:5000` refers to the container's own port - this is correct!

### **❌ REMOVE localhost from VITE_API_URL (Line 91):**
```yaml
VITE_API_URL: ${VITE_API_URL:-http://localhost:5000}  # ❌ Wrong for production
```

**Why?** Browser needs to reach backend from external domain, not localhost. Updated to:
```yaml
VITE_API_URL: ${VITE_API_URL:-http://it.ductridn.com:5000/api}  # ✅ Correct
```

---

## 📊 Complete Request Flow

### **Example: User logs in**

1. **User visits:** `http://it.ductridn.com/login`
   - Request goes to Nginx Proxy Manager
   - NPM routes to Frontend container (port 80)
   - Frontend serves React app (Nginx serves built files)

2. **Frontend makes API call:** `POST http://it.ductridn.com:5000/api/auth/google`
   - Browser sends request to `it.ductridn.com:5000`
   - Nginx Proxy Manager routes to Backend container (port 5000)
   - Backend processes request

3. **Backend needs database:** 
   - Backend connects to `postgres:5432` (Docker service name)
   - Docker DNS resolves `postgres` to PostgreSQL container
   - Database query executes

4. **Response flows back:**
   - Database → Backend → NPM → Browser → Frontend

---

## 🎛️ Nginx Proxy Manager Setup Steps

1. **Access NPM:** Usually `http://your-proxmox-ip:81` or `http://npm.ductridn.com`

2. **Add Proxy Host for Frontend:**
   - **Details Tab:**
     - Domain Names: `it.ductridn.com`
     - Scheme: `http`
     - Forward Hostname/IP: `frontend` or Docker host IP
     - Forward Port: `80`
   - **Advanced Tab:**
     - Enable WebSockets
     - Custom location (if needed)

3. **Add Proxy Host for Backend (Optional):**
   - **Details Tab:**
     - Domain Names: `api.ductridn.com` (or use path)
     - Scheme: `http`
     - Forward Hostname/IP: `backend` or Docker host IP
     - Forward Port: `5000`
   - **Advanced Tab:**
     - Enable WebSockets

---

## ✅ Summary

**How domain gets database:**
1. Domain (`it.ductridn.com`) → Nginx Proxy Manager
2. NPM → Frontend container (port 80)
3. Frontend → Backend container (via `VITE_API_URL`)
4. Backend → PostgreSQL container (via service name `postgres`)
5. All containers are in same Docker network (`ductri-network`)

**Key Points:**
- ✅ Containers communicate using **service names** (`postgres`, `backend`, `frontend`)
- ✅ Browser accesses via **domain/IP** (`it.ductridn.com`)
- ✅ Nginx Proxy Manager routes domain to containers
- ✅ `localhost` in healthcheck is OK (runs inside container)
- ✅ `localhost` in `VITE_API_URL` is WRONG (browser can't resolve it)
