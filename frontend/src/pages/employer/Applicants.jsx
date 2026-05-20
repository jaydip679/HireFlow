import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  ArrowLeft, FileText, Check, X, ShieldAlert, AlertCircle, Sparkles, 
  ChevronDown, ChevronUp, Clock, Info, User, CheckCircle, HelpCircle, AlertTriangle
} from 'lucide-react';

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded applicant detail mapping
  const [expandedAppId, setExpandedAppId] = useState(null);

  // Status updating states
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [employerNote, setEmployerNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Job details first
      const jobRes = await axiosInstance.get(`/jobs/${jobId}`);
      setJob(jobRes.data.data);

      // 2. Fetch applicants for job
      const applicantsRes = await axiosInstance.get(`/applications/job/${jobId}`);
      setApplicants(applicantsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve applicants list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const toggleExpand = (appId) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const handleOpenStatusModal = (e, appId, status, currentNote) => {
    e.preventDefault();
    e.stopPropagation();
    setUpdatingAppId(appId);
    setTargetStatus(status);
    setEmployerNote(currentNote || '');
    setStatusError(null);
  };

  const handleUpdateStatusConfirm = async (e) => {
    e.preventDefault();
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await axiosInstance.patch(`/applications/${updatingAppId}/status`, {
        status: targetStatus,
        employerNote: employerNote.trim() || undefined
      });
      
      const updatedApp = res.data.data;
      
      // Update local applicants list state
      setApplicants(applicants.map(app => 
        app._id === updatingAppId 
          ? { ...app, status: updatedApp.status, employerNote: updatedApp.employerNote } 
          : app
      ));

      setUpdatingAppId(null);
      setTargetStatus('');
      setEmployerNote('');
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-550/20';
    if (score >= 70) return 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-550/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-550/20';
    return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-550/20';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Analyzing applicant profiles...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="glass-panel p-10 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Page</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Associated job posting not found.'}</p>
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="mt-2 py-2 px-5 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 relative z-10">
      
      {/* Return link */}
      <div>
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/20 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-3xs bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded font-bold uppercase w-max">
            Recruiter Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5">
            Applicants for: {job.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select an applicant to review their resume, see technical skill matches, and view detailed AI reports.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-semibold self-start md:self-end">
          Total Candidates: <span className="text-brand-650 dark:text-brand-400 font-bold">{applicants.length}</span>
        </div>
      </div>

      {/* Main Applicants List */}
      {applicants.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-md mx-auto">
          <User className="w-12 h-12 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Applicants Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No candidates have applied to this job posting yet. Once they submit their PDF resumes, they will show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {applicants.map((app) => {
            const isExpanded = expandedAppId === app._id;
            const applicant = app.applicant || {};

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
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Applied {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {applicant.name || 'Anonymous Candidate'}
                    </h2>
                    
                    {applicant.headline && (
                      <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
                        {applicant.headline}
                      </span>
                    )}
                  </div>

                  {/* Right side AI match score & Arrow */}
                  <div className="flex items-center gap-5 self-end sm:self-center">
                    
                    {/* Score badge with custom colors */}
                    {app.aiScore !== undefined && app.aiScore !== null ? (
                      <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-2xs ${getScoreBadgeColor(app.aiScore)}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{app.aiScore}% Match</span>
                      </div>
                    ) : app.status === 'withdrawn' ? null : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Analyzing...
                      </div>
                    )}

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details body */}
                {isExpanded && (
                  <div className="border-t border-slate-200/50 dark:border-slate-800/20 bg-slate-50/40 dark:bg-darkbg-100/10 p-5 sm:p-6 flex flex-col gap-6 animate-fadeIn">
                    
                    {/* Candidate Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: Candidate profile summary */}
                      <div className="lg:col-span-1 flex flex-col gap-4 bg-white/40 dark:bg-darkbg-100/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Candidate Details
                        </h4>

                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{applicant.name}</span>
                          <span className="text-slate-500 dark:text-slate-405">{applicant.email}</span>
                        </div>

                        {applicant.skills && applicant.skills.length > 0 && (
                          <div className="flex flex-col gap-1.5 border-t border-slate-200/40 dark:border-slate-850/40 pt-3">
                            <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Profile Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {applicant.skills.map((skill, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 dark:bg-darkbg-100/50 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resume button link */}
                        {app.resume?.url && (
                          <a
                            href={app.resume.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center justify-center gap-1.5 py-2 px-4 border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 text-xs font-bold text-brand-650 dark:text-brand-400 rounded-xl transition-all text-center select-none active:scale-95"
                          >
                            <FileText className="w-4 h-4" /> Open Resume PDF
                          </a>
                        )}
                      </div>

                      {/* Right: AI Screening Analysis Card */}
                      <div className="lg:col-span-2 flex flex-col gap-4 bg-white/40 dark:bg-darkbg-100/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                          AI Match Summary & Report
                        </h4>

                        {app.aiScore !== undefined && app.aiScore !== null ? (
                          <div className="flex flex-col gap-3">
                            {app.aiSummary && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-150/20 dark:bg-darkbg-100/20 p-3 rounded-xl border border-slate-200/30 dark:border-slate-850/20 italic">
                                "{app.aiSummary}"
                              </p>
                            )}

                            {app.aiRecommendation && (
                              <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                                <Info className="w-4 h-4 text-brand-500" />
                                <span>Recommendation: {app.aiRecommendation}</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-200/40 dark:border-slate-850/40 pt-3">
                              {app.aiStrengths && app.aiStrengths.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <span className="font-bold text-emerald-650 dark:text-emerald-400 text-3xs uppercase tracking-wider">Top Credentials</span>
                                  <ul className="list-disc pl-4 text-slate-500 dark:text-slate-405 flex flex-col gap-0.5 text-2xs">
                                    {app.aiStrengths.map((str, idx) => <li key={idx}>{str}</li>)}
                                  </ul>
                                </div>
                              )}
                              {app.aiGaps && app.aiGaps.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <span className="font-bold text-amber-650 dark:text-amber-400 text-3xs uppercase tracking-wider">Identified Skill Gaps</span>
                                  <ul className="list-disc pl-4 text-slate-500 dark:text-slate-405 flex flex-col gap-0.5 text-2xs">
                                    {app.aiGaps.map((gap, idx) => <li key={idx}>{gap}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : app.status === 'withdrawn' ? (
                          <span className="text-xs text-slate-400 italic">This application was withdrawn before screening.</span>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl text-xs text-slate-505 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/10">
                            <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                            <span>The AI is currently processing this candidate's PDF. Refresh details shortly.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Candidate Cover Letter */}
                    {app.coverLetter && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-200/50 dark:border-slate-800/20 pt-4">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Candidate Cover Letter
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-white/30 dark:bg-darkbg-100/10 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                          {app.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* Recruiter feedback notes */}
                    {app.employerNote && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-200/50 dark:border-slate-800/20 pt-4">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Recruiter Internal / Feedback Note
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-350 italic bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                          "{app.employerNote}"
                        </p>
                      </div>
                    )}

                    {/* Status Action Buttons Bar */}
                    {app.status !== 'withdrawn' && app.status !== 'hired' && app.status !== 'rejected' && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-4 mt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-2">
                          Alter Candidate Status:
                        </span>
                        
                        {app.status === 'pending' && (
                          <button
                            onClick={(e) => handleOpenStatusModal(e, app._id, 'reviewed', app.employerNote)}
                            className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-650 dark:text-indigo-400 hover:text-white border border-indigo-500/20 rounded-lg text-2xs font-bold transition-all"
                          >
                            Mark Reviewed
                          </button>
                        )}

                        {(app.status === 'pending' || app.status === 'reviewed') && (
                          <button
                            onClick={(e) => handleOpenStatusModal(e, app._id, 'shortlisted', app.employerNote)}
                            className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-655 dark:text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-2xs font-bold transition-all"
                          >
                            Shortlist
                          </button>
                        )}

                        {app.status === 'shortlisted' && (
                          <button
                            onClick={(e) => handleOpenStatusModal(e, app._id, 'hired', app.employerNote)}
                            className="py-1.5 px-3 bg-brand-500/10 hover:bg-brand-500 text-brand-655 dark:text-brand-400 hover:text-white border border-brand-500/20 rounded-lg text-2xs font-bold transition-all"
                          >
                            Mark Hired
                          </button>
                        )}

                        <button
                          onClick={(e) => handleOpenStatusModal(e, app._id, 'rejected', app.employerNote)}
                          className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500 text-rose-650 dark:text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-2xs font-bold transition-all ml-auto sm:ml-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Modification Modal with Recruiter Note Field */}
      {updatingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-slideUp">
            
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/20 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                Change Status to: {targetStatus}
              </h3>
              <button
                onClick={() => setUpdatingAppId(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusConfirm} className="p-6 flex flex-col gap-4">
              
              {statusError && (
                <span className="text-2xs text-rose-550 font-semibold">{statusError}</span>
              )}

              <div className="flex items-start gap-2.5 p-3.5 bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl">
                <Info className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  You are changing the candidate's status to <span className="font-extrabold text-slate-700 dark:text-white capitalize">"{targetStatus}"</span>. 
                  You can optionally record an internal feedback note or a short message below. Candidates can view this note on their dashboards.
                </p>
              </div>

              {/* Note Text Area */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Recruiter Feedback Note (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="e.g. Technical credentials were highly aligned. Scheduling a call next week."
                  value={employerNote}
                  onChange={(e) => setEmployerNote(e.target.value)}
                  maxLength={1000}
                  className="w-full p-3 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white resize-none"
                />
                <span className="text-[10px] text-slate-400 text-right">{employerNote.length}/1000</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-3">
                <button
                  type="button"
                  onClick={() => setUpdatingAppId(null)}
                  className="py-1.5 px-3.5 text-2xs font-semibold text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="py-1.5 px-4 text-2xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                >
                  {statusLoading ? 'Updating...' : 'Save & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
