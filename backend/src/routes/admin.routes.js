import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = express.Router();

// Apply global admin security check to all routes in this router
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/analytics
 * @desc    Retrieve overall platform analytics for the admin dashboard
 * @access  Private (Admin only)
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @route   GET /api/admin/users
 * @desc    List all platform users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/users', adminController.listUsers);

/**
 * @route   PATCH /api/admin/users/:userId/suspend
 * @desc    Suspend or unsuspend a user account (with automatic session wipe)
 * @access  Private (Admin only)
 */
router.patch('/users/:userId/suspend', adminController.toggleUserSuspension);

/**
 * @route   GET /api/admin/jobs
 * @desc    List all jobs including active, closed, and soft-deleted posts for moderation
 * @access  Private (Admin only)
 */
router.get('/jobs', adminController.listAllJobs);

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Moderate and soft-delete a job posting
 * @access  Private (Admin only)
 */
router.delete('/jobs/:id', adminController.moderateJobDelete);

export default router;
