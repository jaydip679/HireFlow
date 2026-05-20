import * as applicationService from '../services/application.service.js';
import { uploadFileToProvider } from '../middleware/upload.middleware.js';
import Job from '../models/Job.model.js';
import Application from '../models/Application.model.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Submit an application (Applicant only).
 * Handles PDF uploads via Multer memory buffers or falls back to using the profile resume.
 */
export const apply = catchAsync(async (req, res, next) => {
  const { jobId, coverLetter } = req.body;
  let resumeData = null;

  // 1. Process uploaded resume file if present
  if (req.file) {
    const uploadFolder = `resumes/${req.user._id}`;
    const uploadResult = await uploadFileToProvider(
      req.file.buffer,
      uploadFolder,
      req.file.originalname,
      req.file.mimetype
    );
    resumeData = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  } else {
    // 2. No file uploaded. Fall back to using the candidate's pre-uploaded profile resume
    // We select '+resume' in user model if needed, but it's part of user object by default
    if (req.user.resume && req.user.resume.url) {
      resumeData = {
        url: req.user.resume.url,
        publicId: req.user.resume.publicId
      };
    }
  }

  // PRD Edge Case: No resume on profile + no resume uploaded on apply -> 400
  if (!resumeData || !resumeData.url) {
    throw new ApiError(400, 'A resume is required to apply. Please upload a PDF or complete your profile.', 'RESUME_REQUIRED');
  }

  // 3. Execute the submission
  const application = await applicationService.applyToJob(
    req.user._id,
    jobId,
    coverLetter,
    resumeData
  );

  return res.status(201).json(
    apiResponse.success(application, 'Application submitted successfully!')
  );
});

/**
 * Get all applications submitted by the logged-in candidate.
 */
export const getMyApplications = catchAsync(async (req, res, next) => {
  const { applications, pagination } = await applicationService.getApplicantHistory(
    req.user._id,
    req.query
  );
  
  return res.status(200).json(
    apiResponse.success(applications, 'Applications retrieved successfully!', pagination)
  );
});

/**
 * Get applicants for a specific job (Employer only).
 * Only the owner of the job can list them.
 */
export const getApplicantsForJob = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { applicants, pagination } = await applicationService.getJobApplicants(
    jobId,
    req.user._id,
    req.query
  );

  return res.status(200).json(
    apiResponse.success(applicants, 'Job applicants retrieved successfully!', pagination)
  );
});

/**
 * Get detailed application records (Employer or Applicant).
 */
export const getApplicationDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const application = await Application.findById(id)
    .populate('applicant', 'name email skills headline avatar.url')
    .populate('job', 'title status employer');

  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  // Authorization check: Only candidate, employer (owner of job), or admin can view
  const isApplicant = application.applicant._id.toString() === req.user._id.toString();
  const isEmployer = application.job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isApplicant && !isEmployer && !isAdmin) {
    throw new ApiError(403, 'Access denied. You are not authorized to view this application.', 'FORBIDDEN');
  }

  return res.status(200).json(
    apiResponse.success(application, 'Application details retrieved successfully!')
  );
});

/**
 * Update the status of a candidate application (Employer or Admin).
 * Only the job's employer can update candidate statuses.
 */
export const updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, employerNote } = req.body;

  // Verify the employer owns the associated job first
  const application = await Application.findById(id).populate('job');
  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  const isEmployer = application.job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isEmployer && !isAdmin) {
    throw new ApiError(403, 'Access denied. You can only update statuses of applications for your own job postings.', 'FORBIDDEN');
  }

  const updatedApp = await applicationService.updateStatus(
    id,
    status,
    employerNote,
    req.user._id
  );

  return res.status(200).json(
    apiResponse.success(updatedApp, 'Application status updated successfully!')
  );
});

/**
 * Withdraw an application (Applicant only).
 */
export const withdraw = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const withdrawnApp = await applicationService.withdrawApplication(id, req.user._id);
  
  return res.status(200).json(
    apiResponse.success(withdrawnApp, 'Application withdrawn successfully!')
  );
});
