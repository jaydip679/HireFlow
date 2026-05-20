import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  FileText, ShieldCheck, AlertCircle, Clock, ChevronDown, ChevronUp, 
  MapPin, DollarSign, Calendar, XCircle, Info, Sparkles, AlertTriangle
} from 'lucide-react';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded detail cards mapping
  const [expandedAppId, setExpandedAppId] = useState(null);
  
  // Withdraw confirmation states
  const [withdrawAppId, setWithdrawAppId] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/applications/my-applications');
      setApplications(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch application history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const toggleExpand = (appId) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const handleWithdrawClick = (e, appId) => {
    e.preventDefault();
    e.stopPropagation();
    setWithdrawAppId(appId);
    setWithdrawError(null);
  };

  const handleWithdrawConfirm = async () => {
    setWithdrawLoading(true);
    setWithdrawError(null);
    try {
      await axiosInstance.patch(`/applications/${withdrawAppId}/withdraw`);
      
      // Update applications state locally
      setApplications(applications.map(app => {
        if (app._id === withdrawAppId) {
          const now = new Date();
          return {
            ...app,
            status: 'withdrawn',
            statusHistory: [
              ...app.statusHistory,
              { status: 'withdrawn', changedAt: now, changedBy: 'self' }
            ]
          };
        }
        return app;
      }));

      setWithdrawAppId(null);
    } catch (err) {
      setWithdrawError(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Assembling application timeline...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-brand-200 bg-clip-text text-transparent">
          My Applied Positions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track the status of your applications and view live AI resume screening metrics.
        </p>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border text-center flex flex-col items-center gap-3 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-slate-650 dark:text-slate-300 font-medium">{error}</p>
          <button
            onClick={fetchApplications}
            className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Applications</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven't submitted any job applications yet. Visit the Job Board to find roles.
          </p>
          <Link
            to="/jobs"
            className="mt-2 py-2.5 px-5 bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white rounded-xl active:scale-95 transition-all"
          >
            Browse Job Board
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Applications list */}
          {applications.map((app) => {
            const isExpanded = expandedAppId === app._id;
            const job = app.job || {};
            const employer = job.employer || {};

            return (
              <div 
                key={app._id}
                className={`glass-panel rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-brand-500/50 shadow-md' : 'hover:border-slate-350 dark:hover:border-slate-800'
                }`}
              >
                
                {/* Accordion Summary Row */}
                <div 
                  onClick={() => toggleExpand(app._id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        app.status === 'shortlisted' ? 'status-badge-shortlisted' :
                        app.status === 'rejected' ? 'status-badge-rejected' :
                        app.status === 'reviewed' ? 'status-badge-reviewed' :
                        app.status === 'hired' ? 'status-badge-hired' :
                        app.status === 'withdrawn' ? 'status-badge-withdrawn' :
                        'status-badge-pending'
                      }`}>
                        {app.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Applied on {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {job.title || 'Unknown Position'}
                    </h2>
                    
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {employer.name || 'Verified Employer'}
                    </span>
                  </div>

                  {/* Right hand columns: Score + Arrow */}
                  <div className="flex items-center gap-5 self-end sm:self-center">
                    
                    {/* Score indicators */}
                    {app.aiScore !== undefined && app.aiScore !== null ? (
                      <div className="flex items-center gap-2 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-xl">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-brand-300">
                          {app.aiScore}% Match
                        </span>
                      </div>
                    ) : app.status === 'withdrawn' ? null : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Screening...
                      </div>
                    )}

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-slate-200/50 dark:border-slate-800/20 bg-slate-50/40 dark:bg-darkbg-100/10 p-5 sm:p-6 flex flex-col gap-6 animate-fadeIn">
                    
                    {/* Job Details Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Meta Columns */}
                      <div className="md:col-span-1 flex flex-col gap-3.5 bg-white/40 dark:bg-darkbg-100/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Position Details
                        </h4>
                        
                        <div className="flex flex-col gap-2.5 text-xs">
                          <span className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {job.isRemote ? 'Remote' : job.location || 'On-site'}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350 capitalize">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {job.jobType}
                          </span>
                          {job.salary && (job.salary.min || job.salary.max) && (
                            <span className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350 font-semibold">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ${job.salary.min?.toLocaleString()} - ${job.salary.max?.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/jobs/${job._id}`}
                          className="mt-2 text-2xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                        >
                          View Original Posting
                        </Link>
                      </div>

                      {/* AI Report Card */}
                      <div className="md:col-span-2 flex flex-col gap-4 bg-white/40 dark:bg-darkbg-100/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                          AI Assessment Summary
                        </h4>

                        {app.aiScore !== undefined && app.aiScore !== null ? (
                          <div className="flex flex-col gap-3">
                            {app.aiSummary && (
                              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed italic">
                                "{app.aiSummary}"
                              </p>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-200/40 dark:border-slate-800/20 pt-3">
                              {app.aiStrengths && app.aiStrengths.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-emerald-650 dark:text-emerald-400 text-3xs uppercase tracking-wider">Key Strengths</span>
                                  <ul className="list-disc pl-4 text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 text-2xs">
                                    {app.aiStrengths.map((str, idx) => <li key={idx}>{str}</li>)}
                                  </ul>
                                </div>
                              )}
                              {app.aiGaps && app.aiGaps.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  <span className="font-bold text-amber-650 dark:text-amber-400 text-3xs uppercase tracking-wider">Identified Skill Gaps</span>
                                  <ul className="list-disc pl-4 text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 text-2xs">
                                    {app.aiGaps.map((gap, idx) => <li key={idx}>{gap}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : app.status === 'withdrawn' ? (
                          <span className="text-xs text-slate-400 italic">This application was withdrawn before screening.</span>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/10">
                            <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                            <span>The AI is currently processing your resume. The report card will populate shortly.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline & Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200/50 dark:border-slate-800/20 pt-5">
                      
                      {/* Vertical status timeline */}
                      <div className="flex-1 flex flex-col gap-2.5">
                        <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Application Journey
                        </span>
                        
                        <div className="flex flex-col gap-3 relative pl-4 border-l border-slate-200 dark:border-slate-800/60 ml-2 py-1">
                          {app.statusHistory && app.statusHistory.map((history, hIdx) => (
                            <div key={hIdx} className="relative flex flex-col gap-0.5">
                              {/* Dot overlay */}
                              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border bg-slate-50 dark:bg-darkbg-200 border-slate-300 dark:border-slate-800" />
                              <span className="text-2xs font-bold text-slate-800 dark:text-white capitalize">
                                {history.status}
                              </span>
                              <span className="text-3xs text-slate-400">
                                {new Date(history.changedAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Employer note */}
                      {app.employerNote && (
                        <div className="w-full sm:max-w-xs flex flex-col gap-1.5 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/30 p-3.5 rounded-xl">
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-400" /> Note from Recruiter
                          </span>
                          <p className="text-2xs text-slate-600 dark:text-slate-350 italic">
                            "{app.employerNote}"
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {app.status !== 'withdrawn' && app.status !== 'hired' && app.status !== 'rejected' && app.status !== 'shortlisted' && (
                        <button
                          onClick={(e) => handleWithdrawClick(e, app._id)}
                          className="py-2 px-4 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-[10px] font-bold text-rose-600 dark:text-rose-400 rounded-xl active:scale-95 transition-all self-end sm:self-start flex items-center gap-1 shrink-0"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Withdraw Application
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-450 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Withdraw Application?</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Are you sure you want to withdraw this application? This action is permanent and you cannot re-apply.
                </p>
              </div>
            </div>

            {withdrawError && (
              <span className="text-2xs text-rose-500 font-semibold">{withdrawError}</span>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-3">
              <button
                onClick={() => setWithdrawAppId(null)}
                className="py-1.5 px-3.5 text-2xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
              >
                Keep Active
              </button>
              <button
                onClick={handleWithdrawConfirm}
                disabled={withdrawLoading}
                className="py-1.5 px-4 text-2xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg active:scale-95 disabled:opacity-50 transition-all shadow-sm"
              >
                {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
