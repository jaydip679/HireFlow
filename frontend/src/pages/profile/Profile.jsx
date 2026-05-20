import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  User, Mail, FileText, CheckCircle, AlertCircle, Camera, 
  Trash2, ShieldCheck, Key, Plus, X, Globe, Building
} from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  
  // Employer company state
  const [companyName, setCompanyName] = useState(user?.company?.name || '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.company?.website || '');

  // Files
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status/Error states
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);
  
  const [avatarError, setAvatarError] = useState(null);
  const [resumeSuccess, setResumeSuccess] = useState(null);
  const [resumeError, setResumeError] = useState(null);

  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Sync avatar state
  useEffect(() => {
    if (user?.avatar?.url) {
      setAvatarPreview(user.avatar.url);
    }
  }, [user]);

  // Skill Handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Avatar uploading
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG/JPG).');
      return;
    }

    setAvatarError(null);
    setAvatarLoading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axiosInstance.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedUser = res.data.data;
      setUser(updatedUser);
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload profile picture.');
      setAvatarPreview(user?.avatar?.url || '');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Resume uploading
  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please select a valid PDF file.');
      return;
    }

    setResumeError(null);
    setResumeSuccess(null);
    setResumeLoading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axiosInstance.post('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedUser = res.data.data;
      setUser(updatedUser);
      setResumeSuccess('Resume PDF uploaded and parsed successfully!');
    } catch (err) {
      setResumeError(err.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  // Profile Form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    const updateBody = {
      name,
      headline: user.role === 'applicant' ? headline : undefined,
      bio,
      skills: user.role === 'applicant' ? skills : undefined,
      company: user.role === 'employer' ? {
        name: companyName,
        website: companyWebsite
      } : undefined
    };

    try {
      const res = await axiosInstance.put('/users/profile', updateBody);
      setUser(res.data.data);
      setProfileSuccess('Profile details updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password update submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await axiosInstance.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess('Password changed successfully! All other sessions cleared.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-4 relative z-10">
      {/* Page Title */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-brand-200 bg-clip-text text-transparent">
          Manage Account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update your public profile, upload resumes, and customize security settings.
        </p>
      </div>

      {/* Profile Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Actions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl border shadow-sm text-center flex flex-col items-center gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 self-start border-b border-slate-200/50 dark:border-slate-800/20 pb-2 w-full text-left">
              Account Avatar
            </h3>
            
            {/* Avatar Circle Container */}
            <div className="relative group w-32 h-32 rounded-full overflow-hidden shadow-md border-2 border-brand-500/20">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt={user?.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-4xl font-black">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Image Uploader Overlay */}
              <label className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-3xs font-semibold">Change Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>

              {avatarLoading && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {avatarError && (
              <span className="text-3xs text-rose-500 font-medium">{avatarError}</span>
            )}

            {/* Quick stats / profile labels */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">{user?.name}</span>
              <span className="text-xs text-slate-450 font-medium">{user?.email}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 rounded-full mt-2 w-max self-center">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Candidate Resume Widget */}
          {user?.role === 'applicant' && (
            <div className="glass-panel p-6 rounded-3xl border shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/20 pb-2">
                Stored PDF Resume
              </h3>

              {resumeError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-450 text-2xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{resumeError}</span>
                </div>
              )}

              {resumeSuccess && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 text-2xs">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{resumeSuccess}</span>
                </div>
              )}

              {user?.resume?.url ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-7 h-7 text-brand-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-white">resume.pdf</span>
                        <a 
                          href={user.resume.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-100/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-250 dark:border-slate-800 text-xs text-slate-450">
                  No resume saved. Upload one below to use for one-click applications.
                </div>
              )}

              {/* Upload input button */}
              <label className="flex items-center justify-center gap-2 py-2 px-4 border border-brand-500/30 text-xs font-semibold rounded-xl text-brand-650 dark:text-brand-400 bg-brand-500/5 hover:bg-brand-500/10 cursor-pointer text-center select-none active:scale-95 transition-all">
                {resumeLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-550 dark:border-brand-450 border-t-transparent rounded-full animate-spin"></div>
                    Uploading PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Upload PDF Resume
                  </>
                )}
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleResumeChange} 
                  className="hidden" 
                />
              </label>
            </div>
          )}
        </div>

        {/* Right Columns: Main Fields & Security */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main Info Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/20 pb-3">
              Profile Details
            </h3>

            {profileError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-450 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full name */}
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
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Email Address (Account Username)
                  </label>
                  <div className="relative rounded-xl overflow-hidden shadow-sm bg-slate-100/50 dark:bg-slate-900/30">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-450 border border-slate-200 dark:border-slate-850 rounded-xl cursor-not-allowed select-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Applicant only fields: Headline */}
              {user?.role === 'applicant' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="headline" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Professional Headline
                  </label>
                  <input
                    id="headline"
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer | React Specialist"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Employer only fields: Company Details */}
              {user?.role === 'employer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="companyName" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Company Name
                    </label>
                    <div className="relative rounded-xl overflow-hidden shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        id="companyName"
                        type="text"
                        placeholder="e.g. HireFlow Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="companyWebsite" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Company Website URL
                    </label>
                    <div className="relative rounded-xl overflow-hidden shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <input
                        id="companyWebsite"
                        type="text"
                        placeholder="e.g. https://company.com"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bio section */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bio" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Professional Summary (Bio)
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell us about yourself, your goals, or your company mission..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full p-3.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white resize-none"
                />
                <span className="text-[10px] text-slate-400 text-right">{bio.length}/500 characters</span>
              </div>

              {/* Applicant only fields: Skills tags */}
              {user?.role === 'applicant' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Your Technical Skills
                  </label>
                  
                  {/* Skill Add Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. TypeScript, Express, GraphQL"
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

                  {/* Render Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50 dark:bg-darkbg-100/10 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/20">
                    {skills.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No skills listed yet. Add some above.</span>
                    ) : (
                      skills.map((skill, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 text-[11px] font-bold bg-brand-50/60 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/30 px-3 py-1 rounded-lg"
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
              )}

              {/* Submit Profile */}
              <button
                type="submit"
                disabled={profileLoading}
                className="w-max py-2.5 px-6 mt-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl active:scale-95 transition-all self-end flex items-center gap-1.5"
              >
                {profileLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </form>
          </div>

          {/* Security & Password Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/20 pb-3">
              Change Password
            </h3>

            {passwordError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-455 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Current password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currPass" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Current Password
                  </label>
                  <input
                    id="currPass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                  />
                </div>

                {/* New password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPass" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    New Password
                  </label>
                  <input
                    id="newPass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                  />
                </div>

                {/* Confirm new password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confPass" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Confirm New Password
                  </label>
                  <input
                    id="confPass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-max py-2.5 px-6 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-700 hover:to-indigo-750 rounded-xl active:scale-95 transition-all self-end flex items-center gap-1.5"
              >
                {passwordLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
