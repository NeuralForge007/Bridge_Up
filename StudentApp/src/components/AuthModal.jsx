import React, { useState } from 'react';
import { useAuth, AVATAR_PRESETS } from '../context/AuthContext';

const CANONICAL_COLLEGES = [
  { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  { id: 2, name: 'Jadavpur University', code: 'JU' },
  { id: 3, name: 'University of Calcutta', code: 'CU' },
  { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  { id: 5, name: 'NIT Durgapur', code: 'NITDGP' }
];

const SKILL_SUGGESTIONS = [
  'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'PyTorch', 'TensorFlow',
  'PostgreSQL', 'Docker', 'AWS', 'FastAPI', 'Figma', 'Solidity', 'GraphQL', 'Embedded Systems'
];

const ROLE_SUGGESTIONS = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'ML Engineer',
  'Data Scientist', 'Robotics Engineer', 'UI/UX Designer', 'Cloud/DevOps Engineer', 'Pitch and Presentation Lead'
];

const DOMAIN_SUGGESTIONS = [
  'AI for Social Good', 'FinTech', 'Healthcare', 'Sustainability', 'Smart Cities',
  'EdTech', 'Cybersecurity', 'Web3', 'Disaster Management', 'Open Innovation'
];

const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState(defaultTab); // 'login' | 'signup'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student Registration State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [collegeNetwork, setCollegeNetwork] = useState('1');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [graduationYear, setGraduationYear] = useState(2028);
  const [degree, setDegree] = useState('B.Tech');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [cgpa, setCgpa] = useState('8.50');
  
  // Career & Skills
  const [careerDomain, setCareerDomain] = useState('Software Engineering');
  const [careerGoal, setCareerGoal] = useState('Build expertise in Software Engineering and contribute to impactful technology projects');
  const [primarySkill, setPrimarySkill] = useState('Python');
  const [selectedSkills, setSelectedSkills] = useState(['Python', 'React', 'SQL']);
  const [customSkill, setCustomSkill] = useState('');
  const [preferredRoles, setPreferredRoles] = useState(['Full Stack Developer']);
  
  // Experience & Collaboration
  const [hackathonsParticipated, setHackathonsParticipated] = useState(2);
  const [hackathonsFinalist, setHackathonsFinalist] = useState(1);
  const [hackathonsWon, setHackathonsWon] = useState(0);
  const [totalProjects, setTotalProjects] = useState(4);
  const [successfulProjects, setSuccessfulProjects] = useState(3);
  const [selectedDomains, setSelectedDomains] = useState(['AI for Social Good', 'Sustainability']);
  const [teamLeadership, setTeamLeadership] = useState(true);
  const [availability, setAvailability] = useState('Available');
  const [collaborationMode, setCollaborationMode] = useState('Any');
  const [city, setCity] = useState('Kolkata');
  const [languages, setLanguages] = useState('English, Hindi, Bengali');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [openToTeamRequests, setOpenToTeamRequests] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (defaultTab) setTab(defaultTab);
      setError('');
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = (s) => {
    if (selectedSkills.includes(s)) {
      setSelectedSkills(selectedSkills.filter(x => x !== s));
    } else {
      setSelectedSkills([...selectedSkills, s]);
    }
  };

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleToggleRole = (r) => {
    if (preferredRoles.includes(r)) {
      setPreferredRoles(preferredRoles.filter(x => x !== r));
    } else {
      setPreferredRoles([...preferredRoles, r]);
    }
  };

  const handleToggleDomain = (d) => {
    if (selectedDomains.includes(d)) {
      setSelectedDomains(selectedDomains.filter(x => x !== d));
    } else {
      setSelectedDomains([...selectedDomains, d]);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    // Validations
    if (!fullName.trim() || !signupEmail.trim()) {
      setError('Full name and email are required.');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const numCgpa = parseFloat(cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10.0) {
      setError('Please enter a valid CGPA between 0.0 and 10.0.');
      return;
    }

    if (Number(successfulProjects) > Number(totalProjects)) {
      setError('Successful projects cannot exceed total projects.');
      return;
    }

    if (Number(hackathonsWon) > Number(hackathonsFinalist) || Number(hackathonsFinalist) > Number(hackathonsParticipated)) {
      setError('Hackathons won must be ≤ finalists ≤ participated.');
      return;
    }

    const selectedCollegeValue = String(collegeNetwork ?? '').trim();
    if (!selectedCollegeValue) {
      setError('Please select a valid college network.');
      return;
    }

    const selectedCollege = CANONICAL_COLLEGES.find(
      item =>
        String(item.id) === selectedCollegeValue ||
        String(item.code).toLowerCase() === selectedCollegeValue.toLowerCase() ||
        item.name.toLowerCase() === selectedCollegeValue.toLowerCase()
    );

    if (!selectedCollege) {
      setError('Please select a valid college network.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        full_name: fullName.trim(),
        name: fullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        confirm_password: confirmPassword,
        gender,
        collegeNetwork: selectedCollege.name,
        collegeId: selectedCollege.id,
        college_id: selectedCollege.id,
        collegeName: selectedCollege.name,
        college_name: selectedCollege.name,
        year_of_study: Number(yearOfStudy),
        yearOfStudy: Number(yearOfStudy),
        graduation_year: Number(graduationYear),
        graduationYear: Number(graduationYear),
        degree,
        department,
        cgpa: numCgpa,
        career_domain: careerDomain,
        careerDomain: careerDomain,
        career_goal: careerGoal,
        careerGoal: careerGoal,
        primary_skill: primarySkill || selectedSkills[0] || 'Python',
        primarySkill: primarySkill || selectedSkills[0] || 'Python',
        skills: selectedSkills,
        preferred_team_roles: preferredRoles,
        preferredTeamRoles: preferredRoles,
        hackathons_participated: Number(hackathonsParticipated),
        hackathonsParticipated: Number(hackathonsParticipated),
        hackathons_finalist: Number(hackathonsFinalist),
        hackathonsFinalist: Number(hackathonsFinalist),
        hackathons_won: Number(hackathonsWon),
        hackathonsWon: Number(hackathonsWon),
        total_projects: Number(totalProjects),
        totalProjects: Number(totalProjects),
        successful_projects: Number(successfulProjects),
        successfulProjects: Number(successfulProjects),
        project_domains: selectedDomains,
        projectDomains: selectedDomains,
        team_leadership_experience: teamLeadership,
        teamLeadershipExperience: teamLeadership,
        availability,
        collaboration_mode: collaborationMode,
        collaborationMode: collaborationMode,
        city,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        github_url: githubUrl,
        githubUrl: githubUrl,
        linkedin_url: linkedinUrl,
        linkedinUrl: linkedinUrl,
        bio: bio || `Student at ${selectedCollege.name}`,
        open_to_team_requests: openToTeamRequests,
        openToTeamRequests: openToTeamRequests,
        avatar: selectedAvatar
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl my-8 max-h-[90vh] overflow-y-auto">
        
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 mb-3">
            <span className="text-xl font-black">B</span>
          </div>
          <h2 className="text-2xl font-black text-white">Bridge<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Up</span></h2>
          <p className="text-xs text-slate-400 mt-1">AI Alumni Mentorship & Hackathon Teammate Matching Platform</p>
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
            Create Student Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-rose-300 hover:text-white">✕</button>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to BridgeUp'}
            </button>
          </form>
        )}

        {/* 2. CANONICAL STUDENT REGISTRATION FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            
            {/* Account Credentials */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">1. Account Credentials & Personal Identity</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sayan Roy"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="student@bridgeup.example"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password (min. 8 characters) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kolkata"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">2. Academic Credentials</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">College Network *</label>
                  <select
                    value={collegeNetwork}
                    onChange={(e) => setCollegeNetwork(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    {CANONICAL_COLLEGES.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">CGPA (0 - 10) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="8.50"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department / Branch</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science & Engineering"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Career Goals & Skills */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Career Goals & Skills</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Career Domain</label>
                  <select
                    value={careerDomain}
                    onChange={(e) => setCareerDomain(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="AI / Machine Learning">AI / Machine Learning</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Web / Cloud">Web / Cloud</option>
                    <option value="IoT / Embedded Systems">IoT / Embedded Systems</option>
                    <option value="Hardware / Energy">Hardware / Energy</option>
                    <option value="Product / Business">Product / Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Primary Skill</label>
                  <input
                    type="text"
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value)}
                    placeholder="e.g. Python"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Career Goal Statement</label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Master distributed systems and lead AI product development"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              {/* Skills Multi-select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Technical Skills (Multi-select)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SKILL_SUGGESTIONS.map(s => {
                    const sel = selectedSkills.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleToggleSkill(s)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                          sel
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {s} {sel && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add other skill..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Preferred Roles */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Preferred Hackathon Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_SUGGESTIONS.map(r => {
                    const sel = preferredRoles.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleToggleRole(r)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                          sel
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {r} {sel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hackathon & Experience Counts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">4. Experience & Hackathon Record</h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hackathons</label>
                  <input
                    type="number"
                    min="0"
                    value={hackathonsParticipated}
                    onChange={(e) => setHackathonsParticipated(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Finalist</label>
                  <input
                    type="number"
                    min="0"
                    value={hackathonsFinalist}
                    onChange={(e) => setHackathonsFinalist(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Won</label>
                  <input
                    type="number"
                    min="0"
                    value={hackathonsWon}
                    onChange={(e) => setHackathonsWon(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Total Proj.</label>
                  <input
                    type="number"
                    min="0"
                    value={totalProjects}
                    onChange={(e) => setTotalProjects(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Succ. Proj.</label>
                  <input
                    type="number"
                    min="0"
                    value={successfulProjects}
                    onChange={(e) => setSuccessfulProjects(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Project Domains */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Project Domains</label>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAIN_SUGGESTIONS.map(d => {
                    const sel = selectedDomains.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleToggleDomain(d)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                          sel
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {d} {sel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Collaboration & Links */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">5. Collaboration, Bio & Links</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Collaboration Mode</label>
                  <select
                    value={collaborationMode}
                    onChange={(e) => setCollaborationMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    <option value="Any">Any Mode</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="In-person">In-person</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Languages (Comma-separated)</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="English, Bengali, Hindi"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">GitHub URL (Optional)</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">LinkedIn URL (Optional)</label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bio / Self-Summary</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Passionate engineering student excited about building impactful projects..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="openToRequests"
                  checked={openToTeamRequests}
                  onChange={(e) => setOpenToTeamRequests(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="openToRequests" className="text-xs text-slate-300 font-medium">
                  Open to receiving Hackathon team match requests
                </label>
              </div>
            </div>

            {/* Choose Avatar */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-2">Choose Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.slice(0, 8).map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt="avatar option"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-10 w-10 cursor-pointer rounded-xl border p-0.5 transition-all ${
                      selectedAvatar === av
                        ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/20 scale-105'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-110 disabled:opacity-50 transition-all mt-4"
            >
              {loading ? 'Creating Canonical Student Account & Embedding...' : 'Complete Student Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
