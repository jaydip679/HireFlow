import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import axiosInstance from '../api/axiosInstance.js';
import { 
  ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, AlertCircle, 
  Upload, FileText, CheckCircle, Clock, Check, X, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Application checking
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [checkingAppStatus, setCheckingAppStatus] = useState(false);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);

  // Fetch job & verify application
  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/jobs/${id}`);
      setJob(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve job details.');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user || user.role !== 'applicant') return;
    setCheckingAppStatus(true);
    try {
      const res = await axiosInstance.get('/applications/my-applications');
      const apps = res.data.data;
      const existing = apps.find(app => app.job._id === id);
      if (existing) {
        setHasApplied(true);
        setMyApplication(existing);
      }
    } catch (err) {
      console.error('Error fetching application status:', err);
    } finally {
      setCheckingAppStatus(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    checkApplicationStatus();
  }, [id, user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setApplyError('Only PDF resume files are accepted.');
        setResumeFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setApplyError('Resume file size must be under 5MB.');
        setResumeFile(null);
        return;
      }
      setApplyError(null);
      setResumeFile(file);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError(null);
    setApplySuccess(null);

    // If no resume uploaded, candidate must have one pre-set
    if (!resumeFile && (!user.resume || !user.resume.url)) {
      setApplyError('Please upload a PDF resume.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('jobId', id);
    if (coverLetter) formData.append('coverLetter', coverLetter);
    if (resumeFile) formData.append('resume', resumeFile);

    try {
      const res = await axiosInstance.post('/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setApplySuccess('Application submitted! AI is analyzing your credentials...');
      
      setTimeout(() => {
        setShowApplyModal(false);
        setHasApplied(true);
        setMyApplication(res.data.data);
        navigate('/my-applications');
      }, 1500);

    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Extracting job specifications...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="glass-panel p-10 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Job</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error || 'This job posting may have been removed or closed by the employer.'}
        </p>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-2 py-2 px-5 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Job Board
        </button>
      </div>
    );
  }

  const isClosed = job.status === 'closed' || (job.deadline && new Date(job.deadline) < new Date());

  return (
    <div className="flex flex-col gap-6 py-4 relative z-10">
      {/* Return Navigation */}
      <div>
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Job Main Specifications */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col gap-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/20 pb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    job.jobType === 'full-time' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30' :
                    job.jobType === 'internship' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30' :
                    'bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30'
                  }`}>
                    {job.jobType}
                  </span>
                  {job.isRemote && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/30">
                      Remote
                    </span>
                  )}
                  {isClosed && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-200/50 dark:border-rose-900/30">
                      Closed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 leading-tight">
                  {job.title}
                </h1>
                <span className="text-sm font-semibold text-slate-650 dark:text-slate-350">
                  {job.employer?.name || 'Verified Employer'}
                </span>
              </div>
            </div>

            {/* Description section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Job Description
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Skills required */}
            <div className="flex flex-col gap-3 border-t border-slate-200/50 dark:border-slate-800/20 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Required Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired && job.skillsRequired.map((skill, index) => (
                  <span
                    key={index}
                    className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-darkbg-100/50 border border-slate-200/50 dark:border-slate-800/40 text-slate-700 dark:text-slate-350 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="glass-panel p-6 rounded-3xl border shadow-sm flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/20 pb-3">
              Job Summary
            </h3>

            {/* Metadata items */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-darkbg-100/30 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">LOCATION</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                    {job.isRemote ? 'Remote (Anywhere)' : job.location || 'On-site'}
                  </span>
                </div>
              </div>

              {job.salary && (job.salary.min || job.salary.max) && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-darkbg-100/30 text-slate-500 dark:text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">SALARY RANGE</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                      ${job.salary.min?.toLocaleString() || '0'} - ${job.salary.max?.toLocaleString() || 'N/A'} {job.salary.currency || 'USD'}
                    </span>
                  </div>
                </div>
              )}

              {job.deadline && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-darkbg-100/30 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">DEADLINE</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                      {new Date(job.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-darkbg-100/30 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">POSTED ON</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                    {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/20 pt-4 mt-1">
              {isClosed ? (
                <div className="w-full text-center py-3 bg-slate-100 dark:bg-slate-900/40 text-slate-550 dark:text-slate-400 text-xs font-semibold rounded-xl border border-slate-250 dark:border-slate-800/40">
                  No Longer Accepting Applications
                </div>
              ) : !user ? (
                <Link
                  to="/login"
                  className="flex items-center justify-center py-3 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl active:scale-95 transition-all text-center"
                >
                  Sign In to Apply
                </Link>
              ) : user.role === 'applicant' ? (
                checkingAppStatus ? (
                  <div className="w-full py-3 bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center gap-2 rounded-xl text-xs text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    Checking status...
                  </div>
                ) : hasApplied ? (
                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl border uppercase ${
                      myApplication?.status === 'shortlisted' ? 'status-badge-shortlisted' :
                      myApplication?.status === 'rejected' ? 'status-badge-rejected' :
                      myApplication?.status === 'reviewed' ? 'status-badge-reviewed' :
                      myApplication?.status === 'hired' ? 'status-badge-hired' :
                      'status-badge-pending'
                    }`}>
                      <Check className="w-4 h-4" /> Applied ({myApplication?.status})
                    </div>
                    <Link
                      to="/my-applications"
                      className="text-center text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Track Application Timeline
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    Apply Now <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )
              ) : (
                <div className="w-full text-center py-3 bg-slate-100 dark:bg-slate-900/40 text-slate-550 dark:text-slate-400 text-xs font-semibold rounded-xl border border-slate-250 dark:border-slate-800/40">
                  Logged in as {user.role}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-800/20">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Apply for {job.title}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Fill in details below. Resumes will be analyzed by AI.
                </span>
              </div>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setApplyError(null);
                  setApplySuccess(null);
                  setResumeFile(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-650 dark:hover:text-slate-250 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplySubmit} className="p-6 flex flex-col gap-5">
              
              {/* Feedback messages */}
              {applyError && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-455 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {applySuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{applySuccess}</span>
                </div>
              )}

              {/* Resume File Upload Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Resume Attachment (PDF only)
                </label>
                
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-6 text-center transition-all bg-white/30 dark:bg-darkbg-100/10">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-brand-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{resumeFile.name}</span>
                      <span className="text-[10px] text-slate-400">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document</span>
                      <span className="text-[10px] text-brand-650 dark:text-brand-400 font-medium">Click or drag new file to replace</span>
                    </div>
                  ) : user.resume && user.resume.url ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Using Profile Resume</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-400">You already have a pre-saved resume on your profile.</span>
                      <span className="text-[10px] text-brand-650 dark:text-brand-400 font-semibold border-t border-slate-200/50 dark:border-slate-800/20 pt-2 mt-1">
                        Click or drag a new PDF here to override
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload PDF Resume</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-400">Drag & drop your resume file or click to browse</span>
                      <span className="text-[10px] text-slate-400">Maximum file size: 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter Box */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="coverLetter" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Cover Letter (Optional)
                </label>
                <textarea
                  id="coverLetter"
                  rows={4}
                  placeholder="Explain what makes you an excellent match for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  maxLength={2000}
                  className="w-full p-3 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white resize-none"
                />
                <span className="text-3xs text-slate-400 dark:text-slate-500 text-right">
                  {coverLetter.length}/2000 characters
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/20">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="py-2.5 px-4 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 py-2.5 px-5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl active:scale-95 disabled:opacity-50 transition-all shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
