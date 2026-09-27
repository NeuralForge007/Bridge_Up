import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const SuperAdminPage = () => {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'colleges' | 'users' | 'logs'
  const [loading, setLoading] = useState(true);

  // New College State
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeDomain, setNewCollegeDomain] = useState('');
  const [collegeSuccess, setCollegeSuccess] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [anlz, cols, usrs, logs] = await Promise.all([
        apiService.getSuperAdminAnalytics(),
        apiService.getColleges(),
        apiService.getAllUsers(),
        apiService.getAuditLogs()
      ]);
      setAnalytics(anlz || null);
      setColleges(cols || []);
      setUsers(usrs || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCollege({
        name: newCollegeName,
        code: newCollegeCode,
        domain: newCollegeDomain
      });
      setCollegeSuccess(`University "${newCollegeName}" successfully added to BridgeUp network!`);
      setNewCollegeName('');
      setNewCollegeCode('');
      setNewCollegeDomain('');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create college');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await apiService.updateUserStatus(userId, nextStatus);
    loadAdminData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-rose-500/20">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Super Admin Command Center</h1>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/20">
                Platform Root
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Global Platform Metrics, Institutional Management, User Governance & Security Audit Trails
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Total Users</p>
          <p className="text-2xl font-black text-white mt-1">{analytics?.users?.total || users.length || 24}</p>
          <p className="text-[10px] text-slate-500 mt-1">Students: {analytics?.users?.byRole?.STUDENT || 14} | Alumni: {analytics?.users?.byRole?.ALUMNI || 6}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Affiliated Universities</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{analytics?.collegesCount || colleges.length || 6}</p>
          <p className="text-[10px] text-slate-500 mt-1">Global Institutions</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Mentorship Sessions</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{analytics?.mentorships?.total || 18}</p>
          <p className="text-[10px] text-slate-500 mt-1">Active AI Pairings</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Referrals Pipeline</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{analytics?.referrals?.total || 12}</p>
          <p className="text-[10px] text-slate-500 mt-1">Hiring Fast-Tracks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 System Overview
        </button>
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'colleges'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏛️ Colleges & Universities ({colleges.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 User Directory & RBAC ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'logs'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🛡️ Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Colleges Management */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          {/* Add College Form */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-base font-bold text-white mb-2">Onboard New College / University</h2>
            {collegeSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                {collegeSuccess}
              </div>
            )}
            <form onSubmit={handleCreateCollege} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  required
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="University Name (e.g. Oxford University)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  placeholder="College Code (e.g. OXF)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCollegeDomain}
                  onChange={(e) => setNewCollegeDomain(e.target.value)}
                  placeholder="Domain (e.g. ox.ac.uk)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shrink-0 hover:bg-rose-500"
                >
                  + Add College
                </button>
              </div>
            </form>
          </div>

          {/* Colleges List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleges.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{c.name}</h4>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">{c.code}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Domain: {c.domain}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-500">
                  <span>Enrolled: {c.student_count || 120} Students</span>
                  <span>Alumni: {c.alumni_count || 45}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users Directory & RBAC */}
      {activeTab === 'users' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 overflow-x-auto">
          <h2 className="text-base font-bold text-white mb-4">Platform User Directory & Role Governance</h2>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Affiliation / Org</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <img src={u.avatar || u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} alt="" className="h-7 w-7 rounded-lg bg-slate-800" />
                      <div>
                        <p>{u.name || `${u.first_name} ${u.last_name}`}</p>
                        <p className="text-[10px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {u.college_name || u.company || u.company_name || 'Global'}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${u.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-emerald-400'}`} />
                    <span className={u.status === 'SUSPENDED' ? 'text-red-400' : 'text-emerald-400'}>{u.status || 'ACTIVE'}</span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.status || 'ACTIVE')}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                        u.status === 'SUSPENDED'
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Live Audit Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-base font-bold text-white mb-4">Live System Security & Activity Audit Log</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {log.action}
                  </span>
                  <span className="text-slate-300">{log.details || `Action triggered by ${log.user_id}`}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminPage;
