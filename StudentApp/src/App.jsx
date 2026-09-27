import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import { StudyTimerModal } from './components/StudyTimerModal';

import { HomePage } from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AIMentorFinderPage from './pages/AIMentorFinderPage';
import AlumniDashboardPage from './pages/AlumniDashboardPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import CollegeAdminPage from './pages/CollegeAdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import JobsPage from './pages/JobsPage';
import HackathonsPage from './pages/HackathonsPage';
import EventsPage from './pages/EventsPage';
import ReferralsPage from './pages/ReferralsPage';
import { AlumniMentorsPage } from './pages/AlumniMentorsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { StudyGroupsPage } from './pages/StudyGroupsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { MessagesPage } from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';

function MainLayout() {
  const { currentUser } = useAuth();
  
  const getDefaultPageForUser = (user) => {
    if (!user) return 'home';
    switch (user.role) {
      case 'ALUMNI': return 'alumni-dashboard';
      case 'RECRUITER': return 'recruiter';
      case 'COLLEGE_ADMIN': return 'college-admin';
      case 'SUPER_ADMIN': return 'super-admin';
      case 'STUDENT':
      default:
        return 'dashboard';
    }
  };

  // Default to 'home' for guests; default to role hub for logged in users
  const [activePage, setActivePage] = useState(() => {
    return getDefaultPageForUser(currentUser);
  });

  const [authConfig, setAuthConfig] = useState({ isOpen: false, defaultTab: 'login', initialRole: 'STUDENT' });
  const [showTimerModal, setShowTimerModal] = useState(false);

  const handleOpenAuth = (opts = {}) => {
    if (typeof opts === 'string') {
      setAuthConfig({ isOpen: true, defaultTab: opts, initialRole: 'STUDENT' });
    } else {
      setAuthConfig({
        isOpen: true,
        defaultTab: opts.tab || opts.defaultTab || 'login',
        initialRole: opts.role || opts.initialRole || 'STUDENT'
      });
    }
  };

  // Sync activePage whenever auth state transitions (Sign in, Sign up, Sign out)
  useEffect(() => {
    if (!currentUser) {
      if (activePage !== 'home') {
        setActivePage('home');
      }
    } else {
      // If user is logged in and activePage is still 'home', immediately switch to their dashboard
      if (activePage === 'home') {
        setActivePage(getDefaultPageForUser(currentUser));
      }
    }
  }, [currentUser]);

  // Safe navigation interceptor
  const handlePageChange = (pageId) => {
    if (!currentUser) {
      if (pageId !== 'home') {
        handleOpenAuth({ defaultTab: 'login' });
        return;
      }
      setActivePage('home');
      return;
    }

    // If logged in, Home Overview is disabled/hidden -> redirect to their hub
    if (pageId === 'home') {
      setActivePage(getDefaultPageForUser(currentUser));
      return;
    }

    setActivePage(pageId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white font-sans antialiased">
      {/* Top Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={handlePageChange} 
        onOpenAuth={() => handleOpenAuth({ defaultTab: 'login' })}
      />

      {/* Body with Sidebar and Main Content */}
      <div className="flex-1 flex max-w-full">
        <Sidebar 
          activePage={activePage} 
          setActivePage={handlePageChange} 
          onOpenAuth={() => handleOpenAuth({ defaultTab: 'login' })}
        />

        <main className="flex-1 min-w-0 pb-12 overflow-x-hidden">
          {/* Public Universal Home Overview */}
          {activePage === 'home' && (
            <HomePage 
              setActivePage={handlePageChange} 
              onOpenAuth={handleOpenAuth}
            />
          )}

          {/* Protected Views (Require Login) */}
          {activePage === 'dashboard' && (
            currentUser ? (
              <DashboardPage 
                setActivePage={handlePageChange}
                onOpenTimer={() => setShowTimerModal(true)}
              />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'mentor-finder' && (
            currentUser ? (
              <AIMentorFinderPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'alumni-dashboard' && (
            currentUser ? (
              <AlumniDashboardPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'recruiter' && (
            currentUser ? (
              <RecruiterDashboardPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'college-admin' && (
            currentUser ? (
              <CollegeAdminPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'super-admin' && (
            currentUser ? (
              <SuperAdminPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'jobs' && (
            currentUser ? (
              <JobsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'hackathons' && (
            currentUser ? (
              <HackathonsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'events' && (
            currentUser ? (
              <EventsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'referrals' && (
            currentUser ? (
              <ReferralsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'alumni-mentors' && (
            currentUser ? (
              <AlumniMentorsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'connections' && (
            currentUser ? (
              <ConnectionsPage setActivePage={handlePageChange} />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'peers' && (
            currentUser ? (
              <ConnectionsPage setActivePage={handlePageChange} />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'groups' && (
            currentUser ? (
              <StudyGroupsPage onOpenTimer={() => setShowTimerModal(true)} />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'assignments' && (
            currentUser ? (
              <AssignmentsPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'messages' && (
            currentUser ? (
              <MessagesPage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}

          {activePage === 'profile' && (
            currentUser ? (
              <ProfilePage />
            ) : (
              <HomePage setActivePage={handlePageChange} onOpenAuth={() => setShowAuthModal(true)} />
            )
          )}
        </main>
      </div>

      {/* Auth Modal with Login, Registration, and 1-Click Demo Logins */}
      <AuthModal 
        isOpen={authConfig.isOpen} 
        onClose={() => setAuthConfig(prev => ({ ...prev, isOpen: false }))} 
        defaultTab={authConfig.defaultTab}
        initialRole={authConfig.initialRole}
      />

      {showTimerModal && (
        <StudyTimerModal onClose={() => setShowTimerModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
