import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change_me_in_production_min_32_characters_long_secret';

export const protect = catchAsync(async (req, res, next) => {
  let token = null;

  // 1. Get token from authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'You are not authenticated. Please log in.', 'UNAUTHENTICATED');
  }

  // 2. Verify JWT signature and expiration
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // 3. Load user from database, excluding password and auth hashes
    const user = await User.findById(decoded.id).select('+isSuspended +isVerified');
    
    if (!user) {
      throw new ApiError(401, 'The user belonging to this token no longer exists.', 'USER_NOT_FOUND');
    }

    // 4. Check if user account is suspended
    if (user.isSuspended) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.', 'USER_SUSPENDED');
    }

    // Attach user payload to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your access token has expired. Please refresh.', 'TOKEN_EXPIRED');
    }
    throw new ApiError(401, 'Invalid access token. Please log in again.', 'INVALID_TOKEN');
  }
});

export const optionalAuth = catchAsync(async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('+isSuspended +isVerified');
    
    if (user && !user.isSuspended) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
});
