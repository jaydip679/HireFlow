import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  ArrowLeft, FileText, CheckCircle, AlertCircle, Plus, X, 
  MapPin, DollarSign, Calendar, Briefcase, Sparkles, ShieldAlert 
} from 'lucide-react';

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Job form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  
  // Salary state
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  // Skills tags
  const [skillsRequired, setSkillsRequired] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  
  const [deadline, setDeadline] = useState('');

  // Page / fetch states
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // Submit / loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch initial job specs
  useEffect(() => {
    const fetchJob = async () => {
      setFetching(true);
      setFetchError(null);
      try {
        const res = await axiosInstance.get(`/jobs/${id}`);
        const job = res.data.data;
        
        setTitle(job.title || '');
        setDescription(job.description || '');
        setJobType(job.jobType || 'full-time');
        setLocation(job.location || '');
        setIsRemote(job.isRemote || false);
        setSkillsRequired(job.skillsRequired || []);
        
        if (job.salary) {
          setSalaryMin(job.salary.min !== null && job.salary.min !== undefined ? job.salary.min : '');
          setSalaryMax(job.salary.max !== null && job.salary.max !== undefined ? job.salary.max : '');
          setCurrency(job.salary.currency || 'USD');
        }

        if (job.deadline) {
          // Convert ISO string to YYYY-MM-DD for date input type
          setDeadline(new Date(job.deadline).toISOString().split('T')[0]);
        }
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to retrieve job details for editing.');
      } finally {
        setFetching(false);
      }
    };

    fetchJob();
  }, [id]);

  // Skill tag triggers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (clean && !skillsRequired.includes(clean)) {
      setSkillsRequired([...skillsRequired, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsRequired(skillsRequired.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic frontend assertions
    if (title.length < 5) {
      setError('Job title must be at least 5 characters.');
      setLoading(false);
      return;
    }

    if (description.length < 50) {
      setError('Description must be at least 50 characters.');
      setLoading(false);
      return;
    }

    // Build payload matching UpdateJobSchema (partial CreateJobSchema)
    const payload = {
      title,
      description,
      jobType,
      isRemote,
      location: isRemote ? '' : location || null,
      skillsRequired,
      salary: (salaryMin || salaryMax) ? {
        min: salaryMin !== '' ? Number(salaryMin) : null,
        max: salaryMax !== '' ? Number(salaryMax) : null,
        currency
      } : null,
      deadline: deadline ? new Date(deadline).toISOString() : null
    };

    try {
      await axiosInstance.put(`/jobs/${id}`, payload);
      setSuccess('Job details updated successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/employer/dashboard');
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job posting.');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Retrieving job records...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="glass-panel p-10 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Retrieval Failed</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{fetchError}</p>
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
    <div className="flex flex-col gap-6 py-4 relative z-10 max-w-3xl mx-auto">
      
      {/* Return link */}
      <div>
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </button>
      </div>

      {/* Main post box */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1 border-b border-slate-200/50 dark:border-slate-800/20 pb-4">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" />
            Modify Job Posting
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Edit the job specifications, updating requirements triggers re-evaluation options for applicants.
          </p>
        </div>

        {/* Feedback panels */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-455 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Job Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="jobTitle" className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
              Job Title
            </label>
            <input
              id="jobTitle"
              type="text"
              required
              placeholder="e.g. Senior Backend Engineer (Node.js)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Job Type select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="jobType" className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
                Employment Type
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-2xs">
                <select
                  id="jobType"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Application Deadline */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deadline" className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
                Application Deadline (Optional)
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-2xs">
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Remote Checkbox */}
            <div className="flex flex-col gap-2 justify-center p-3 bg-white/30 dark:bg-darkbg-100/10 border border-slate-200/50 dark:border-slate-800/20 rounded-xl">
              <label className="text-[11px] font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1">
                Location setting
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-355">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 dark:bg-darkbg-100"
                />
                This is a Fully Remote position
              </label>
            </div>

            {/* On-site Location field */}
            <div className={`md:col-span-2 flex flex-col gap-1.5 transition-all duration-200 ${isRemote ? 'opacity-40 pointer-events-none' : ''}`}>
              <label htmlFor="location" className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
                Office / Job Location
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="location"
                  type="text"
                  disabled={isRemote}
                  required={!isRemote}
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white disabled:bg-slate-100/50 dark:disabled:bg-slate-900/30"
                />
              </div>
            </div>
          </div>

          {/* Salary range (annual USD) */}
          <div className="flex flex-col gap-2.5 border-t border-slate-200/50 dark:border-slate-800/20 pt-4">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
              Annual Salary Specification (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Min salary */}
              <div className="relative rounded-xl overflow-hidden shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  placeholder="Min (e.g. 80000)"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>

              {/* Max salary */}
              <div className="relative rounded-xl overflow-hidden shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  placeholder="Max (e.g. 120000)"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>

              {/* Currency selector */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 text-slate-850 dark:text-slate-200 font-medium shadow-2xs"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          {/* Technical Skills Required Tags */}
          <div className="flex flex-col gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-4">
            <label className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
              Required Technical Skills Tags (Max 20)
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kubernetes, React, Python, AWS"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
                className="flex-1 px-4 py-2 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
              />
              <button
                onClick={handleAddSkill}
                className="p-2.5 bg-brand-500 hover:bg-brand-655 text-white rounded-xl active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Skill tags block */}
            <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50 dark:bg-darkbg-100/10 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/20">
              {skillsRequired.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">No requirement tags set. Add some above.</span>
              ) : (
                skillsRequired.map((skill, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 text-[11px] font-bold bg-brand-50/60 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/30 px-3 py-1 rounded-lg animate-fadeIn"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Job description */}
          <div className="flex flex-col gap-1.5 border-t border-slate-200/50 dark:border-slate-800/20 pt-4">
            <label htmlFor="desc" className="text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
              Comprehensive Job Description (Min 50 characters)
            </label>
            <textarea
              id="desc"
              rows={8}
              required
              placeholder="Outline specific responsibilities, required skills, benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              className="w-full p-4 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white resize-none"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
              <span>Must outline skills explicitly to align with AI resume parser matching</span>
              <span>{description.length}/5000 characters</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl shadow-md active:scale-95 disabled:opacity-50 transition-all w-full"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Save Job Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
