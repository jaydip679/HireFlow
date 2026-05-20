import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  Users, FileText, CheckCircle, Clock, ShieldCheck, Sparkles, 
  AlertCircle, Briefcase, UserCheck, Settings, ArrowRight, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/admin/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gathering platform analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="glass-panel p-8 rounded-3xl border text-center flex flex-col items-center gap-3 max-w-lg mx-auto py-16">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analytics Unavailable</h3>
        <p className="text-sm text-slate-505 dark:text-slate-400">{error || 'An error occurred during platform sync.'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-655 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Handle analytics defaults
  const counts = analytics.counts || {};
  const averages = analytics.averages || {};

  return (
    <div className="flex flex-col gap-8 py-4 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200/50 dark:border-slate-800/20 pb-4">
        <span className="text-3xs bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase w-max">
          Root Administrator Panel
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Platform Security & Insights
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review system-wide statistics, audit active job vacancies, and manage user restrictions.
        </p>
      </div>

      {/* Analytics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Users */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Total Members</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{counts.users || 0}</span>
          </div>
        </div>

        {/* Total Candidates */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Candidates</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{counts.applicants || 0}</span>
          </div>
        </div>

        {/* Total Employers */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-450 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Employers</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{counts.employers || 0}</span>
          </div>
        </div>

        {/* Active job postings */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Active Openings</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{counts.activeJobs || 0}</span>
          </div>
        </div>

        {/* Total applications */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-purple-500/10 text-purple-650 dark:text-purple-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Applications</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{counts.applications || 0}</span>
          </div>
        </div>

        {/* Average AI match score */}
        <div className="glass-panel p-5 rounded-2xl border shadow-2xs flex items-center gap-4 hover-card">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-xl">
            <Sparkles className="w-6 h-6 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Avg Match Score</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {averages.aiScore !== undefined && averages.aiScore !== null ? `${averages.aiScore.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Moderation Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        {/* Manage User accounts */}
        <div className="glass-panel p-6 rounded-3xl border shadow-sm flex flex-col justify-between gap-5 hover-card">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-500/15 text-brand-600 dark:text-brand-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Account Moderation</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              Audit the entire registered database. Restrict or suspend accounts engaging in spam or credential spoofing. Suspensions wipe active access tokens immediately.
            </p>
          </div>
          
          <Link
            to="/admin/users"
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl active:scale-95 transition-all text-center w-full shadow-sm"
          >
            Moderate Accounts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Manage job listings */}
        <div className="glass-panel p-6 rounded-3xl border shadow-sm flex flex-col justify-between gap-5 hover-card">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/15 text-indigo-650 dark:text-indigo-400 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Vacancy Moderation</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              Examine live, closed, or soft-deleted job postings across the entire platform. Moderate or soft-delete abusive, scam, or incomplete listings immediately.
            </p>
          </div>
          
          <Link
            to="/admin/jobs"
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-755 rounded-xl active:scale-95 transition-all text-center w-full shadow-sm"
          >
            Moderate Vacancies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
