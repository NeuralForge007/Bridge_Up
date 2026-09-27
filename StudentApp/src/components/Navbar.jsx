import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const Navbar = ({ onOpenAuth, activePage, setActivePage }) => {
  const { currentUser, logout, theme, toggleTheme, quickLogin, demoUsers } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);

  // Fetch notifications
  const loadNotifications = async () => {
    if (currentUser) {
      const notifs = await apiService.getNotifications();
      if (notifs) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleSwitcher(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    await apiService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead();
    loadNotifications();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ALUMNI':
        return { text: 'Alumni / Mentor', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'RECRUITER':
        return { text: 'Recruiter', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'COLLEGE_ADMIN':
        return { text: 'College Admin', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'SUPER_ADMIN':
        return { text: 'Super Admin', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { text: 'Student', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Platform Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => currentUser ? setActivePage(currentUser.role === 'ALUMNI' ? 'alumni-dashboard' : currentUser.role === 'RECRUITER' ? 'recruiter' : currentUser.role === 'COLLEGE_ADMIN' ? 'college-admin' : currentUser.role === 'SUPER_ADMIN' ? 'super-admin' : 'dashboard') : setActivePage('home')}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-blue-500/25">
            <svg width="24" height="24" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Bridge<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Up</span></span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">v2.0</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-medium">Alumni Network & AI Mentorship Platform</p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          
          {/* Role Switcher Button */}
          {currentUser && (
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`hidden md:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-slate-800/80 ${badge.bg}`}
              >
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                <span>{badge.text}</span>
                <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    ⚡ Switch Role (Demo)
                  </div>
                  <div className="space-y-1">
                    {demoUsers.slice(0, 6).map((user) => (
                      <button
                        key={user.id || user.user_id}
                        onClick={() => {
                          quickLogin(user);
                          setShowRoleSwitcher(false);
                          if (user.role === 'ALUMNI') setActivePage('alumni-dashboard');
                          else if (user.role === 'RECRUITER') setActivePage('recruiter');
                          else if (user.role === 'COLLEGE_ADMIN') setActivePage('college-admin');
                          else if (user.role === 'SUPER_ADMIN') setActivePage('super-admin');
                          else setActivePage('dashboard');
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                          currentUser?.email === user.email ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-slate-300'
                        }`}
                      >
                        <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Next'} alt="" className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400">{user.role} {user.company ? `• ${user.company}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Notifications Dropdown */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-lg shadow-blue-500/50">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`cursor-pointer rounded-xl p-3 text-xs transition-colors ${
                            notif.is_read ? 'bg-slate-800/30 text-slate-400' : 'bg-blue-950/40 text-slate-200 border border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className={notif.is_read ? 'text-slate-300' : 'text-blue-400 font-bold'}>{notif.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-400 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile & Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 pr-3 transition-colors hover:bg-slate-800"
                >
                  <img
                    src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-800"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{currentUser.email}</p>
                  </div>
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                        {currentUser.role}
                      </span>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => { setActivePage('profile'); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile & Avatars
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          setActivePage('home');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Instant Sign Out Button in Navbar */}
              <button
                onClick={() => {
                  logout();
                  setActivePage('home');
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/50 hover:text-red-200 hover:border-red-500/60 transition-all shadow-sm"
                title="Sign out of your account"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110"
            >
              <span>Get Started / Sign In</span>
            </button>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
