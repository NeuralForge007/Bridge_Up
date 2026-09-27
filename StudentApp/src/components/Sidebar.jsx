import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activePage, setActivePage, onOpenAuth }) => {
  const { currentUser, logout, demoUsers, quickLogin } = useAuth();
  const role = currentUser?.role;

  const handleNavClick = (itemId, isProtected) => {
    if (isProtected && !currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setActivePage(itemId);
  };

  const handleSignOut = () => {
    logout();
    setActivePage('home');
  };

  const getNavItems = () => {
    if (!currentUser) {
      return [
        { id: 'home', label: 'Home Overview', icon: '🏠', isProtected: false },
        { id: 'mentor-finder', label: 'AI Mentor Matcher', icon: '🤖', badge: 'AI Pro', isProtected: true },
        { id: 'alumni-mentors', label: 'Alumni Directory', icon: '🎓', isProtected: true },
        { id: 'jobs', label: 'Jobs & Internships', icon: '💼', isProtected: true },
        { id: 'hackathons', label: 'Hackathons & Teams', icon: '🏆', badge: 'Hot', isProtected: true },
        { id: 'referrals', label: 'My Referrals', icon: '🚀', isProtected: true },
        { id: 'events', label: 'Campus Events', icon: '📅', isProtected: true },
        { id: 'profile', label: 'User Profile', icon: '👤', isProtected: true }
      ];
    }

    switch (role) {
      case 'ALUMNI':
        return [
          { id: 'alumni-dashboard', label: 'Mentorship Inbox', icon: '📥', badge: 'Active', isProtected: false },
          { id: 'mentor-finder', label: 'Mentor Directory', icon: '👥', isProtected: false },
          { id: 'referrals', label: 'Referrals Pipeline', icon: '🚀', badge: 'New', isProtected: false },
          { id: 'jobs', label: 'Jobs & Openings', icon: '💼', isProtected: false },
          { id: 'events', label: 'Campus Webinars', icon: '📅', isProtected: false },
          { id: 'profile', label: 'My Alumni Profile', icon: '👤', isProtected: false }
        ];

      case 'RECRUITER':
        return [
          { id: 'recruiter', label: 'Candidate Discovery', icon: '🎯', badge: 'Verified', isProtected: false },
          { id: 'referrals', label: 'Referred Candidates', icon: '🤝', isProtected: false },
          { id: 'jobs', label: 'Manage Job Postings', icon: '💼', isProtected: false },
          { id: 'events', label: 'Campus Hiring Events', icon: '🎪', isProtected: false },
          { id: 'profile', label: 'Company Profile', icon: '🏢', isProtected: false }
        ];

      case 'COLLEGE_ADMIN':
        return [
          { id: 'college-admin', label: 'College Dashboard', icon: '🏛️', isProtected: false },
          { id: 'events', label: 'Host Events', icon: '📅', isProtected: false },
          { id: 'jobs', label: 'Placement Drives', icon: '💼', isProtected: false },
          { id: 'profile', label: 'Admin Settings', icon: '⚙️', isProtected: false }
        ];

      case 'SUPER_ADMIN':
        return [
          { id: 'super-admin', label: 'Super Admin HQ', icon: '🛡️', badge: 'Full Access', isProtected: false },
          { id: 'college-admin', label: 'Colleges Oversight', icon: '🏛️', isProtected: false },
          { id: 'recruiter', label: 'Recruiter Hub', icon: '💼', isProtected: false },
          { id: 'events', label: 'All Platform Events', icon: '📅', isProtected: false },
          { id: 'profile', label: 'Security & Profile', icon: '🔐', isProtected: false }
        ];

      case 'STUDENT':
      default:
        return [
          { id: 'dashboard', label: 'Student Hub', icon: '⚡', isProtected: false },
          { id: 'mentor-finder', label: 'AI Mentor Matcher', icon: '🤖', badge: 'AI Pro', isProtected: false },
          { id: 'alumni-mentors', label: 'Alumni Directory', icon: '🎓', isProtected: false },
          { id: 'jobs', label: 'Jobs & Internships', icon: '💼', isProtected: false },
          { id: 'hackathons', label: 'Hackathons & Teams', icon: '🏆', badge: 'Hot', isProtected: false },
          { id: 'referrals', label: 'My Referrals', icon: '🚀', isProtected: false },
          { id: 'events', label: 'Campus Events', icon: '📅', isProtected: false },
          { id: 'groups', label: 'Study Groups', icon: '📚', isProtected: false },
          { id: 'peers', label: 'Peer Network', icon: '👥', isProtected: false },
          { id: 'assignments', label: 'Tasks & GPA', icon: '📝', isProtected: false },
          { id: 'profile', label: 'Student Profile', icon: '👤', isProtected: false }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/40 p-4 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        
        {/* User Card Summary or Guest Welcome */}
        {currentUser ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                alt=""
                className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800"
              />
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser.role === 'STUDENT' ? (currentUser.major || currentUser.college_name || 'Student') :
                   currentUser.role === 'ALUMNI' ? (currentUser.company || 'Alumni Mentor') :
                   currentUser.role === 'RECRUITER' ? (currentUser.company_name || 'Recruiter') :
                   currentUser.role === 'COLLEGE_ADMIN' ? (currentUser.college_name || 'College Admin') : 'Super Admin'}
                </p>
              </div>
            </div>

            {/* Verification Status Pill */}
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
              <span className="text-slate-400">Status:</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {currentUser.verification_status || 'VERIFIED'}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-3.5 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
              <span>👋 Welcome Guest</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Explore our platform overview or sign in to unlock all portals.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110 transition-all"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</p>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const isLocked = item.isProtected && !currentUser;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.isProtected)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                    : isLocked
                    ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                
                {isLocked ? (
                  <span className="text-slate-500 text-[11px]" title="Login required to access">
                    🔒
                  </span>
                ) : item.badge ? (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer: Sign Out (for logged in) or Quick Demo (for guests) */}
      <div className="pt-4 mt-auto">
        {currentUser ? (
          <div className="space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 py-2.5 px-3 text-xs font-bold text-red-400 transition-all hover:bg-red-900/40 hover:text-red-300 hover:border-red-500/40 shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-2 text-center">
              <p className="text-[10px] font-medium text-slate-400">BridgeUp Platform</p>
              <p className="text-[9px] text-slate-500">Online & Verified</p>
            </div>
          </div>
        ) : demoUsers && demoUsers.length > 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Quick 1-Click Demo
            </p>
            <div className="space-y-1.5">
              {demoUsers.slice(0, 3).map((u) => (
                <button
                  key={u.id || u.user_id}
                  onClick={() => {
                    quickLogin(u);
                    if (u.role === 'ALUMNI') setActivePage('alumni-dashboard');
                    else if (u.role === 'RECRUITER') setActivePage('recruiter');
                    else setActivePage('dashboard');
                  }}
                  className="w-full flex items-center gap-2 rounded-lg bg-slate-950/80 p-1.5 text-left text-[11px] text-slate-300 hover:border-blue-500/40 hover:bg-slate-800 transition-all border border-slate-800/80"
                >
                  <img src={u.avatar} alt="" className="h-5 w-5 rounded-full bg-slate-800" />
                  <span className="truncate flex-1 font-medium">{u.name}</span>
                  <span className="text-[9px] text-blue-400 font-bold">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
