# Internal Task Management System - Frontend

A React-based frontend application for an internal company task management system built for Đức Trí School. This application provides role-based access control with Google OAuth authentication.

## 🎯 Project Overview

This is the frontend application for an internal task management system designed for company use. It features:
- **Google OAuth Authentication** - Secure login using Google accounts
- **Role-Based Access Control (RBAC)** - Three user roles: Member, Admin, and SuperAdmin
- **Task Management** - Create, assign, update, and track tasks
- **User Management** - SuperAdmin can manage users and roles
- **Audit Logging** - Track all system activities

## 🚀 Features Implemented

### Authentication & Authorization
- ✅ Google OAuth login integration
- ✅ JWT token-based session management
- ✅ Role-based route protection
- ✅ Automatic token refresh and validation
- ✅ Secure logout with session cleanup

### Task Management
- ✅ **Create Tasks** - Admin/SuperAdmin can create and assign tasks
- ✅ **View Tasks** - Role-based filtering:
  - Members see only their assigned tasks
  - Admins/SuperAdmins see all tasks
- ✅ **Update Tasks** - Members can update their own tasks; Admins can update any task
- ✅ **Delete Tasks** - Admin/SuperAdmin only
- ✅ **Task Filtering** - Filter by status, priority, and assignee (Admin/SuperAdmin)
- ✅ **Task Fields**:
  - Title, Description
  - Status (todo, in_progress, done)
  - Priority (low, medium, high)
  - Assignee (user assignment)
  - Due Date
  - Created By tracking

### Dashboard Features
- ✅ **Member Dashboard**:
  - View assigned tasks only
  - Update task status
  - Add comments/descriptions
  - View upcoming deadlines

- ✅ **Admin Dashboard**:
  - View all tasks
  - Filter by user, status, priority
  - Create and assign tasks
  - Reassign tasks
  - Delete tasks

- ✅ **SuperAdmin Dashboard**:
  - All Admin features
  - User management interface
  - Role management (change user roles)
  - System activity monitoring
  - Audit logs viewer

### User Management (SuperAdmin Only)
- ✅ View all users
- ✅ Change user roles (member ↔ admin ↔ super_admin)
- ✅ View user activity and online status
- ✅ User profile management

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GoogleLoginButton.jsx    # Google OAuth login button
│   │   ├── TodoList.jsx              # Main task list with CRUD operations
│   │   ├── UserMenu.jsx             # User profile dropdown menu
│   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   ├── AuditLogList.jsx         # Audit log viewer
│   │   └── UserActivityTable.jsx    # User activity display
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx                # Login page
│   │   ├── Dashboard.jsx            # Main dashboard (role-based)
│   │   └── SuperAdminPanel.jsx      # SuperAdmin control panel
│   │
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx          # Authentication state management
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.jsx              # Authentication hook
│   │
│   ├── services/            # API service layer
│   │   ├── api.js                   # Axios instance with interceptors
│   │   └── authService.js           # Authentication API calls
│   │
│   ├── routes/              # Route configuration
│   │   └── AppRoutes.jsx            # Route definitions
│   │
│   ├── styles/              # CSS stylesheets
│   │   ├── Dashboard.css
│   │   ├── Login.css
│   │   ├── TodoList.css
│   │   └── UserMenu.css
│   │
│   ├── utils/               # Utility functions
│   │   └── statusHelper.js          # Helper functions
│   │
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Application entry point
│
├── public/                  # Static assets
├── package.json             # Dependencies
└── vite.config.js           # Vite configuration
```

## 🔐 User Roles & Permissions

### Member (Default Role)
- ✅ View only tasks assigned to them
- ✅ Update status of their own tasks
- ✅ Add comments/descriptions to their tasks
- ❌ Cannot view other users' tasks
- ❌ Cannot create, delete, or reassign tasks

### Admin
- ✅ All Member permissions
- ✅ View all tasks in the system
- ✅ Create new tasks
- ✅ Assign tasks to any user
- ✅ Update any task
- ✅ Delete tasks
- ✅ Filter tasks by user, status, priority
- ❌ Cannot manage users or roles
- ❌ Cannot access audit logs

### SuperAdmin
- ✅ All Admin permissions
- ✅ Manage users (view, update roles)
- ✅ Access audit logs
- ✅ View system activity
- ✅ Full system access

## 🛠️ Technology Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **@react-oauth/google** - Google OAuth integration
- **Font Awesome** - Icons (via CDN)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Google OAuth:**
   - The Google Client ID is configured in `src/main.jsx`
   - Ensure it matches the backend configuration
   - Current Client ID: `1084886023567-rrrqtka0lt87gcuggf8147ov62qcvd6f.apps.googleusercontent.com`

3. **Configure API endpoint:**
   - API base URL is set in `src/services/api.js`
   - Default: `http://localhost:5000/api`
   - Update if your backend runs on a different port

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 🔄 How It Works

### Authentication Flow

1. **Login:**
   - User clicks Google login button
   - Google OAuth popup appears
   - User authenticates with Google
   - Frontend receives Google ID token
   - Token is sent to backend `/api/auth/google`
   - Backend verifies token and returns JWT
   - JWT is stored in localStorage
   - User is redirected to dashboard

2. **Session Management:**
   - JWT token is automatically attached to all API requests
   - Token is validated on page load via `/api/auth/me`
   - Expired tokens trigger automatic logout
   - Token is cleared on logout

### Task Management Flow

1. **Viewing Tasks:**
   - Component calls `GET /api/todos`
   - Backend filters tasks based on user role
   - Members: Only tasks where `user_id = current_user.id`
   - Admins: All tasks with assignee information

2. **Creating Tasks:**
   - Admin/SuperAdmin opens task creation modal
   - Fills in task details (title, description, priority, assignee, due date)
   - Frontend sends `POST /api/todos` with task data
   - Backend validates permissions and creates task
   - Task appears in the list

3. **Updating Tasks:**
   - User clicks edit button (or changes status dropdown)
   - Frontend sends `PUT /api/todos/:id` or `PATCH /api/todos/:id/status`
   - Backend validates:
     - Members can only update their own tasks
     - Admins can update any task
   - Task is updated in database

4. **Deleting Tasks:**
   - Admin/SuperAdmin clicks delete button
   - Confirmation dialog appears
   - Frontend sends `DELETE /api/todos/:id`
   - Backend validates admin permissions
   - Task is deleted and audit log is created

### Authorization Implementation

- **Frontend Protection:**
  - `ProtectedRoute` component checks user authentication
  - Role-based route access (e.g., SuperAdmin panel)
  - UI elements hidden based on user role

- **Backend Enforcement:**
  - All API endpoints require authentication
  - Role-based middleware (`isAdmin`, `isSuperAdmin`)
  - Data filtering based on user role
  - **Important:** Frontend protection is for UX only; backend enforces all security

## 🎨 Key Components Explained

### TodoList Component
The main task management component with:
- Task listing with role-based filtering
- Create/Edit task modal
- Status update dropdown
- Filter controls (Admin/SuperAdmin)
- Delete functionality

### AuthContext
Global authentication state:
- Stores current user information
- Provides `user`, `loading`, `logout` to all components
- Automatically validates token on app load
- Handles logout cleanup

### ProtectedRoute
Route protection wrapper:
- Checks if user is authenticated
- Validates user role for protected routes
- Redirects to login if not authenticated
- Redirects to dashboard if role insufficient

### SuperAdminPanel
SuperAdmin control panel with tabs:
- **Users Tab:** User list with role management
- **Activities Tab:** Real-time user activity
- **Audit Logs Tab:** System activity logs

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Currently, configuration is hardcoded. For production, consider using environment variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID

## 🔗 Backend Integration

This frontend communicates with the backend API at `http://localhost:5000/api`:

- **Authentication:** `/api/auth/*`
- **Tasks:** `/api/todos/*`
- **Admin:** `/api/admin/*`

All requests include JWT token in `Authorization: Bearer <token>` header.

## 📝 Notes

- **Security:** All authorization is enforced on the backend. Frontend role checks are for UX only.
- **Token Storage:** JWT tokens are stored in localStorage. Consider httpOnly cookies for production.
- **Error Handling:** API errors are handled with user-friendly messages.
- **Responsive Design:** The UI is designed for desktop use but can be adapted for mobile.

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized Errors:**
   - Check if backend is running
   - Verify JWT token is valid
   - Check backend `.env` configuration

2. **CORS Errors:**
   - Ensure backend CORS is configured for `http://localhost:5173`
   - Check backend `index.js` CORS settings

3. **Google OAuth Not Working:**
   - Verify Google Client ID matches backend
   - Check browser console for OAuth errors
   - Ensure backend has correct `GOOGLE_CLIENT_ID` in `.env`

4. **Tasks Not Loading:**
   - Check database connection
   - Verify user has correct role
   - Check browser console for API errors

5. **Cross-Origin-Opener-Policy (COOP) Warnings:**
   - **Issue:** Console shows warnings like "Cross-Origin-Opener-Policy policy would block the window.postMessage call"
   - **Cause:** Vite's HMR (Hot Module Replacement) client needs to communicate with the dev server, but COOP headers can block this
   - **Solution:** The `vite.config.js` is configured with `Cross-Origin-Opener-Policy: 'unsafe-none'` for development
   - **Note:** These warnings are harmless and don't affect functionality. The backend still sets appropriate COOP headers for API routes to maintain OAuth security
   - **Fix Applied:**
     ```javascript
     // vite.config.js
     server: {
       headers: {
         'Cross-Origin-Opener-Policy': 'unsafe-none',  // Allows HMR to work
         'Cross-Origin-Embedder-Policy': 'unsafe-none'
       }
     }
     ```
   - **Why this works:** Using `unsafe-none` in development allows Vite's HMR to communicate without warnings, while the backend still enforces proper COOP headers for OAuth security on API routes

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Built for Đức Trí School Internal Task Management System**
