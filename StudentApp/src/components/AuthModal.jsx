import React, { useState } from 'react';
import { useAuth, AVATAR_PRESETS } from '../context/AuthContext';

const AuthModal = ({ isOpen, onClose, defaultTab = 'login', initialRole = 'STUDENT' }) => {
  const { login, signup, quickLogin, demoUsers } = useAuth();
  const [tab, setTab] = useState(defaultTab); // 'login' | 'signup' | 'demo'
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Signup state
  const [role, setRole] = useState(initialRole);

  // Sync state with incoming props when opening
  React.useEffect(() => {
    if (isOpen) {
      if (defaultTab) setTab(defaultTab);
      if (initialRole) setRole(initialRole);
      setError('');
    }
  }, [isOpen, defaultTab, initialRole]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [collegeName, setCollegeName] = useState('Institute of Engineering and Management');
  const [major, setMajor] = useState('Computer Science');
  const [year, setYear] = useState('Junior (Year 3)');
  const [gpa, setGpa] = useState('8.85');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [skills, setSkills] = useState('React, Python, Machine Learning, Tailwind CSS');
  const [headline, setHeadline] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'STUDENT') {
      const gpaNum = parseFloat(gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
        setError('Please enter a valid CGPA between 0.0 and 10.0');
        setLoading(false);
        return;
      }
    }

    try {
      await signup({
        role,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: signupEmail,
        password: signupPassword,
        collegeName,
        major,
        year,
        gpa,
        company,
        roleTitle,
        skills,
        headline,
        avatar: selectedAvatar
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (user) => {
    quickLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/25 mb-3">
            <svg width="24" height="24" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white">Welcome to NEXT<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">STEP</span></h2>
          <p className="text-xs text-slate-400 mt-1">Centralized Alumni Network, AI Mentorship & Career Platform</p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
          <button
            onClick={() => { setTab('demo'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'demo' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow' : 'text-purple-400 hover:text-white'
            }`}
          >
            ⚡ 1-Click Demo
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ──────────────── 1-Click Demo Tab ──────────────── */}
        {tab === 'demo' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center mb-4">
              Select any pre-configured role profile to explore full system capabilities instantly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {demoUsers.map((u) => {
                const getRoleColor = (r) => {
                  if (r === 'ALUMNI') return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
                  if (r === 'RECRUITER') return 'border-purple-500/30 bg-purple-500/5 text-purple-400';
                  if (r === 'COLLEGE_ADMIN') return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
                  if (r === 'SUPER_ADMIN') return 'border-rose-500/30 bg-rose-500/5 text-rose-400';
                  return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
                };

                return (
                  <button
                    key={u.id || u.user_id}
                    onClick={() => handleDemoSelect(u)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-left transition-all hover:scale-[1.02] hover:border-blue-500/50 hover:bg-slate-800/80"
                  >
                    <img
                      src={u.avatar || AVATAR_PRESETS[0]}
                      alt={u.name}
                      className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{u.name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {u.company || u.college_name || u.major || 'Verified User'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────── Sign In Tab ──────────────── */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. alex.rivera@stanford.edu"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to BridgeUp'}
            </button>
          </form>
        )}

        {/* ──────────────── Register Account Tab ──────────────── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">I am registering as:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STUDENT', label: '🎓 Student' },
                  { id: 'ALUMNI', label: '💼 Alumni / Mentor' },
                  { id: 'RECRUITER', label: '🎯 Recruiter' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      role === r.id
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Selector (16 Cartoon Avatars) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Choose Professional Cartoon Avatar</label>
                <span className="text-[10px] text-slate-500">16 styles available</span>
              </div>
              <div className="grid grid-cols-8 gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-2.5">
                {AVATAR_PRESETS.map((avatarUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`relative rounded-xl p-1 transition-all hover:scale-105 ${
                      selectedAvatar === avatarUrl ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-slate-900'
                    }`}
                  >
                    <img src={avatarUrl} alt={`Avatar ${idx + 1}`} className="h-8 w-8 rounded-lg" />
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rivera"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="alex@iem.edu.in"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Student Specific Fields */}
            {role === 'STUDENT' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">College / University</label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Institute of Engineering and Management"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option>Freshman (Year 1)</option>
                      <option>Sophomore (Year 2)</option>
                      <option>Junior (Year 3)</option>
                      <option>Senior (Year 4)</option>
                      <option>Master's / Ph.D.</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Major / Branch</label>
                    <input
                      type="text"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="Computer Science"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current CGPA (out of 10.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="8.85"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Alumni Specific Fields */}
            {role === 'ALUMNI' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Microsoft"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Staff Software Engineer"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Recruiter Specific Fields */}
            {role === 'RECRUITER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hiring Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Meta, Amazon, Stripe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Skills & Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Key Skills (Comma separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Python, Machine Learning, Tailwind"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
