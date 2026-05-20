import express from 'express';
import * as jobController from '../controllers/job.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize, authorizeOwnerOrAdmin } from '../middleware/rbac.middleware.js';
import { createJobSchema, listJobsQuerySchema, updateJobSchema } from '../validations/job.validation.js';
import Job from '../models/Job.model.js';

const router = express.Router();

/**
 * @route   GET /api/jobs
 * @desc    List all active jobs (Public feed)
 * @access  Public
 */
router.get('/', validate(listJobsQuerySchema), jobController.listJobs);

/**
 * @route   GET /api/jobs/my-jobs
 * @desc    List jobs created by authenticated employer
 * @access  Private (Employer)
 */
router.get('/my-jobs', protect, authorize('employer'), jobController.getMyJobs);

/**
 * @route   POST /api/jobs
 * @desc    Post a new job
 * @access  Private (Employer)
 */
router.post('/', protect, authorize('employer'), validate(createJobSchema), jobController.createJob);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job details by ID
 * @access  Public
 */
router.get('/:id', jobController.getJob);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job details
 * @access  Private (Owner/Admin)
 */
router.put('/:id', protect, authorize('employer', 'admin'), authorizeOwnerOrAdmin(Job, 'id'), validate(updateJobSchema), jobController.updateJob);

/**
 * @route   PATCH /api/jobs/:id/close
 * @desc    Close a job posting
 * @access  Private (Owner/Admin)
 */
router.patch('/:id/close', protect, authorize('employer', 'admin'), authorizeOwnerOrAdmin(Job, 'id'), jobController.closeJob);

/**
 * @route   PATCH /api/jobs/:id/reopen
 * @desc    Reopen a closed job posting
 * @access  Private (Owner/Admin)
 */
router.patch('/:id/reopen', protect, authorize('employer', 'admin'), authorizeOwnerOrAdmin(Job, 'id'), jobController.reopenJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Soft-delete a job posting
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', protect, authorize('employer', 'admin'), authorizeOwnerOrAdmin(Job, 'id'), jobController.deleteJob);

export default router;
