export const buildJobFilter = (query) => {
  const filter = { isDeleted: false };

  // Default: only active, non-expired jobs
  filter.status = query.status || 'active';
  
  if (filter.status === 'active') {
    filter.$or = [
      { deadline: null },
      { deadline: { $gte: new Date() } },
    ];
  }

  // Full-text search across MongoDB text-indexed fields
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  // Skill filter: any of the listed skills (OR match logic)
  if (query.skills) {
    const skillArray = query.skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillArray.length > 0) {
      // Find jobs that require at least one of these skills (case-insensitive regular expressions or direct matches)
      // Mongoose matches exact values inside arrays
      filter.skillsRequired = { $in: skillArray };
    }
  }

  if (query.jobType) {
    filter.jobType = query.jobType;
  }
  
  if (query.location) {
    filter.location = new RegExp(query.location, 'i');
  }
  
  if (typeof query.isRemote === 'boolean') {
    filter.isRemote = query.isRemote;
  }

  // Salary range bounds filtering
  if (query.salaryMin || query.salaryMax) {
    filter['salary.min'] = {};
    if (query.salaryMin) {
      filter['salary.min'].$gte = query.salaryMin;
    }
    if (query.salaryMax) {
      filter['salary.min'].$lte = query.salaryMax;
    }
  }

  return filter;
};

export const buildJobSort = (sortBy = 'createdAt', order = 'desc') => {
  const orderVal = order === 'asc' ? 1 : -1;
  const sortMap = {
    createdAt:        { createdAt: orderVal },
    salary:           { 'salary.min': orderVal },
    applicationCount: { applicationCount: orderVal },
  };
  return sortMap[sortBy] || { createdAt: -1 };
};
