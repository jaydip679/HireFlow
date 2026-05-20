import User from '../models/User.model.js';
import { uploadFileToProvider, deleteFileFromProvider } from '../middleware/upload.middleware.js';
import { revokeAllUserTokens } from '../services/token.service.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Retrieve the authenticated user's profile details.
 */
export const getProfile = catchAsync(async (req, res, next) => {
  return res.status(200).json(
    apiResponse.success(req.user.toSafeObject(), 'Profile retrieved successfully!')
  );
});

/**
 * Update the user's profile details.
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, headline, bio, skills, company } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (headline !== undefined) user.headline = headline;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) user.skills = skills;
  
  if (user.role === 'employer' && company) {
    user.company = {
      name: company.name !== undefined ? company.name : user.company.name,
      website: company.website !== undefined ? company.website : user.company.website,
      logo: user.company.logo // preserved, handled in logo endpoint
    };
  }

  await user.save();

  return res.status(200).json(
    apiResponse.success(user.toSafeObject(), 'Profile updated successfully!')
  );
});

/**
 * Upload profile avatar.
 */
export const uploadAvatarFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file.', 'FILE_REQUIRED');
  }

  const user = req.user;
  
  // If user already has an avatar public ID, delete the old resource from Cloudinary/disk
  if (user.avatar && user.avatar.publicId) {
    await deleteFileFromProvider(user.avatar.publicId, 'avatars');
  }

  // Stream new file to Cloudinary / write to disk
  const uploadResult = await uploadFileToProvider(
    req.file.buffer,
    'avatars',
    req.file.originalname,
    req.file.mimetype
  );

  user.avatar = {
    url: uploadResult.url,
    publicId: uploadResult.publicId
  };

  await user.save();

  return res.status(200).json(
    apiResponse.success(user.toSafeObject(), 'Avatar image uploaded successfully!')
  );
});

/**
 * Upload profile PDF resume (Applicants only).
 */
export const uploadResumeFile = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'applicant') {
    throw new ApiError(403, 'Only job applicants can upload resumes.', 'FORBIDDEN');
  }

  if (!req.file) {
    throw new ApiError(400, 'Please upload a PDF resume.', 'FILE_REQUIRED');
  }

  const user = req.user;
  
  // Delete old PDF from provider if exists
  if (user.resume && user.resume.publicId) {
    await deleteFileFromProvider(user.resume.publicId, 'resumes');
  }

  // Stream new PDF
  const uploadResult = await uploadFileToProvider(
    req.file.buffer,
    'resumes',
    req.file.originalname,
    req.file.mimetype
  );

  user.resume = {
    url: uploadResult.url,
    publicId: uploadResult.publicId
  };

  await user.save();

  return res.status(200).json(
    apiResponse.success(user.toSafeObject(), 'Resume PDF uploaded successfully!')
  );
});

/**
 * Change authenticated user's password, invalidating other sessions.
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  // Verify current password. Explicitly select passwordHash first
  const fullUser = await User.findById(user._id).select('+passwordHash');
  if (!(await fullUser.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Incorrect current password.', 'INVALID_CURRENT_PASSWORD');
  }

  // Update password (Mongoose pre-save handles hashing automatically)
  fullUser.passwordHash = newPassword;
  await fullUser.save();

  // Revoke all active sessions
  await revokeAllUserTokens(user._id);

  return res.status(200).json(
    apiResponse.success(null, 'Password updated successfully! All other active sessions have been logged out.')
  );
});
