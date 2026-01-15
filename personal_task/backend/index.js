const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); 
const todoRoutes = require('./routes/todoRoutes'); 
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Cấu hình bảo mật và CORS PHẢI đặt đầu tiên
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Chú ý: Nếu dùng Google Login bản mới, đôi khi không cần 'require-corp', hãy thử bỏ nếu bị lỗi load script
  next();
});

// 2. Định nghĩa Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));