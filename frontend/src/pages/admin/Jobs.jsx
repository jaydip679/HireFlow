import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  ArrowLeft, Search, Filter, ShieldAlert, AlertCircle, Briefcase, 
  Trash2, Eye, Calendar, Users, DollarSign, CheckCircle, XCircle
} from 'lucide-react';

export default function AdminJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Moderation state
  const [moderateJobId, setModerateJobId] = useState(null);
  const [moderateLoading, setModerateLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/admin/jobs');
      setJobs(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve jobs for moderation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleModerateDelete = async () => {
    if (!moderateJobId) return;
    setModerateLoading(true);
    try {
      await axiosInstance.delete(`/admin/jobs/${moderateJobId}`);
      
      // Update local state by setting status to soft-deleted
      setJobs(jobs.map(j => j._id === moderateJobId ? { ...j, isDeleted: true, status: 'deleted' } : j));
      setModerateJobId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to moderate and delete job.');
    } finally {
      setModerateLoading(false);
    }
  };

  // Filter & Search computation
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          j.employer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status matching (handling active, closed, deleted statuses)
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = j.status === 'active' && !j.isDeleted;
    else if (statusFilter === 'closed') matchesStatus = j.status === 'closed' && !j.isDeleted;
    else if (statusFilter === 'deleted') matchesStatus = j.isDeleted;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Assembling vacancy directory...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 relative z-10">
      
      {/* Return link */}
      <div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-655 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Panel
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/20 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-3xs bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded font-bold uppercase w-max">
            Admin Vacancy Controls
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-brand-500" />
            Platform Vacancies Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit all job posts created by recruiters. Examine application counts, location types, and moderate listings.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings by title or employer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-xs text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="w-full sm:w-48 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Posts</option>
            <option value="closed">Closed Posts</option>
            <option value="deleted">Moderate Deleted</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border text-center flex flex-col items-center gap-3 max-w-lg mx-auto py-16">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-slate-655 dark:text-slate-350 font-medium">{error}</p>
          <button
            onClick={fetchJobs}
            className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-655 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-md mx-auto">
          <Briefcase className="w-10 h-10 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Jobs Found</h3>
          <p className="text-xs text-slate-505 dark:text-slate-400">
            No vacancies matched your specified query terms.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/40 dark:bg-darkbg-100/25 border-b border-slate-200/50 dark:border-slate-800/20 text-slate-450 uppercase font-extrabold tracking-wider">
                  <th className="py-4 px-6">Job Vacancy Specification</th>
                  <th className="py-4 px-6">Employer / Recruiter</th>
                  <th className="py-4 px-6 text-center">Applicants</th>
                  <th className="py-4 px-6">Salary Specifications</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/10 font-medium">
                {filteredJobs.map((j) => (
                  <tr 
                    key={j._id}
                    className="hover:bg-slate-50/20 dark:hover:bg-darkbg-100/5 transition-colors"
                  >
                    {/* Job Title & type */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{j.title}</span>
                        <div className="flex items-center gap-2 text-2xs text-slate-400 font-normal capitalize">
                          <span>{j.jobType}</span>
                          <span>•</span>
                          <span>{j.isRemote ? 'Remote' : j.location || 'On-site'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Employer name */}
                    <td className="py-4 px-6 text-slate-655 dark:text-slate-350">
                      {j.employer?.name || 'Verified Employer'}
                    </td>

                    {/* Applicants count */}
                    <td className="py-4 px-6 text-center">
                      {j.applicationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-bold">
                          <Users className="w-3 h-3" />
                          {j.applicationCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">0</span>
                      )}
                    </td>

                    {/* Salary range */}
                    <td className="py-4 px-6 text-slate-705 dark:text-slate-300">
                      {j.salary && (j.salary.min || j.salary.max) ? (
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ${j.salary.min?.toLocaleString()} - ${j.salary.max?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Undisclosed</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-2xs font-extrabold uppercase border ${
                        j.isDeleted 
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-250/50 dark:border-rose-900/30' :
                        j.status === 'closed'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border-amber-250/50 dark:border-amber-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250/50 dark:border-emerald-900/30'
                      }`}>
                        {j.isDeleted ? 'Deleted' : j.status}
                      </span>
                    </td>

                    {/* Moderation Force delete */}
                    <td className="py-4 px-6 text-right">
                      {j.isDeleted ? (
                        <span className="text-[10px] text-slate-405 italic">Moderated</span>
                      ) : (
                        <button
                          onClick={() => setModerateJobId(j._id)}
                          className="py-1 px-3 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 hover:text-rose-700 rounded-xl text-2xs font-bold transition-all select-none active:scale-95 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderate Deletion Modal */}
      {moderateJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-650 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Moderate Listing Deletion</h3>
                <p className="text-2xs text-slate-505 dark:text-slate-455 leading-relaxed">
                  Are you sure you want to forcibly remove this vacancy listing? Recruiter access will be terminated for this post, and it will be hidden system-wide.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-3">
              <button
                onClick={() => setModerateJobId(null)}
                className="py-1.5 px-3.5 text-2xs font-semibold text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
              >
                Keep Vacancy
              </button>
              <button
                onClick={handleModerateDelete}
                disabled={moderateLoading}
                className="py-1.5 px-4 text-2xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg active:scale-95 disabled:opacity-50 transition-all shadow-sm"
              >
                {moderateLoading ? 'Removing...' : 'Moderate Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
