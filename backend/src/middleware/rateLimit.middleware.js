import rateLimit from 'express-rate-limit';
import ApiError from '../utils/apiError.js';

// General rate limiter for all regular routes: 100 requests per 15 minutes per IP
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  },
});

// Strict rate limiter for Login routes: 5 requests per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many login attempts. Please try again after 15 minutes.', 'LOGIN_RATE_LIMIT_EXCEEDED'));
  },
});

// Strict rate limiter for registration signup: 10 requests per hour per IP
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many registrations from this IP. Please try again after an hour.', 'REGISTER_RATE_LIMIT_EXCEEDED'));
  },
});

// AI endpoints limiter: 20 requests per hour bound per verified USER (falls back to IP if unauthenticated)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res, next) => {
    next(new ApiError(429, 'Hourly AI usage limit reached. Please try again in an hour.', 'AI_RATE_LIMIT_EXCEEDED'));
  },
});
