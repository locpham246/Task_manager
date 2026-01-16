# Deployment Guide - Docker Swarm with Portainer

This guide will help you deploy the Đức Trí Task Manager application using Docker Swarm and Portainer.

## Prerequisites

- Proxmox with Docker Swarm configured
- Portainer installed and accessible
- Access to your Proxmox server

## Step 1: Prepare Your Environment

1. **Clone or upload your project** to your Proxmox server
2. **Create a `.env` file** in the `personal_task` directory based on `.env.example`:

```bash
cd personal_task
cp .env.example .env
nano .env  # Edit with your actual values
```

3. **Required Environment Variables:**
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `JWT_SECRET`: A secure random string (minimum 32 characters)
   - `DB_PASSWORD`: A strong password for PostgreSQL
   - `DB_NAME`: Database name (default: `task_manager`)
   - `DB_USER`: Database user (default: `postgres`)

## Step 2: Deploy via Portainer

### Option A: Using Portainer Web Editor

1. **Open Portainer** in your browser
2. **Navigate to**: Stacks > Add stack
3. **Name**: `ductri-task-manager`
4. **Build method**: Select "Web editor"
5. **Copy and paste** the contents of `docker-compose.yml` into the editor
6. **Environment variables**: 
   - Click on "Environment variables" or "Env" tab
   - Add all variables from your `.env` file
   - Or use Portainer's "Environment variables" section to load from file

### Option B: Using Git Repository

1. **Push your code** to a Git repository (GitHub, GitLab, etc.)
2. **In Portainer**:
   - Stacks > Add stack
   - Name: `ductri-task-manager`
   - Build method: Select "Repository"
   - Repository URL: `https://github.com/yourusername/your-repo.git`
   - Repository reference: `main` (or your branch)
   - Compose path: `personal_task/docker-compose.yml`
   - Environment variables: Add from `.env` file

### Option C: Upload docker-compose.yml

1. **In Portainer**:
   - Stacks > Add stack
   - Name: `ductri-task-manager`
   - Build method: Select "Upload"
   - Upload your `docker-compose.yml` file
   - Add environment variables

## Step 3: Configure Environment Variables in Portainer

After creating the stack, you need to add environment variables:

1. **Go to your stack** in Portainer
2. **Click "Editor"** or "Environment variables"
3. **Add the following variables** (or use the "Load variables from .env file" option):

```
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=task_manager
DB_HOST=postgres
DB_PORT=5432
GOOGLE_CLIENT_ID=your_google_client_id
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
VITE_API_URL=http://your-server-ip:5000
```

**Important**: Replace placeholder values with your actual credentials!

## Step 4: Deploy the Stack

1. **Click "Deploy the stack"** button
2. **Wait for services to start** (this may take a few minutes on first build)
3. **Check logs** if any service fails to start

## Step 5: Initialize Database

After the stack is deployed, you need to run database migrations:

1. **In Portainer**, go to **Containers**
2. **Find** `ductri-postgres` container
3. **Click** on it, then go to **Console** tab
4. **Connect** to the database:

```bash
psql -U postgres -d task_manager
```

5. **Run the migration SQL files** from `backend/migrations/`:
   - `create_email_whitelist.sql`
   - `add_shared_documents.sql`
   - `add_multiple_assignees.sql`
   - `add_documentation_links.sql`
   - `add_created_at_to_users.sql`
   - `add_ip_device_tracking.sql`

6. **Add your Super Admin email** to the whitelist:

```sql
INSERT INTO email_whitelist (email, is_active) 
VALUES ('your-email@ductridn.edu.vn', true);
```

## Step 6: Access Your Application

- **Frontend**: `http://your-server-ip` (port 80)
- **Backend API**: `http://your-server-ip:5000`
- **PostgreSQL**: `your-server-ip:5432` (if exposed)

## Step 7: Update Google OAuth Settings

1. **Go to Google Cloud Console**
2. **Update authorized redirect URIs**:
   - `http://your-server-ip/api/auth/google/callback`
   - `https://your-domain.com/api/auth/google/callback` (if using HTTPS)

## Troubleshooting

### Services won't start

1. **Check logs** in Portainer:
   - Go to **Containers** > Select container > **Logs** tab
2. **Common issues**:
   - Missing environment variables
   - Database connection errors
   - Port conflicts

### Database connection errors

- Verify `DB_HOST=postgres` (service name, not `localhost`)
- Check PostgreSQL is healthy: Look for green health check in Portainer
- Verify database credentials in `.env`

### Frontend can't connect to backend

- Update `VITE_API_URL` in environment variables
- Ensure backend is running and healthy
- Check network connectivity between services

### Build fails

- Check Dockerfile syntax
- Verify all files are present
- Check Portainer logs for build errors

## Updating the Application

1. **Make changes** to your code
2. **In Portainer**:
   - Go to your stack
   - Click **Editor**
   - Update the compose file if needed
   - Click **Update the stack**
3. **Or rebuild**:
   - Go to **Images**
   - Remove old images
   - Redeploy the stack

## Backup Database

```bash
# In Portainer, connect to postgres container console
pg_dump -U postgres task_manager > backup.sql
```

## Scaling (Optional)

To scale services horizontally:

1. **In Portainer**, go to your stack
2. **Edit** the stack
3. **Update** `deploy.replicas` in docker-compose.yml
4. **Note**: PostgreSQL should remain at 1 replica (not suitable for horizontal scaling)

## Security Recommendations

1. **Use strong passwords** for database and JWT secret
2. **Enable HTTPS** using a reverse proxy (Traefik, Nginx Proxy Manager)
3. **Restrict database port** (5432) to internal network only
4. **Regular backups** of PostgreSQL data volume
5. **Keep images updated** for security patches

## Support

For issues or questions, check:
- Portainer logs
- Container logs
- Database connection status
- Network connectivity
