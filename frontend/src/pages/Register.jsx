import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import axiosInstance from '../api/axiosInstance.js';
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle, User, Briefcase } from 'lucide-react';

export default function Register() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('applicant'); // 'applicant' or 'employer'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Simple password strength check
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMinLength = password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Frontend validations
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!isMinLength || !hasUpperCase || !hasNumber) {
      setError('Password must meet all requirements (min 8 characters, 1 uppercase letter, 1 number).');
      setLoading(false);
      return;
    }

    try {
      // Register request
      await axiosInstance.post('/auth/register', {
        name,
        email,
        password,
        role
      });

      setSuccess('Account created successfully! Auto-authenticating...');

      // Auto login after registration
      const loginRes = await axiosInstance.post('/auth/login', { email, password });
      const { accessToken, user } = loginRes.data.data;

      setTimeout(() => {
        login(user, accessToken);
        if (user.role === 'employer') {
          navigate('/employer/dashboard');
        } else {
          navigate('/jobs');
        }
      }, 1200);

    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your credentials and try again.';
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border shadow-xl flex flex-col gap-6 relative">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Join HireFlow to find top jobs or streamline screening.
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role Selection Tabs */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                I want to register as an
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('applicant')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    role === 'applicant'
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'bg-white/40 dark:bg-darkbg-100/20 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    role === 'employer'
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'bg-white/40 dark:bg-darkbg-100/20 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Employer
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Full Name
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors duration-200 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Email Address
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors duration-200 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Password
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-sm bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors duration-200 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password complexity helper */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 p-2 bg-slate-100/50 dark:bg-slate-900/40 rounded-lg text-2xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={isMinLength ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400'}>
                      ✔ At least 8 characters
                    </span>
                    <span className={hasUpperCase ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400'}>
                      ✔ One uppercase letter
                    </span>
                    <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400'}>
                      ✔ One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Confirm Password
              </label>
              <div className="relative rounded-xl overflow-hidden shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-sm bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors duration-200 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 mt-2 w-full py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl shadow-md shadow-brand-500/10 active:scale-95 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Sign Up
                </>
              )}
            </button>
          </form>

          {/* Bottom redirection link */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-450 border-t border-slate-200/50 dark:border-slate-800/20 pt-4 mt-2">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
