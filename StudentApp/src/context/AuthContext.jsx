import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const AVATAR_PRESETS = [
  // 👨 Male Professional Cartoon Avatars (Collars, Blazers, Smart Casual)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=collarAndSweater&top=shortFlat&hairColor=2c1b18&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=David&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=shortCurly&hairColor=4a312c&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=shirtCrewNeck&top=shortRound&hairColor=000000&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=shortWaved&hairColor=724133&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Julian&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=collarAndSweater&top=theCaesar&hairColor=2c1b18&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&accessories=prescription02&accessoriesProbability=100&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=shirtCrewNeck&top=shortFlat&hairColor=4a312c&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=shortRound&hairColor=2c1b18&backgroundColor=d1d4f9',
  // 👩 Female Professional Cartoon Avatars (Collars, Blazers, Smart Casual)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=collarAndSweater&top=straight02&hairColor=4a312c&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=curvy&hairColor=724133&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=straight01&hairColor=2c1b18&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=shirtCrewNeck&top=bob&hairColor=000000&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=collarAndSweater&top=straight02&hairColor=4a312c&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=shirtCrewNeck&accessories=prescription01&accessoriesProbability=100&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=blazerAndShirt&top=curvy&hairColor=2c1b18&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&mouth=smile&eyes=default&eyebrows=defaultNatural&clothing=collarAndSweater&top=straight01&hairColor=724133&backgroundColor=c0aede'
];

export const INITIAL_DEMO_USERS = [
  {
    id: 'demo-1',
    user_id: 'usr-stu-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@stanford.edu',
    role: 'STUDENT',
    major: 'Computer Science',
    year: 'Senior (Year 4)',
    gpa: '9.20',
    college_name: 'Stanford University',
    avatar: AVATAR_PRESETS[0],
    bio: 'Passionate about AI, full-stack engineering, and distributed systems. Looking for top alumni mentors on BridgeUp!',
    skills: ['React', 'Python', 'Machine Learning', 'Algorithms', 'Tailwind CSS'],
    verification_status: 'VERIFIED'
  },
  {
    id: 'demo-2',
    user_id: 'usr-stu-2',
    name: 'Sophia Chen',
    email: 'sophia.chen@mit.edu',
    role: 'STUDENT',
    major: 'Data Science & Analytics',
    year: 'Junior (Year 3)',
    gpa: '8.88',
    college_name: 'MIT',
    avatar: AVATAR_PRESETS[8],
    bio: 'Data enthusiast exploring deep learning and statistical modeling.',
    skills: ['Python', 'SQL', 'PyTorch', 'R', 'Tableau'],
    verification_status: 'VERIFIED'
  },
  {
    id: 'demo-alumni-1',
    user_id: 'usr-alm-1',
    name: 'Vikram Sethi',
    email: 'vikram.sethi@google.com',
    role: 'ALUMNI',
    company: 'Google',
    role_title: 'Staff Software Engineer',
    college_name: 'Stanford University',
    grad_year: 2018,
    avatar: AVATAR_PRESETS[1],
    bio: 'Tech lead at Google Cloud. Passionate about mentoring students into FAANG and scalable architecture.',
    skills: ['Distributed Systems', 'Go', 'Kubernetes', 'System Design', 'GCP'],
    verification_status: 'VERIFIED'
  },
  {
    id: 'demo-rec-1',
    user_id: 'usr-rec-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@meta.com',
    role: 'RECRUITER',
    company_name: 'Meta',
    avatar: AVATAR_PRESETS[10],
    bio: 'University Talent Acquisition Partner at Meta. Scouting top verified engineering candidates.',
    verification_status: 'VERIFIED'
  },
  {
    id: 'demo-col-1',
    user_id: 'usr-col-1',
    name: 'Dr. Dean Miller',
    email: 'dean.miller@stanford.edu',
    role: 'COLLEGE_ADMIN',
    college_name: 'Stanford University',
    avatar: AVATAR_PRESETS[5],
    bio: 'Director of Alumni Relations and Student Placement at Stanford University.',
    verification_status: 'VERIFIED'
  },
  {
    id: 'demo-admin-1',
    user_id: 'usr-adm-1',
    name: 'Super Admin',
    email: 'admin@bridgeup.io',
    role: 'SUPER_ADMIN',
    avatar: AVATAR_PRESETS[3],
    bio: 'Platform Administrator with full oversight and analytics privileges.',
    verification_status: 'VERIFIED'
  }
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nextstep_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [demoUsers, setDemoUsers] = useState(INITIAL_DEMO_USERS);
  const [theme, setTheme] = useState(() => localStorage.getItem('nextstep_theme') || 'dark');

  // Load demo users from backend if available
  useEffect(() => {
    const fetchDemoList = async () => {
      const users = await apiService.getDemoUsers();
      if (users && users.length > 0) {
        setDemoUsers(users);
      }
    };
    fetchDemoList();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nextstep_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nextstep_user');
      localStorage.removeItem('nextstep_token');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nextstep_theme', theme);
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Standard Login
  const login = async (email, password) => {
    try {
      const result = await apiService.login(email, password);
      if (result && result.user) {
        const user = {
          ...result.user,
          name: result.user.name || `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim(),
          avatar: result.user.avatar || result.user.avatar_url || AVATAR_PRESETS[0],
          role: result.user.role || 'STUDENT',
          verification_status: result.user.verification_status || 'VERIFIED'
        };
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err) {
      // Check local demo list fallback
      const found = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        return { success: true, user: found };
      }
      throw err;
    }
  };

  // Quick 1-Click Login for Demo Profiles
  const quickLogin = async (demoUserOrId) => {
    let target = typeof demoUserOrId === 'string' 
      ? demoUsers.find(u => u.id === demoUserOrId || u.user_id === demoUserOrId || u.email === demoUserOrId)
      : demoUserOrId;

    if (!target) {
      target = INITIAL_DEMO_USERS[0];
    }

    try {
      const res = await apiService.login(target.email, 'password123');
      if (res && res.user) {
        const user = {
          ...res.user,
          name: res.user.name || `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim(),
          avatar: res.user.avatar || target.avatar || AVATAR_PRESETS[0],
          role: res.user.role || target.role || 'STUDENT'
        };
        setCurrentUser(user);
        return;
      }
    } catch (e) {
      console.warn('Backend login fallback used for demo:', e.message);
    }

    setCurrentUser(target);
  };

  // Standard Signup
  const signup = async (userData) => {
    const fullName = (userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`).trim() || 'New User';
    const registerPayload = {
      email: userData.email,
      password: userData.password || 'password123',
      name: fullName,
      firstName: userData.firstName || fullName.split(' ')[0] || 'New',
      lastName: userData.lastName || fullName.split(' ').slice(1).join(' ') || 'User',
      role: userData.role || 'STUDENT',
      collegeId: userData.collegeId || 'col-1',
      collegeName: userData.collegeName || 'Stanford University',
      major: userData.major || 'Computer Science',
      year: userData.year || 'Junior (Year 3)',
      gpa: userData.gpa || '8.50',
      avatarUrl: userData.avatar || AVATAR_PRESETS[0],
      avatar: userData.avatar || AVATAR_PRESETS[0],
      headline: userData.headline || userData.bio || 'Aspiring engineer & builder on BridgeUp',
      skills: Array.isArray(userData.skills) ? userData.skills : (userData.skills ? userData.skills.split(',').map(s => s.trim()) : ['React', 'Python']),
      company: userData.company || '',
      roleTitle: userData.roleTitle || '',
      companyName: userData.companyName || userData.company || ''
    };

    try {
      const result = await apiService.register(registerPayload);
      if (result && result.user) {
        const user = {
          ...result.user,
          name: result.user.name || result.user.display_name || `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim() || fullName,
          avatar: result.user.avatar || result.user.avatar_url || registerPayload.avatarUrl,
          role: result.user.role || registerPayload.role,
          collegeName: result.user.college_name || registerPayload.collegeName,
          major: result.user.major || registerPayload.major,
          gpa: result.user.gpa || registerPayload.gpa,
          skills: result.user.skills || registerPayload.skills
        };
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    if (currentUser) {
      apiService.logout(currentUser.id, currentUser.email);
    }
    setCurrentUser(null);
    localStorage.removeItem('nextstep_token');
    localStorage.removeItem('nextstep_user');
  };

  // Update profile
  const updateProfile = async (updatedData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedData
    }));
    if (currentUser?.id || currentUser?.user_id) {
      await apiService.updateProfile(currentUser.user_id || currentUser.id, updatedData);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      demoUsers,
      avatarPresets: AVATAR_PRESETS,
      login,
      quickLogin,
      signup,
      logout,
      updateProfile,
      theme,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
