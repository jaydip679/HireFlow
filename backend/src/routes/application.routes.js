import express from 'express';
import * as applicationController from '../controllers/application.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { uploadResume } from '../middleware/upload.middleware.js';
import { applySchema, updateStatusSchema } from '../validations/application.validation.js';

const router = express.Router();

/**
 * @route   POST /api/applications
 * @desc    Submit a job application (handles Multer buffer streaming)
 * @access  Private (Applicant only)
 */
router.post(
  '/',
  protect,
  authorize('applicant'),
  uploadResume.single('resume'),
  validate(applySchema),
  applicationController.apply
);

/**
 * @route   GET /api/applications/my-applications
 * @desc    Get all applications submitted by candidate
 * @access  Private (Applicant only)
 */
router.get(
  '/my-applications',
  protect,
  authorize('applicant'),
  applicationController.getMyApplications
);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get applicants for a specific job posting
 * @access  Private (Employer/Admin)
 */
router.get(
  '/job/:jobId',
  protect,
  authorize('employer', 'admin'),
  applicationController.getApplicantsForJob
);

/**
 * @route   GET /api/applications/:id
 * @desc    Get details for a specific application record
 * @access  Private (Applicant/Employer/Admin)
 */
router.get(
  '/:id',
  protect,
  applicationController.getApplicationDetails
);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update application status
 * @access  Private (Employer/Admin)
 */
router.patch(
  '/:id/status',
  protect,
  authorize('employer', 'admin'),
  validate(updateStatusSchema),
  applicationController.updateStatus
);

/**
 * @route   PATCH /api/applications/:id/withdraw
 * @desc    Withdraw application
 * @access  Private (Applicant only)
 */
router.patch(
  '/:id/withdraw',
  protect,
  authorize('applicant'),
  applicationController.withdraw
);

export default router;
