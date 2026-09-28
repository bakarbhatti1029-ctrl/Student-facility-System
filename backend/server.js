// server.js
// IMPORTANT: dotenv.config() must be called FIRST before any other require
// that reads process.env (stripe, db, socket, etc.)
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const connectSocket = require('./sockets/socket');
const startRequestExpiryWorker = require('./services/requestExpiryService');

const authUsers = require('./routes/authRoutes/authUsers');
const profileRoutes = require('./routes/profileRoutes/profile');
const roomRoutes = require('./routes/Hostel/Room');
const hostelRoutes = require('./routes/Hostel/hostels');
const dishRoutes = require('./routes/kitchenownerroutes/Dish');
const kitchenRoutes = require('./routes/kitchenownerroutes/kitchens');
const bookingRoutes = require('./routes/Hostel/booking');
const cartRoutes = require('./routes/kitchenownerroutes/cartRoutes');
const studentRoutes = require('./routes/studentroutes/routes');
const orderRoutes = require('./routes/kitchenownerroutes/Order');
const chatRoutes = require('./routes/chat/chatRoutes');
const chatbotRoutes = require('./routes/chatBot/chatbot');
const adminRoutes = require('./routes/adminroutes/routes');
const contactRoutes = require('./routes/contactRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const geoRoutes = require('./routes/geoRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const csrfProtection = require('./middlewares/csrfProtection');

const app = express();
const server = http.createServer(app);

// Render (and most hosts) sit behind a reverse proxy. Without this,
// express-rate-limit v7 throws an X-Forwarded-For ValidationError on boot
// and rate limiting would treat all users as one IP. Harmless on localhost.
app.set('trust proxy', 1);

// Security headers (helmet). crossOriginResourcePolicy is relaxed so images
// served from Cloudinary / this API can still be embedded by the frontend.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS must run before rate limiting so browser clients can read a 429
// response and its RateLimit-Reset header.
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'X-CSRF-Token']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Generic rate limiter for the whole API - generous, just a backstop.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});
app.use(generalLimiter);

// Stricter limiter for auth endpoints most worth protecting from
// brute-force / spam: login, register, forgot-password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

const adminPasswordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again in 15 minutes.' },
});

// Initialize Socket.IO
const io = connectSocket(server);

// Request logging middleware for debugging
app.use((req, res, next) => {
  logger.debug(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Body parsers - must be before routes
app.use(express.json({ limit: '50mb' }));  // Increased limit for image data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(csrfProtection);

// Connect to MongoDB
connectDB();

// Seed dummy data on startup (safe — checks existing data first)
// const seedDummyData = require('./seedDummyData');
// mongoose.connection.once('open', () => seedDummyData());

// Seed the self-growing known-institutes cache from universityResolver.js (safe — no-ops if already seeded)
const seedKnownInstitutes = require('./seedKnownInstitutes');
mongoose.connection.once('open', () => seedKnownInstitutes());
mongoose.connection.once('open', () => startRequestExpiryWorker(io));

// API Routes
app.get('/', (req, res) => res.send('Hello World!'));

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/api/admin/resend-superadmin-verification', authLimiter);
app.use('/api/admin/verify-superadmin', authLimiter);
app.use('/api/admin/forgot-password', adminPasswordResetLimiter);
app.use('/api/admin/verify-password-reset-otp', adminPasswordResetLimiter);
app.use('/api/admin/reset-password', adminPasswordResetLimiter);
app.use('/auth', authUsers);
app.use('/profile', profileRoutes);
app.use('/hostel', hostelRoutes);
app.use('/kitchen', kitchenRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/push', pushNotificationRoutes);

// DB Connection Test Route
app.get('/test-db', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ message: '✅ MongoDB connection active' });
  } else {
    res.status(500).json({ message: '❌ MongoDB connection inactive' });
  }
});

// Error handler middleware
app.use(errorHandler);

// Attach io instance to app
app.set('io', io);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
