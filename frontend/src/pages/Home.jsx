import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { 
  Cpu, 
  Search, 
  FileCheck, 
  ArrowRight, 
  Award, 
  Sparkles, 
  Zap, 
  CheckCircle 
} from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center gap-6 max-w-4xl mx-auto pt-8">
        {/* Top Feature Tagline */}
        <div className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Recruitment
        </div>

        {/* Catchy Premium Typography */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
          Where Elite Talents Meet{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-650 dark:from-brand-400 dark:to-indigo-400">
            Intelligent Screening
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-light font-sans">
          HireFlow bridges candidate resumes and active job posts with an automated, high-precision AI screening layer. Review applicants, view match scores, and hire 70% faster.
        </p>

        {/* Action Call-to-actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full justify-center">
          <Link
            to="/jobs"
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 py-3.5 px-7 rounded-xl shadow-lg shadow-brand-500/25 hover:scale-[1.03] active:scale-95 transition-all duration-200 w-full sm:w-auto text-center justify-center"
          >
            Explore Active Jobs <ArrowRight className="w-4 h-4" />
          </Link>

          {!user && (
            <Link
              to="/register"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-500/5 py-3.5 px-7 rounded-xl w-full sm:w-auto text-center justify-center transition-all duration-200"
            >
              Sign Up For Free
            </Link>
          )}

          {user?.role === 'employer' && (
            <Link
              to="/employer/post-job"
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 py-3.5 px-7 rounded-xl w-full sm:w-auto text-center justify-center transition-all duration-200"
            >
              Post a New Job
            </Link>
          )}

          {user?.role === 'applicant' && (
            <Link
              to="/my-applications"
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 py-3.5 px-7 rounded-xl w-full sm:w-auto text-center justify-center transition-all duration-200"
            >
              Track Applications
            </Link>
          )}
        </div>
      </section>

      {/* Numerical Metrics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        {[
          { number: '98%', label: 'AI Review Accuracy', desc: 'Validated by recruiters' },
          { number: '< 60s', label: 'Screening Feedback', desc: 'Instant matches calculation' },
          { number: '70%', label: 'Hiring Time Saved', desc: 'Eliminates manual reviews' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel hover-card p-6 rounded-2xl text-center flex flex-col gap-1 border">
            <span className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400">
              {stat.number}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {stat.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {stat.desc}
            </span>
          </div>
        ))}
      </section>

      {/* Visual core features display */}
      <section className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Unrivalled Screening Pipeline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Discover how HireFlow empowers candidate journeys and makes recruitment effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl border flex flex-col gap-4 hover-card group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/20 group-hover:scale-110 transition-transform duration-300">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
              Dynamic Job Feeds
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Explore job openings. Apply filtering parameters, skills parameters, salary levels, and complete applications in seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl border flex flex-col gap-4 hover-card group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
              High-Precision AI Match
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Our advanced algorithm parses PDF resumes instantly, mapping qualifications directly against required skills.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl border flex flex-col gap-4 hover-card group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
              Auto-Shortlisting
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              Candidates scoring 75% or higher are automatically shortlisted and immediate emails are dispatched to the applicant.
            </p>
          </div>
        </div>
      </section>

      {/* Recruiter / Candidate Flows */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center border">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
            For Employers
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Moderate candidates in one visual workspace
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            Rank applicants by AI score. View detailed candidate profile summaries, strengths list, gaps list, and generate customized interview questions at the click of a button.
          </p>
          
          <ul className="flex flex-col gap-2 mt-2">
            {[
              'Compare multiple candidate resumes simultaneously',
              'Auto-shortlist high scores instantly',
              'AI interview questions tailored to profile gaps',
              'Update applicant status easily with notifications'
            ].map((text, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-brand-600 to-indigo-700 p-8 text-white flex flex-col gap-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <span className="text-xs font-medium bg-white/20 py-1 px-2.5 rounded-full">Candidate Screening</span>
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-bold">Senior React Developer</h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-tight text-glow">89%</span>
              <span className="text-xs py-0.5 px-2 rounded bg-emerald-550/40 text-emerald-300 font-semibold border border-emerald-450/30">Auto Shortlisted</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <p className="font-semibold text-brand-200">Strengths:</p>
              <p className="text-brand-100 font-light">Proficient in React, Node, Zod, and Docker. Strong background in microservices.</p>
            </div>
            <div>
              <p className="font-semibold text-brand-200">Gaps:</p>
              <p className="text-brand-100 font-light">Lacks PostgreSQL or AWS deploy experiences.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
