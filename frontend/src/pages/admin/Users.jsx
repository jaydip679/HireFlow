import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { 
  ArrowLeft, Search, Filter, ShieldAlert, AlertCircle, Users, 
  Trash2, ShieldCheck, UserMinus, UserCheck, Calendar, Lock, Unlock
} from 'lucide-react';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Suspension modal states
  const [suspensionUser, setSuspensionUser] = useState(null);
  const [suspensionLoading, setSuspensionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve platform users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspension = async () => {
    if (!suspensionUser) return;
    setSuspensionLoading(true);
    try {
      const res = await axiosInstance.patch(`/admin/users/${suspensionUser._id}/suspend`);
      const updatedUser = res.data.data;
      
      // Update local users table state
      setUsers(users.map(u => u._id === updatedUser._id ? { ...u, isSuspended: updatedUser.isSuspended } : u));
      setSuspensionUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle account restriction.');
    } finally {
      setSuspensionLoading(false);
    }
  };

  // Filter & Search computation
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading user directory...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 relative z-10">
      
      {/* Return link */}
      <div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-655 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Panel
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/20 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-3xs bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded font-bold uppercase w-max">
            Admin Directory Controls
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <Users className="w-8 h-8 text-brand-500" />
            Platform Accounts Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View all registered candidates and recruiters, search emails, and toggle suspensions.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 transition-colors text-xs text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="w-full sm:w-48 relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/50 dark:bg-darkbg-100/30 border border-slate-200 dark:border-slate-800/80 rounded-xl outline-none focus:border-brand-500 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">All Account Roles</option>
            <option value="applicant">Candidate Only</option>
            <option value="employer">Recruiter Only</option>
            <option value="admin">Administrator Only</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="glass-panel p-8 rounded-3xl border text-center flex flex-col items-center gap-3 max-w-lg mx-auto py-16">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-slate-655 dark:text-slate-350 font-medium">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 py-2 px-4 bg-brand-500 hover:bg-brand-655 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border text-center flex flex-col items-center gap-4 py-16 max-w-md mx-auto">
          <Users className="w-10 h-10 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Users Found</h3>
          <p className="text-xs text-slate-505 dark:text-slate-400">
            No platform accounts matched your criteria. Try loosening search terms.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/40 dark:bg-darkbg-100/25 border-b border-slate-200/50 dark:border-slate-800/20 text-slate-450 uppercase font-extrabold tracking-wider">
                  <th className="py-4 px-6">User / Account Info</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Joined On</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Restrictions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/10 font-medium">
                {filteredUsers.map((u) => (
                  <tr 
                    key={u._id}
                    className="hover:bg-slate-50/20 dark:hover:bg-darkbg-100/5 transition-colors"
                  >
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center font-bold text-brand-600 dark:text-brand-400">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-slate-655 dark:text-slate-350 font-normal">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        u.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30' :
                        u.role === 'employer' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/30' :
                        'bg-slate-100 dark:bg-slate-900/30 text-slate-650 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-450">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Status indicator */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase border ${
                        u.isSuspended 
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-250/50 dark:border-rose-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250/50 dark:border-emerald-900/30'
                      }`}>
                        {u.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>

                    {/* Restrictions action */}
                    <td className="py-4 px-6 text-right">
                      {u.role === 'admin' ? (
                        <span className="text-[10px] text-slate-400 italic">Immunized</span>
                      ) : (
                        <button
                          onClick={() => setSuspensionUser(u)}
                          className={`inline-flex items-center gap-1 py-1 px-3 border rounded-xl text-2xs font-bold transition-all select-none active:scale-95 ${
                            u.isSuspended 
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10'
                              : 'border-rose-500/30 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10'
                          }`}
                        >
                          {u.isSuspended ? (
                            <>
                              <Unlock className="w-3 h-3" /> Unsuspend
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> Suspend
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restriction Toggle Modal */}
      {suspensionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-slideUp">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${suspensionUser.isSuspended ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-650'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {suspensionUser.isSuspended ? 'Restore Account?' : 'Suspend Account?'}
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-455 leading-relaxed">
                  {suspensionUser.isSuspended 
                    ? `Are you sure you want to restore access for ${suspensionUser.name}? They will immediately be allowed to log back in.` 
                    : `Are you sure you want to suspend ${suspensionUser.name}? Their active sessions will be terminated and they will be blocked from logging in.`
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/20 pt-3">
              <button
                onClick={() => setSuspensionUser(null)}
                className="py-1.5 px-3.5 text-2xs font-semibold text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleSuspension}
                disabled={suspensionLoading}
                className={`py-1.5 px-4 text-2xs font-bold text-white rounded-lg active:scale-95 disabled:opacity-50 transition-all ${
                  suspensionUser.isSuspended 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {suspensionLoading ? 'Processing...' : suspensionUser.isSuspended ? 'Restore Access' : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
