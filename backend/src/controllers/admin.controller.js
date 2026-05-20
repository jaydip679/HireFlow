import User from '../models/User.model.js';
import Job from '../models/Job.model.js';
import Application from '../models/Application.model.js';
import * as jobService from '../services/job.service.js';
import { revokeAllUserTokens } from '../services/token.service.js';
import { getPagination, buildPaginationMeta } from '../utils/paginate.js';
import ApiError from '../utils/apiError.js';
import catchAsync from '../utils/catchAsync.js';
import * as apiResponse from '../utils/apiResponse.js';

/**
 * Retrieve platform analytics (Admin only).
 */
export const getAnalytics = catchAsync(async (req, res, next) => {
  const [
    totalUsers,
    applicantsCount,
    employersCount,
    adminsCount,
    totalJobs,
    activeJobsCount,
    closedJobsCount,
    deletedJobsCount,
    totalApplications,
    pendingAppsCount,
    shortlistedAppsCount,
    rejectedAppsCount,
    hiredAppsCount,
    screenedAppsCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'applicant' }),
    User.countDocuments({ role: 'employer' }),
    User.countDocuments({ role: 'admin' }),
    
    Job.countDocuments(),
    Job.countDocuments({ status: 'active', isDeleted: false }),
    Job.countDocuments({ status: 'closed', isDeleted: false }),
    Job.countDocuments({ isDeleted: true }),

    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    Application.countDocuments({ status: 'shortlisted' }),
    Application.countDocuments({ status: 'rejected' }),
    Application.countDocuments({ status: 'hired' }),
    Application.countDocuments({ aiScreenedAt: { $ne: null } }),
  ]);

  const analytics = {
    users: {
      total: totalUsers,
      applicants: applicantsCount,
      employers: employersCount,
      admins: adminsCount,
    },
    jobs: {
      total: totalJobs,
      active: activeJobsCount,
      closed: closedJobsCount,
      deleted: deletedJobsCount,
    },
    applications: {
      total: totalApplications,
      pending: pendingAppsCount,
      shortlisted: shortlistedAppsCount,
      rejected: rejectedAppsCount,
      hired: hiredAppsCount,
      screened: screenedAppsCount,
    },
  };

  return res.status(200).json(
    apiResponse.success(analytics, 'Analytics dashboard retrieved successfully!')
  );
});

/**
 * List all platform users with filtering and pagination (Admin only).
 */
export const listUsers = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.isSuspended !== undefined) {
    filter.isSuspended = req.query.isSuspended === 'true';
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const safeUsers = users.map((u) => u.toSafeObject());
  const paginationMeta = buildPaginationMeta(total, page, limit);

  return res.status(200).json(
    apiResponse.success(safeUsers, 'Users retrieved successfully!', paginationMeta)
  );
});

/**
 * Suspend or unsuspend a user account (Admin only).
 * Revokes all active refresh tokens if the user is suspended.
 */
export const toggleUserSuspension = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { isSuspended } = req.body;

  if (isSuspended === undefined) {
    throw new ApiError(400, 'isSuspended boolean flag is required.', 'FLAG_REQUIRED');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
  }

  if (user.role === 'admin') {
    throw new ApiError(400, 'Admins cannot be suspended.', 'CANNOT_SUSPEND_ADMIN');
  }

  user.isSuspended = !!isSuspended;
  await user.save();

  // If suspended, wipe out all active refresh tokens to force immediate logout
  if (user.isSuspended) {
    await revokeAllUserTokens(user._id);
  }

  const action = user.isSuspended ? 'suspended' : 'unsuspended';
  return res.status(200).json(
    apiResponse.success(
      user.toSafeObject(),
      `User account has been successfully ${action}.`
    )
  );
});

/**
 * List all jobs (active, closed, deleted) for moderation (Admin only).
 */
export const listAllJobs = catchAsync(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.isDeleted !== undefined) {
    filter.isDeleted = req.query.isDeleted === 'true';
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('employer', 'name email company.name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  const paginationMeta = buildPaginationMeta(total, page, limit);

  return res.status(200).json(
    apiResponse.success(jobs, 'Jobs list retrieved successfully!', paginationMeta)
  );
});

/**
 * Moderate a job posting (Admin only).
 * Performs a soft-delete on the job post.
 */
export const moderateJobDelete = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const deletedJob = await jobService.deleteJob(id);
  return res.status(200).json(
    apiResponse.success(deletedJob, 'Job posting moderated and soft-deleted successfully!')
  );
});
