const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'JWT_SECRET', 'DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(' Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error(' Please create a .env file in the backend directory with the following variables:');
  console.error('   GOOGLE_CLIENT_ID=your_google_client_id');
  console.error('   JWT_SECRET=your_jwt_secret_key');
  console.error('   DB_USER=your_db_user');
  console.error('   DB_HOST=localhost');
  console.error('   DB_NAME=your_db_name');
  console.error('   DB_PASSWORD=your_db_password');
  console.error('   DB_PORT=5432');
  console.error('   PORT=5000\n');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

const authRoutes = require('./routes/authRoutes'); 
const todoRoutes = require('./routes/todoRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// CORS configuration - allow localhost on all ports and production domain
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:80',
  'http://localhost',
  'http://it.ductridn.com',  // Production domain
  'https://it.ductridn.com'  // HTTPS production domain
];

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow localhost on any port
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    // Allow production domain
    if (origin.startsWith('http://it.ductridn.com') || origin.startsWith('https://it.ductridn.com')) {
      return callback(null, true);
    }
    // Allow origins from environment variable
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins
      callback(null, true);
    } else {
      // In production, check if origin is in allowed list
      callback(new Error(`CORS: Origin ${origin} is not allowed`), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path === '/api/auth/google') {
    console.log(` ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Token present:', !!req.body?.token);
  }
  next();
});

// Remove or adjust Cross-Origin-Opener-Policy to allow OAuth popups
// These headers are set per-route to avoid conflicts with Google OAuth
app.use((req, res, next) => {
  // Only set COOP/COEP for non-API routes to avoid OAuth issues
  if (!req.path.startsWith('/api')) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  } else {
    // For API routes, use unsafe-none to allow OAuth popups
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
