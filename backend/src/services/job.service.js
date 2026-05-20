import Job from '../models/Job.model.js';
import { getPagination, buildPaginationMeta } from '../utils/paginate.js';
import { buildJobFilter, buildJobSort } from '../utils/buildFilter.js';
import ApiError from '../utils/apiError.js';
import logger from '../config/logger.js';

/**
 * Create a new job posting for an employer.
 */
export const createJob = async (jobData, employerId) => {
  logger.info(`Creating new job posting for employer: ${employerId}`);
  const job = await Job.create({
    ...jobData,
    employer: employerId,
  });
  return job;
};

/**
 * List jobs with paginated search, filter, and sorting.
 */
export const listJobs = async (queryParams, isEmployerDashboard = false, employerId = null) => {
  const { page, limit, skip } = getPagination(queryParams);
  
  // Construct filter object
  const filter = buildJobFilter(queryParams);

  // If queried from employer dashboard, restrict to their jobs and bypass default active helper
  if (isEmployerDashboard && employerId) {
    filter.employer = employerId;
    delete filter.status; // Allow showing active & closed
  }

  const projection = {
    title:            1,
    jobType:          1,
    location:         1,
    isRemote:         1,
    salary:           1,
    status:           1,
    deadline:         1,
    applicationCount: 1,
    createdAt:        1,
    employer:         1,
    skillsRequired:   1,
    description:      1,
    // Add textScore projection when full-text searching
    ...(filter.$text && { score: { $meta: 'textScore' } }),
  };

  const sort = buildJobSort(queryParams.sortBy, queryParams.order);
  const sortOptions = filter.$text
    ? { score: { $meta: 'textScore' }, ...sort }  // Relevance-first when searching
    : sort;

  let queryBuilder = Job.find(filter, projection);
  
  // If it's a public feed (not employer dashboard), apply active query helper
  if (!isEmployerDashboard) {
    queryBuilder = queryBuilder.active();
  }

  const [jobs, total] = await Promise.all([
    queryBuilder
      .populate('employer', 'name company.name company.logo avatar.url')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(), // lean speeds up queries 3-5x by avoiding full hydration
    Job.countDocuments(filter)
  ]);

  const paginationMeta = buildPaginationMeta(total, page, limit);

  return { jobs, pagination: paginationMeta };
};

/**
 * Retrieve a single job posting by ID.
 */
export const getJobById = async (id, isPublic = true) => {
  const query = Job.findById(id).populate('employer', 'name company.name company.logo company.website avatar.url');
  
  const job = isPublic 
    ? await query.where({ isDeleted: false }).lean()
    : await query.lean();

  if (!job) {
    throw new ApiError(404, 'Job posting not found.', 'JOB_NOT_FOUND');
  }

  return job;
};

/**
 * Update an existing job posting.
 */
export const updateJob = async (id, updateData) => {
  logger.info(`Updating job posting: ${id}`);
  
  const job = await Job.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!job) {
    throw new ApiError(404, 'Job posting not found.', 'JOB_NOT_FOUND');
  }

  return job;
};

/**
 * Soft delete a job posting by setting isDeleted: true.
 * This preserves candidate application histories for reference.
 */
export const deleteJob = async (id) => {
  logger.info(`Soft deleting job posting: ${id}`);
  
  const job = await Job.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, status: 'closed' } },
    { new: true }
  );

  if (!job) {
    throw new ApiError(404, 'Job posting not found.', 'JOB_NOT_FOUND');
  }

  return job;
};
