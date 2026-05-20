import * as jobService from '../services/job.service.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Post a new job (Employer only).
 */
export const createJob = catchAsync(async (req, res, next) => {
  const job = await jobService.createJob(req.body, req.user._id);
  return res.status(201).json(
    apiResponse.success(job, 'Job posting created successfully!')
  );
});

/**
 * List active jobs with text queries and skill filters (Public).
 */
export const listJobs = catchAsync(async (req, res, next) => {
  const { jobs, pagination } = await jobService.listJobs(req.query, false);
  return res.status(200).json(
    apiResponse.success(jobs, 'Jobs retrieved successfully!', pagination)
  );
});

/**
 * List jobs created by the authenticated employer (Employer dashboard).
 */
export const getMyJobs = catchAsync(async (req, res, next) => {
  const { jobs, pagination } = await jobService.listJobs(req.query, true, req.user._id);
  return res.status(200).json(
    apiResponse.success(jobs, 'Employer jobs retrieved successfully!', pagination)
  );
});

/**
 * Retrieve a single job details by ID (Public).
 */
export const getJob = catchAsync(async (req, res, next) => {
  const job = await jobService.getJobById(req.params.id, true);
  return res.status(200).json(
    apiResponse.success(job, 'Job retrieved successfully!')
  );
});

/**
 * Update a job details (Owner or Admin only).
 * Note: ownership verification is already completed by `authorizeOwnerOrAdmin` middleware.
 */
export const updateJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const updatedJob = await jobService.updateJob(jobId, req.body);
  return res.status(200).json(
    apiResponse.success(updatedJob, 'Job posting updated successfully!')
  );
});

/**
 * Close/Close job posting.
 */
export const closeJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const updatedJob = await jobService.updateJob(jobId, { status: 'closed' });
  return res.status(200).json(
    apiResponse.success(updatedJob, 'Job posting closed successfully!')
  );
});

/**
 * Reopen a job posting.
 */
export const reopenJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const updatedJob = await jobService.updateJob(jobId, { status: 'active' });
  return res.status(200).json(
    apiResponse.success(updatedJob, 'Job posting reopened successfully!')
  );
});

/**
 * Soft delete a job posting (Owner or Admin only).
 */
export const deleteJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  await jobService.deleteJob(jobId);
  return res.status(200).json(
    apiResponse.success(null, 'Job posting soft-deleted successfully!')
  );
});
