import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Config & Middlewares
import logger from './config/logger.js';
import { globalRateLimiter, loginRateLimiter, registerRateLimiter } from './middleware/rateLimit.middleware.js';
import { globalErrorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';

// Route Handlers
import authRouter from './routes/auth.routes.js';
import jobRouter from './routes/job.routes.js';
import applicationRouter from './routes/application.routes.js';
import userRouter from './routes/user.routes.js';
import aiRouter from './routes/ai.routes.js';
import adminRouter from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. HTTP Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc:     ["'self'", "data:", "res.cloudinary.com"],
      scriptSrc:  ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allows Cloudinary / local fallback files loading
}));

// 2. CORS Setup (Exclusive whitelisting)
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 3. Body parsers (Zod handles strict validations)
app.use(express.json({ limit: '10kb' })); // Rejects payloads > 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Custom Winston Request Logger Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// 5. Global rate limiter
app.use(globalRateLimiter);

// 6. Serve local uploads fallback folder (if Cloudinary is offline)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// 7. Health Check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  return res.status(200).json({
    success: true,
    message: 'System is healthy.',
    data: {
      status: 'ok',
      db: states[dbState] || 'unknown',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  });
});

// 8. API Routes
// Apply stricter rate limiters specifically to auth signups and logins
app.use('/api/auth/register', registerRateLimiter);
app.use('/api/auth/login', loginRateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/users', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

// 9. 404 Handler
app.use(notFoundHandler);

// 10. Global Error Handler
app.use(globalErrorHandler);

export default app;
