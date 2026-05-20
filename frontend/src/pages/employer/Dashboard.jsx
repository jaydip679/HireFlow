import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  Plus, Users, FileText, CheckCircle, Clock, Trash2, Edit3, Eye, 
  ToggleLeft, ToggleRight, AlertCircle, Info, Sparkles, Building2
} from 'lucide-react';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Job delete state
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEmployerJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/jobs/my-jobs');
      setJobs(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve your job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  const handleToggleStatus = async (jobId, currentStatus) => {
    try {
      const endpoint = currentStatus === 'active' ? `/jobs/${jobId}/close` : `/jobs/${jobId}/reopen`;
      const res = await axiosInstance.patch(endpoint);
      const updatedJob = res.data.data;
      
      setJobs(jobs.map(job => job._id === jobId ? { ...job, status: updatedJob.status } : job));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to alter job posting state.');
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/jobs/${deleteJobId}`);
      setJobs(jobs.filter(job => job._id !== deleteJobId));
      setDeleteJobId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job posting.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute stat aggregates
  const totalJobsCount = jobs.length;
  const activeJobsCount = jobs.filter(j => j.status === 'active').length;
  const closedJobsCount = jobs.filter(j => j.status === 'closed').length;
  const totalAppsCount = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Assembling recruiter workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 relative z-10">
      
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-brand-200 bg-clip-text text-transparent flex items-center gap-2">
            <Building2 className="w-8 h-8 text-brand-500" />
            Employer Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Publish job openings, manage candidates, and examine AI resume matches.
          </p>
        </div>
        <Link
          to="/employer/post-job"
          className="flex items-center gap-2 py-3 px-5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl shadow-md shadow-brand-500/10 active:scale-95 transition-all w-max"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </Link>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border text-center flex flex-col items-center gap-3 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-slate-655 dark:text-slate-350 font-medium">{error}</p>
          <button
            onClick={fetchEmployerJobs}
            className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-655 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Posted */}
            <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Total Posted</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalJobsCount}</span>
              </div>
            </div>

            {/* Active Roles */}
            <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Active Roles</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeJobsCount}</span>
              </div>
            </div>

            {/* Closed Roles */}
            <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Closed Roles</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{closedJobsCount}</span>
              </div>
            </div>

            {/* Applications Received */}
            <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Total Applicants</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalAppsCount}</span>
              </div>
            </div>
          </div>

          {/* Job Postings Table Section */}
          <div className="glass-panel rounded-3xl border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/20 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">Active Postings Feed</span>
              <span className="text-3xs bg-slate-100 dark:bg-darkbg-100 px-2.5 py-1 rounded text-slate-500 font-bold uppercase">
                Platform Sync Status: Live
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4 py-16">
                <FileText className="w-10 h-10 text-slate-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No jobs posted yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Create your first job posting to start receiving resume submissions screened by our custom AI pipelines.
                </p>
                <Link
                  to="/employer/post-job"
                  className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white rounded-lg active:scale-95 transition-all"
                >
                  Create Posting
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/40 dark:bg-darkbg-100/25 border-b border-slate-200/50 dark:border-slate-800/20 text-slate-450 uppercase font-extrabold tracking-wider">
                      <th className="py-4 px-6">Job Specification</th>
                      <th className="py-4 px-6 text-center">Applicants</th>
                      <th className="py-4 px-6">Salary parameters</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/10">
                    {jobs.map((job) => (
                      <tr 
                        key={job._id}
                        className="hover:bg-slate-50/20 dark:hover:bg-darkbg-100/5 transition-colors duration-150"
                      >
                        {/* Job description & type */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{job.title}</span>
                            <div className="flex items-center gap-2 text-2xs text-slate-400 font-medium capitalize">
                              <span>{job.jobType}</span>
                              <span>•</span>
                              <span>{job.isRemote ? 'Remote' : job.location || 'On-site'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Applicants count */}
                        <td className="py-4 px-6 text-center">
                          {job.applicationCount > 0 ? (
                            <Link 
                              to={`/employer/jobs/${job._id}/applicants`}
                              className="inline-flex items-center gap-1.5 py-1 px-3 bg-brand-500/10 text-brand-650 dark:text-brand-400 border border-brand-500/25 rounded-full font-bold hover:bg-brand-500 hover:text-white transition-all select-none"
                            >
                              <Users className="w-3.5 h-3.5" />
                              {job.applicationCount} review{job.applicationCount > 1 ? 's' : ''}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">None yet</span>
                          )}
                        </td>

                        {/* Salary range */}
                        <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                          {job.salary && (job.salary.min || job.salary.max) ? (
                            <span>
                              ${job.salary.min?.toLocaleString()} - ${job.salary.max?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">Undisclosed</span>
                          )}
                        </td>

                        {/* Status Toggle buttons */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleStatus(job._id, job.status)}
                            className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-2xs font-extrabold uppercase select-none border transition-all ${
                              job.status === 'active' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250/50 dark:border-emerald-900/30'
                                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-250/50 dark:border-rose-900/30'
                            }`}
                          >
                            {job.status === 'active' ? 'Active' : 'Closed'}
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            
                            {/* View Applicants (if any) */}
                            <button
                              onClick={() => navigate(`/employer/jobs/${job._id}/applicants`)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100 text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 hover:border-brand-500/30 transition-all"
                              title="View Applicants"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => navigate(`/employer/jobs/${job._id}/edit`)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                              title="Edit Job Posting"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteJobId(job._id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100 text-slate-500 hover:text-rose-500 dark:hover:text-rose-450 hover:border-rose-500/30 transition-all"
                              title="Delete Job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-650 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Delete Job Posting?</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Are you sure you want to delete this job posting? This action is soft-deletes the job, making it inaccessible. Existing applications will be preserved but hidden.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-3">
              <button
                onClick={() => setDeleteJobId(null)}
                className="py-1.5 px-3.5 text-2xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="py-1.5 px-4 text-2xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg active:scale-95 disabled:opacity-50 transition-all"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Posting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
