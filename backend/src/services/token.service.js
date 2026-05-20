import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.model.js';
import ApiError from '../utils/apiError.js';
import logger from '../config/logger.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change_me_in_production_min_32_characters_long_secret';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_me_in_production_min_64_characters_long_secret_goes_here_rotating_keys';
const JWT_REFRESH_EXPIRES_IN_DAYS = 7; // Matches 7d from config

/**
 * Sign a short-lived access token containing minimal payload (id and role).
 */
export const signAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId.toString(), role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate a cryptographically secure random token, hash it using SHA-256,
 * save the hashed version to the DB, and return the raw token.
 */
export const createRefreshToken = async (userId, userAgent = '') => {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + JWT_REFRESH_EXPIRES_IN_DAYS);

  await RefreshToken.create({
    token: hashedToken,
    user: userId,
    expiresAt,
    userAgent,
  });

  return rawToken;
};

/**
 * Rotate the refresh token: validate the old one, revoke it, detect any token reuse
 * breaches, and issue a fresh token pair.
 */
export const rotateRefreshToken = async (rawToken, userAgent = '') => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Find the token record in the DB, populating user details
  const tokenDoc = await RefreshToken.findOne({ token: hashedToken }).populate('user');
  
  if (!tokenDoc) {
    throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = tokenDoc.user;

  // Breach Detection: If token is already revoked, it suggests token theft / replay attacks!
  if (tokenDoc.isRevoked) {
    logger.warn(`Security Breach Detected: Revoked refresh token reused for user ${user._id}. Revoking all sessions.`);
    // Revoke all tokens for this user to neutralize the threat
    await revokeAllUserTokens(user._id);
    throw new ApiError(401, 'Session breach detected. Please log in again.', 'TOKEN_REUSE_BREACH');
  }

  // Check if token is expired
  if (tokenDoc.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token has expired. Please log in again.', 'REFRESH_TOKEN_EXPIRED');
  }

  // Revoke the old token by setting isRevoked: true
  tokenDoc.isRevoked = true;
  await tokenDoc.save();

  // Issue new access and refresh token pair
  const newAccessToken = signAccessToken(user._id, user.role);
  const newRawRefreshToken = await createRefreshToken(user._id, userAgent);

  return {
    accessToken: newAccessToken,
    refreshToken: newRawRefreshToken,
    user,
  };
};

/**
 * Revoke all tokens for a user. Typically triggered on logout, password resets,
 * or security breach responses.
 */
export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};
