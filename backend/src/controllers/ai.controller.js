import * as aiService from '../services/ai.service.js';
import Application from '../models/Application.model.js';
import Job from '../models/Job.model.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Screen a single application (Employer/Admin only).
 * Ensures that the requesting employer owns the job associated with the application.
 */
export const screenApplication = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  // 1. Fetch application with populated job to perform ownership checks
  const application = await Application.findById(applicationId).populate('job');
  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  // 2. Authorization check: Only job's employer or admin can trigger screening
  const isEmployer = application.job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isEmployer && !isAdmin) {
    throw new ApiError(403, 'Access denied. You can only screen applicants for your own jobs.', 'FORBIDDEN');
  }

  // 3. Trigger screening
  const result = await aiService.screenApplication(applicationId);

  return res.status(200).json(
    apiResponse.success(result, 'AI screening completed successfully!')
  );
});

/**
 * Screen a batch of unscreened applications for a job (Employer/Admin only).
 */
export const screenBatch = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;

  // 1. Fetch job to perform ownership check
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found.', 'JOB_NOT_FOUND');
  }

  // 2. Authorization: Only job owner or admin
  const isEmployer = job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isEmployer && !isAdmin) {
    throw new ApiError(403, 'Access denied. You can only batch screen applicants for your own jobs.', 'FORBIDDEN');
  }

  // 3. Trigger batch screening
  const result = await aiService.screenBatch(jobId);

  return res.status(200).json(
    apiResponse.success(result, 'Batch AI screening completed successfully!')
  );
});

/**
 * Generate tailored interview questions for an applicant (Employer/Admin only).
 */
export const generateInterviewQuestions = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  // 1. Fetch application with populated job for authorization checks
  const application = await Application.findById(applicationId).populate('job');
  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  // 2. Authorization check: Only employer (job owner) or admin can view/generate questions
  const isEmployer = application.job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isEmployer && !isAdmin) {
    throw new ApiError(403, 'Access denied. You can only generate interview questions for your own candidates.', 'FORBIDDEN');
  }

  // 3. Trigger questions generation
  const questions = await aiService.generateInterviewQuestions(applicationId);

  return res.status(200).json(
    apiResponse.success(questions, 'Interview questions generated successfully!')
  );
});

/**
 * General purpose AI assistant chat (Any authenticated user).
 */
export const chat = catchAsync(async (req, res, next) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    throw new ApiError(400, 'Messages array is required.', 'MESSAGES_REQUIRED');
  }

  const defaultPrompt = 'You are HireFlow AI, a premium talent acquisition assistant. Help the user draft compelling job postings or refine their resumes.';
  const prompt = systemPrompt || defaultPrompt;

  const reply = await aiService.chat(messages, prompt);

  return res.status(200).json(
    apiResponse.success({ reply }, 'AI chat reply completed.')
  );
});
