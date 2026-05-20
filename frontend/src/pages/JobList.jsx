import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance.js';
import { 
  Search, MapPin, Briefcase, DollarSign, Filter, 
  ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, Info, Globe, Building2
} from 'lucide-react';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & pagination state
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Trigger search / fetch
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 8,
        sortBy,
        order
      };

      if (q) params.q = q;
      if (skills) params.skills = skills;
      if (jobType) params.jobType = jobType;
      if (location) params.location = location;
      if (isRemote !== '') params.isRemote = isRemote;
      if (salaryMin) params.salaryMin = salaryMin;

      const res = await axiosInstance.get('/jobs', { params });
      const { docs, totalPages: pages, totalDocs } = res.data.data;
      setJobs(docs);
      setTotalPages(pages);
      setTotalJobs(totalDocs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch job postings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, jobType, isRemote, sortBy, order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleResetFilters = () => {
    setQ('');
    setSkills('');
    setJobType('');
    setLocation('');
    setIsRemote('');
    setSalaryMin('');
    setSortBy('createdAt');
    setOrder('desc');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-8 py-4 relative z-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 dark:from-white dark:via-brand-200 dark:to-indigo-300 bg-clip-text text-transparent">
            Explore Open Opportunities
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Discover roles that align with your skillset and leverage AI screening.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium self-start md:self-end">
          Showing <span className="text-brand-650 dark:text-brand-400 font-bold">{totalJobs}</span> matching roles
        </div>
      </div>

      {/* Main Search Panel */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title, company name, description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div className="w-full md:w-60 relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="City, State, or Country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-sm text-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="py-3 px-6 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Find Jobs
        </button>
      </form>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="glass-panel p-5 rounded-2xl border flex flex-col gap-5 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/20">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                Filters
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Job Type Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => {
                  setJobType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
              >
                <option value="">All Job Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            {/* Skills Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Required Skills
              </label>
              <input
                type="text"
                placeholder="e.g. React, Node, Python"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onBlur={() => { setPage(1); fetchJobs(); }}
                className="w-full px-3 py-2 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
              />
              <span className="text-3xs text-slate-400 dark:text-slate-500">Comma-separated</span>
            </div>

            {/* Remote Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Location Setting
              </label>
              <select
                value={isRemote}
                onChange={(e) => {
                  setIsRemote(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
              >
                <option value="">All Roles</option>
                <option value="true">Remote Only</option>
                <option value="false">On-site / Hybrid</option>
              </select>
            </div>

            {/* Salary Min */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Minimum Annual Salary ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                onBlur={() => { setPage(1); fetchJobs(); }}
                className="w-full px-3 py-2 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Sorting */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/20">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1.5 text-3xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="createdAt">Date Posted</option>
                  <option value="salary">Salary</option>
                  <option value="applicationCount">Popularity</option>
                </select>
                <select
                  value={order}
                  onChange={(e) => {
                    setOrder(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1.5 text-3xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-lg outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Feed Grid */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Scanning for active jobs...</span>
            </div>
          ) : error ? (
            <div className="glass-panel p-8 rounded-2xl border text-center flex flex-col items-center gap-3">
              <Info className="w-8 h-8 text-rose-500" />
              <p className="text-slate-650 dark:text-slate-300 font-medium">{error}</p>
              <button
                onClick={fetchJobs}
                className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
              >
                Retry Request
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border text-center flex flex-col items-center gap-4">
              <Info className="w-10 h-10 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Jobs Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                We couldn't find any job listings matching your specified filters. Try loosening your terms or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 py-2.5 px-5 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-xl active:scale-95 transition-all shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Job Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="glass-panel p-5 rounded-2xl border hover-card hover:border-brand-500/50 flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex flex-col gap-2.5">
                      {/* Job Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-500 line-clamp-1">
                            {job.title}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {job.employer?.name || 'Verified Employer'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                          job.jobType === 'full-time' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30' :
                          job.jobType === 'internship' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30' :
                          job.jobType === 'part-time' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30' :
                          'bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30'
                        }`}>
                          {job.jobType}
                        </span>
                      </div>

                      {/* Description Snippet */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.skillsRequired?.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="text-[10px] font-medium bg-slate-100 dark:bg-darkbg-100/50 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skillsRequired?.length > 3 && (
                          <span className="text-[9px] font-medium bg-slate-100 dark:bg-darkbg-100/50 text-slate-400 px-1.5 py-0.5 rounded">
                            +{job.skillsRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Job Footer Details */}
                    <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/20 pt-3 text-[11px] text-slate-450 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-450 shrink-0" />
                          {job.isRemote ? 'Remote' : job.location || 'On-site'}
                        </span>
                        {job.salary && (job.salary.min || job.salary.max) && (
                          <span className="flex items-center gap-0.5 font-bold text-slate-600 dark:text-slate-300">
                            <DollarSign className="w-3 h-3 text-slate-450 shrink-0" />
                            {job.salary.min ? `${(job.salary.min / 1000).toFixed(0)}k` : '0k'}
                            {job.salary.max ? ` - ${(job.salary.max / 1000).toFixed(0)}k` : ''}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2 py-3 bg-white/20 dark:bg-darkbg-100/10 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  
                  <span className="text-xs text-slate-500 dark:text-slate-450 font-medium">
                    Page <span className="text-slate-800 dark:text-white font-bold">{page}</span> of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 disabled:opacity-40 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
