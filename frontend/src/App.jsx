import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import axiosInstance from './api/axiosInstance.js';

// Common Layouts & Components
import Navbar from './components/layout/Navbar.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import JobList from './pages/JobList.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Profile from './pages/profile/Profile.jsx';

// Applicant pages
import MyApplications from './pages/applicant/MyApplications.jsx';

// Employer pages
import EmployerDashboard from './pages/employer/Dashboard.jsx';
import Applicants from './pages/employer/Applicants.jsx';
import PostJob from './pages/employer/PostJob.jsx';
import EditJob from './pages/employer/EditJob.jsx';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminJobs from './pages/admin/Jobs.jsx';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, accessToken } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const { login, logout, user } = useAuthStore();
  const { initTheme } = useThemeStore();
  const [checkingSession, setCheckingSession] = useState(true);

  // Initialize theme and silent token refresh on application load
  useEffect(() => {
    initTheme();
    
    const checkActiveSession = async () => {
      try {
        const res = await axiosInstance.post('/auth/refresh');
        const { accessToken, user: userData } = res.data.data;
        login(userData, accessToken);
      } catch (err) {
        // No active session found; silent failure is correct (defaults to logged out)
        logout();
      } finally {
        setCheckingSession(false);
      }
    };

    checkActiveSession();
  }, [initTheme, login, logout]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-darkbg-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Animated custom loader */}
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm">
            Initializing HireFlow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg-200 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Decorative animated mesh background */}
      <div className="mesh-bg"></div>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          {/* Shared Authenticated Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Applicant Routes */}
          <Route 
            path="/my-applications" 
            element={
              <ProtectedRoute allowedRoles={['applicant']}>
                <MyApplications />
              </ProtectedRoute>
            } 
          />

          {/* Employer Routes */}
          <Route 
            path="/employer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employer/jobs/:jobId/applicants" 
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Applicants />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employer/post-job" 
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employer/jobs/:id/edit" 
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EditJob />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/jobs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminJobs />
              </ProtectedRoute>
            } 
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global premium footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/30 py-6 mt-12 bg-white/20 dark:bg-darkbg-100/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} HireFlow Platform. Built using Google Deepmind Advanced MERN guidelines.</p>
        </div>
      </footer>
    </div>
  );
}
