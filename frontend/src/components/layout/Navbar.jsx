import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Briefcase, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  PlusCircle, 
  ShieldAlert, 
  ListCollapse 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      // Ignored since we are forcing local state wipe regardless
    }
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    text-sm font-medium transition-colors duration-200 py-1.5 px-3 rounded-lg
    ${isActive(path) 
      ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10' 
      : 'text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:bg-slate-500/5'}
  `;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/30 bg-white/60 dark:bg-darkbg-100/40 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 font-sans">
              HireFlow
            </span>
          </Link>

          {/* Desktop Navigation Link Blocks */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link to="/jobs" className={linkClass('/jobs')}>
              Browse Jobs
            </Link>

            {user?.role === 'applicant' && (
              <Link to="/my-applications" className={linkClass('/my-applications')}>
                My Applications
              </Link>
            )}

            {user?.role === 'employer' && (
              <>
                <Link to="/employer/dashboard" className={linkClass('/employer/dashboard')}>
                  Employer Board
                </Link>
                <Link to="/employer/post-job" className={linkClass('/employer/post-job')}>
                  Post a Job
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                  Admin Stats
                </Link>
                <Link to="/admin/users" className={linkClass('/admin/users')}>
                  Manage Users
                </Link>
                <Link to="/admin/jobs" className={linkClass('/admin/jobs')}>
                  Manage Jobs
                </Link>
              </>
            )}
          </div>

          {/* Desktop Actions Dropdowns / Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-500/10 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors duration-200 py-1.5 px-3 rounded-xl hover:bg-slate-550/5"
                >
                  {user.avatar?.url ? (
                    <img 
                      src={user.avatar.url} 
                      alt={user.name} 
                      className="w-7 h-7 rounded-full object-cover border border-brand-500/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors duration-200 py-2 px-4 rounded-xl hover:bg-slate-500/5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 py-2 px-4 rounded-xl shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  Join Board
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Action Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-500/10 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-500/10 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu Links */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/30 bg-white/95 dark:bg-darkbg-100/95 backdrop-blur-xl animate-fade-in py-4 px-4 flex flex-col gap-2">
          <Link 
            to="/jobs" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
          >
            <Briefcase className="w-4 h-4" /> Browse Jobs
          </Link>

          {user?.role === 'applicant' && (
            <Link 
              to="/my-applications" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
            >
              <LayoutDashboard className="w-4 h-4" /> My Applications
            </Link>
          )}

          {user?.role === 'employer' && (
            <>
              <Link 
                to="/employer/dashboard" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                <LayoutDashboard className="w-4 h-4" /> Employer Board
              </Link>
              <Link 
                to="/employer/post-job" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                <PlusCircle className="w-4 h-4" /> Post a Job
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link 
                to="/admin/dashboard" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                <ShieldAlert className="w-4 h-4" /> Admin Stats
              </Link>
              <Link 
                to="/admin/users" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                <UserIcon className="w-4 h-4" /> Manage Users
              </Link>
              <Link 
                to="/admin/jobs" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                <Briefcase className="w-4 h-4" /> Manage Jobs
              </Link>
            </>
          )}

          {user ? (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 flex flex-col gap-2">
              <Link 
                to="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt="Profile" className="w-6 h-6 rounded-full object-cover"/>
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
                Profile ({user.name})
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-rose-500 hover:bg-rose-500/10 w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center py-2 rounded-lg text-white bg-brand-600 hover:bg-brand-700"
              >
                Join Board
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
