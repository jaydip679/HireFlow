import Application from '../models/Application.model.js';
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';
import { getPagination, buildPaginationMeta } from '../utils/paginate.js';
import ApiError from '../utils/apiError.js';
import logger from '../config/logger.js';
import { screenApplication } from './ai.service.js';
import { sendApplicationReceivedEmail, sendApplicationStatusEmail } from './email.service.js';

/**
 * Submit a job application.
 */
export const applyToJob = async (applicantId, jobId, coverLetter, resumeData) => {
  logger.info(`Applicant ${applicantId} applying to job ${jobId}`);

  // 1. Verify Job exists and is active
  const job = await Job.findById(jobId);
  if (!job || job.isDeleted) {
    throw new ApiError(404, 'Job posting not found.', 'JOB_NOT_FOUND');
  }

  // PRD Edge Case: Applicant applies to a closed job
  if (job.status !== 'active' || (job.deadline && new Date(job.deadline) < new Date())) {
    throw new ApiError(400, 'This job is closed and no longer accepting applications.', 'JOB_CLOSED');
  }

  // 2. Prevent duplicate applications (Compound Unique index will throw 11000 anyway, but check first to return clean error)
  const existingApp = await Application.findOne({ applicant: applicantId, job: jobId });
  if (existingApp) {
    throw new ApiError(409, 'You have already applied to this job.', 'DUPLICATE_APPLICATION');
  }

  // 3. Create the application
  const application = await Application.create({
    job: jobId,
    applicant: applicantId,
    resume: resumeData,
    coverLetter,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      changedBy: applicantId
    }]
  });

  // 4. Increment the job's applicationCount atomically
  await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

  // 5. Retrieve applicant details to send transactional emails
  const applicant = await User.findById(applicantId);
  
  // Send application confirmation email async
  sendApplicationReceivedEmail(applicant, job);

  // 6. Trigger AI resume screening asynchronously without blocking HTTP response
  // Any internal failure is caught inside screenApplication and logged, keeping aiScore null.
  screenApplication(application._id).catch((err) => {
    logger.error(`Deferred AI screening failed for application ${application._id}: ${err.message}`);
  });

  return application;
};

/**
 * Get all applications submitted by the logged-in candidate (Paginated).
 */
export const getApplicantHistory = async (applicantId, queryParams) => {
  const { page, limit, skip } = getPagination(queryParams);

  const filter = { applicant: applicantId };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'job',
        select: 'title location jobType isRemote salary status employer skillsRequired',
        populate: {
          path: 'employer',
          select: 'name company.name company.logo'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter)
  ]);

  const paginationMeta = buildPaginationMeta(total, page, limit);

  return { applications, pagination: paginationMeta };
};

/**
 * Get all applicants for a specific job (Employer review dashboard).
 */
export const getJobApplicants = async (jobId, employerId, queryParams) => {
  // 1. Verify job exists and belongs to the requesting employer
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job posting not found.', 'JOB_NOT_FOUND');
  }
  
  if (job.employer.toString() !== employerId.toString()) {
    throw new ApiError(403, 'Access denied. You do not own this job posting.', 'FORBIDDEN');
  }

  const { page, limit, skip } = getPagination(queryParams);

  const filter = { job: jobId };
  
  // Sort priority: high AI score first (unscreened/null scores will rank last automatically in MongoDB -1 sorts)
  const sort = { aiScore: -1, createdAt: -1 };

  const [applicants, total] = await Promise.all([
    Application.find(filter)
      .populate('applicant', 'name email headline skills avatar.url')
      .select('status aiScore aiSummary aiRecommendation aiStrengths aiGaps aiScreenedAt createdAt coverLetter resume employerNote')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter)
  ]);

  const paginationMeta = buildPaginationMeta(total, page, limit);

  return { applicants, pagination: paginationMeta };
};

/**
 * Update the status of a job application.
 */
export const updateStatus = async (applicationId, newStatus, employerNote, changedByUserId) => {
  logger.info(`Updating application ${applicationId} status to: ${newStatus}`);

  const application = await Application.findById(applicationId).populate('applicant');
  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  const job = await Job.findById(application.job);
  if (!job) {
    throw new ApiError(404, 'Associated job posting not found.', 'JOB_NOT_FOUND');
  }

  // 1. Validate status transition (PRD Section 5.3)
  const currentStatus = application.status;
  
  if (currentStatus === newStatus) {
    // No change required, just update notes if provided
    if (employerNote !== undefined) {
      application.employerNote = employerNote;
      await application.save();
    }
    return application;
  }

  // Terminal state protection
  const terminalStatuses = ['hired', 'rejected', 'withdrawn'];
  if (terminalStatuses.includes(currentStatus)) {
    throw new ApiError(400, `Cannot update status. The application has already reached a terminal state: "${currentStatus}".`, 'TERMINAL_STATE');
  }

  // Block moving backward
  if (currentStatus === 'reviewed' && newStatus === 'pending') {
    throw new ApiError(400, 'Cannot revert application status back to pending.', 'INVALID_TRANSITION');
  }
  
  if (currentStatus === 'shortlisted' && (newStatus === 'pending' || newStatus === 'reviewed')) {
    throw new ApiError(400, 'Cannot revert shortlisted application back to pending or reviewed.', 'INVALID_TRANSITION');
  }

  // 2. Perform state transition
  application.status = newStatus;
  if (employerNote !== undefined) {
    application.employerNote = employerNote;
  }
  
  application.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: changedByUserId
  });

  await application.save();

  // 3. Keep atomic counters in sync: if status is set to 'withdrawn', decrement applicationCount
  if (newStatus === 'withdrawn') {
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });
  }

  // 4. Send email notification to applicant
  sendApplicationStatusEmail(application.applicant, job, newStatus);

  return application;
};

/**
 * Withdraw an application (Applicant only).
 */
export const withdrawApplication = async (applicationId, applicantId) => {
  const application = await Application.findById(applicationId);
  
  if (!application) {
    throw new ApiError(404, 'Application record not found.', 'APPLICATION_NOT_FOUND');
  }

  if (application.applicant.toString() !== applicantId.toString()) {
    throw new ApiError(403, 'Access denied. You do not own this application.', 'FORBIDDEN');
  }

  const currentStatus = application.status;

  // PRD Edge Case: Applicant withdraws a shortlisted application
  if (currentStatus === 'shortlisted') {
    throw new ApiError(400, 'Cannot withdraw a shortlisted application. Please contact the employer.', 'WITHDRAW_SHORTLIST_BLOCKED');
  }
  
  if (currentStatus === 'hired' || currentStatus === 'rejected') {
    throw new ApiError(400, 'Cannot withdraw a finished application.', 'WITHDRAW_BLOCKED');
  }
  
  if (currentStatus === 'withdrawn') {
    return application;
  }

  // Update to withdrawn
  application.status = 'withdrawn';
  application.statusHistory.push({
    status: 'withdrawn',
    changedAt: new Date(),
    changedBy: applicantId
  });

  await application.save();

  // Decrement applicationCount
  await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });

  return application;
};
