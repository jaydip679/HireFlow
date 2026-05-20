import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Apply AI rate limit and protect all endpoints
router.use(protect);

/**
 * @route   POST /api/ai/screen/:applicationId
 * @desc    Trigger AI screening on a single candidate application
 * @access  Private (Employer/Admin)
 */
router.post(
  '/screen/:applicationId',
  authorize('employer', 'admin'),
  aiRateLimiter,
  aiController.screenApplication
);

/**
 * @route   POST /api/ai/screen-batch/:jobId
 * @desc    Trigger batch AI screening on all unscreened applications for a job
 * @access  Private (Employer/Admin)
 */
router.post(
  '/screen-batch/:jobId',
  authorize('employer', 'admin'),
  aiRateLimiter,
  aiController.screenBatch
);

/**
 * @route   GET /api/ai/interview-questions/:applicationId
 * @desc    Generate tailored interview questions based on job and candidate profile
 * @access  Private (Employer/Admin)
 */
router.get(
  '/interview-questions/:applicationId',
  authorize('employer', 'admin'),
  aiController.generateInterviewQuestions
);

/**
 * @route   POST /api/ai/chat
 * @desc    General purpose chat assistant (JDs draft helper, resume enhancer, etc.)
 * @access  Private (Any authenticated user)
 */
router.post(
  '/chat',
  aiRateLimiter,
  aiController.chat
);

export default router;
