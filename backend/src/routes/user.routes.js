import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadAvatar, uploadResume } from '../middleware/upload.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/user.validation.js';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Retrieve the authenticated user's profile details
 * @access  Private
 */
router.get('/profile', protect, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update the authenticated user's profile details
 * @access  Private
 */
router.put('/profile', protect, validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload avatar image file
 * @access  Private
 */
router.post('/avatar', protect, uploadAvatar.single('avatar'), userController.uploadAvatarFile);

/**
 * @route   POST /api/users/resume
 * @desc    Upload candidate resume PDF file
 * @access  Private (Applicant only)
 */
router.post('/resume', protect, uploadResume.single('resume'), userController.uploadResumeFile);

/**
 * @route   POST /api/users/change-password
 * @desc    Change authenticated user's password and wipe out other sessions
 * @access  Private
 */
router.post('/change-password', protect, validate(changePasswordSchema), userController.changePassword);

export default router;
