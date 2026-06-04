import crypto from 'crypto';
import User from '../models/User.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeAllUserTokens } from '../services/token.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Register a new user, send a verification email, and save their details.
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered. Please login.', 'EMAIL_ALREADY_REGISTERED');
  }

  const newUser = await User.create({
    name,
    email,
    passwordHash: password, // Hashed automatically in Mongoose pre-save
    role,
    isVerified: true, // Auto-verified
  });

  return res.status(201).json(
    apiResponse.success(
      newUser.toSafeObject(),
      'Registration successful! You can now log in.'
    )
  );
});

/**
 * Verify user email via token submitted in query.
 */
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, 'Verification token is required.', 'TOKEN_REQUIRED');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: new Date() },
  }).select('+verificationToken +verificationTokenExpires');

  if (!user) {
    throw new ApiError(400, 'Verification token is invalid or has expired.', 'INVALID_VERIFICATION_TOKEN');
  }

  user.isVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  return res.status(200).json(
    apiResponse.success(null, 'Your email has been verified successfully! You can now log in.')
  );
});

/**
 * Log in a user, sign JWT access tokens, and store refresh tokens in an httpOnly cookie.
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Look up user, explicitly selecting password hash and suspended state
  const user = await User.findOne({ email }).select('+passwordHash +isSuspended +isVerified');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // Email verification bypass: all users can log in immediately
  // if (!user.isVerified) {
  //   throw new ApiError(403, 'Please verify your email address before logging in.', 'EMAIL_UNVERIFIED');
  // }

  // Block suspended logins
  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
  }

  // Issue new tokens
  const accessToken = signAccessToken(user._id, user.role);
  const userAgent = req.headers['user-agent'] || '';
  const rawRefreshToken = await createRefreshToken(user._id, userAgent);

  // Store refresh token in HTTP-only, secure, SameSite cookie
  res.cookie('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure cookie in production (HTTPS)
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching token model TTL
  });

  return res.status(200).json(
    apiResponse.success({
      accessToken,
      user: user.toSafeObject()
    }, 'Logged in successfully!')
  );
});

/**
 * Handle silent Token Refresh requests via httpOnly cookies.
 */
export const refresh = catchAsync(async (req, res, next) => {
  const rawToken = req.cookies?.refreshToken;
  
  if (!rawToken) {
    throw new ApiError(401, 'Refresh token is missing. Please log in.', 'MISSING_REFRESH_TOKEN');
  }

  const userAgent = req.headers['user-agent'] || '';
  
  // Rotate the refresh token pair
  const { accessToken, refreshToken, user } = await rotateRefreshToken(rawToken, userAgent);

  // Set the new rotating refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    apiResponse.success({
      accessToken,
      user: user.toSafeObject()
    }, 'Session refreshed successfully!')
  );
});

/**
 * Log out a user, invalidate their active refresh session, and clear cookies.
 */
export const logout = catchAsync(async (req, res, next) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Remove specific session from database
    await RefreshToken.deleteOne({ token: hashedToken });
  }

  // Clear cookie parameters
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json(
    apiResponse.success(null, 'Logged out successfully!')
  );
});

/**
 * Initiate password reset, generating resets token and dispatching emails.
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Under secure practices: Don't reveal that the email doesn't exist. Say "reset link sent if email exists" or 200.
    return res.status(200).json(
      apiResponse.success(null, 'If an account exists with this email, a password reset link has been sent.')
    );
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetToken = hashedResetToken;
  user.resetTokenExpires = resetTokenExpires;
  await user.save();

  // Send the email async
  sendPasswordResetEmail(user, rawResetToken);

  return res.status(200).json(
    apiResponse.success(null, 'Password reset link sent to your email.')
  );
});

/**
 * Complete password reset using token and hash new password values.
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, 'Reset token is required.', 'TOKEN_REQUIRED');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpires: { $gt: new Date() }
  }).select('+resetToken +resetTokenExpires');

  if (!user) {
    throw new ApiError(400, 'Password reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
  }

  // Modify password (triggering pre-save hashing middleware)
  user.passwordHash = password;
  user.resetToken = null;
  user.resetTokenExpires = null;
  await user.save();

  // Revoke all active sessions for security
  await revokeAllUserTokens(user._id);

  return res.status(200).json(
    apiResponse.success(null, 'Password has been reset successfully! You can now log in with your new password.')
  );
});
