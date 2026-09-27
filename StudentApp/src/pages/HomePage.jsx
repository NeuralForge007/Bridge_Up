import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ setActivePage, onOpenAuth }) => {
  const { currentUser, quickLogin, demoUsers } = useAuth();

  // Interactive AI Matcher Demo state
  const [selectedGoal, setSelectedGoal] = useState('Backend Engineer');
  const [activeRoleTab, setActiveRoleTab] = useState('student');

  const handleAction = (pageId, role) => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth({ tab: 'signup', role: role || 'STUDENT' });
      }
    } else {
      setActivePage(pageId);
    }
  };

  const handleLoginAction = (role) => {
    if (onOpenAuth) {
      onOpenAuth({ tab: 'login', role: role || 'STUDENT' });
    }
  };

  const handleDemoLaunch = (role) => {
    if (demoUsers && demoUsers.length > 0) {
      const match = demoUsers.find(u => u.role === role) || demoUsers[0];
      quickLogin(match);
      if (match.role === 'ALUMNI') setActivePage('alumni-dashboard');
      else if (match.role === 'RECRUITER') setActivePage('recruiter');
      else if (match.role === 'COLLEGE_ADMIN') setActivePage('college-admin');
      else if (match.role === 'SUPER_ADMIN') setActivePage('super-admin');
      else setActivePage('dashboard');
    } else {
      onOpenAuth({ tab: 'login' });
    }
  };

  const goalProfiles = {
    'Backend Engineer': {
      mentor: 'Rahul Sharma',
      role: 'Senior Backend Engineer',
      company: 'Microsoft',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4',
      college: 'Institute of Engineering & Management (IEM)',
      matchScore: 92,
      skills: ['Node.js', 'PostgreSQL', 'System Design', 'AWS', 'Docker'],
      reason: 'Direct match in distributed backend architectures, PostgreSQL indexing, and transition from CS coursework into high-scale cloud services.'
    },
    'AI / Machine Learning': {
      mentor: 'Priya Mukherjee',
      role: 'Lead AI Research Engineer',
      company: 'Google DeepMind',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=ffd5dc',
      college: 'IIT Kharagpur',
      matchScore: 95,
      skills: ['PyTorch', 'NLP', 'LLMs', 'Python', 'Vector DBs'],
      reason: 'Exceptional alignment in transformer architectures, deep learning research pipelines, and AI hackathon mentorship.'
    },
    'Cloud Architect': {
      mentor: 'Ananya Gupta',
      role: 'Staff Solutions Architect',
      company: 'Amazon Web Services',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=c0aede',
      college: 'Institute of Engineering and Management',
      matchScore: 89,
      skills: ['Kubernetes', 'Terraform', 'AWS Lambda', 'Microservices'],
      reason: 'Strong track record in enterprise cloud migration, infrastructure as code, and mentoring junior engineers through AWS certifications.'
    },
    'Full Stack Lead': {
      mentor: 'Arjun Das',
      role: 'Principal FullStack Lead',
      company: 'Atlassian',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=d1d4f9',
      college: 'Heritage Institute of Technology',
      matchScore: 91,
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL'],
      reason: 'Proven expertise in full-stack web architecture, modern React frameworks, and guiding students on production-ready capstones.'
    }
  };

  const activeMentor = goalProfiles[selectedGoal] || goalProfiles['Backend Engineer'];

  return (
    <div className="space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 selection:bg-blue-500 selection:text-white">
      
      {/* 🧭 Quick In-Page Sticky Anchor Bar (High Contrast Light & Dark) */}
      <div className="sticky-subnav hidden lg:flex items-center justify-between py-2.5 px-6 rounded-2xl sticky top-20 z-30 transition-all">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <a href="#hero" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Overview</a>
          <a href="#how-it-works" className="subnav-link px-3 py-1.5 rounded-xl transition-all">How It Works</a>
          <a href="#features" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Features</a>
          <a href="#ai-matcher" className="subnav-link px-3 py-1.5 rounded-xl transition-all">AI Matcher</a>
          <a href="#roles" className="subnav-link px-3 py-1.5 rounded-xl transition-all">For Roles</a>
          <a href="#trust" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Verification</a>
          <a href="#hackathons" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Hackathons</a>
          <a href="#referrals" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Referrals</a>
          <a href="#impact" className="subnav-link px-3 py-1.5 rounded-xl transition-all">Impact</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLoginAction('STUDENT')}
            className="subnav-signin text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => handleAction('dashboard', 'STUDENT')}
            className="subnav-cta text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Get Started Free →</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. HERO SECTION
          ========================================================================= */}
      <section id="hero" className="campus-hero-banner relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden border border-blue-500/20 shadow-2xl my-4">
        {/* Campus Aerial Background Image */}
        <div 
          className="campus-hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: "url('/campus-hero-bg.jpg')" }}
        />
        {/* Contrast & Legibility Gradient Overlay */}
        <div className="campus-hero-overlay absolute inset-0 pointer-events-none" />

        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Hero Content - Frosted Glass Content Panel */}
          <div className="lg:col-span-7 hero-content-panel p-6 sm:p-8 lg:p-10 rounded-3xl space-y-6 text-left relative z-10">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>AI-Powered Alumni & Mentorship Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              From Campus <br />
              to Career. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Together.
              </span>
            </h1>

            {/* Supporting Pitch */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Connect with verified alumni, discover the right mentors, build stronger teams, and turn opportunities into your next step.
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleAction('dashboard', 'STUDENT')}
                className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 hover:brightness-110 flex items-center gap-2.5"
              >
                <span>Get Started Free →</span>
              </button>

              <a
                href="#how-it-works"
                className="rounded-2xl border border-slate-700 bg-slate-900/80 px-7 py-4 text-sm font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white flex items-center gap-2"
              >
                <span>Explore How It Works</span>
              </a>

              <button
                onClick={() => handleDemoLaunch('STUDENT')}
                className="rounded-2xl border border-purple-500/30 bg-purple-950/30 px-6 py-4 text-sm font-bold text-purple-300 transition-all hover:bg-purple-900/50 hover:text-white flex items-center gap-2"
              >
                <span>⚡ 1-Click Live Demo</span>
              </button>
            </div>

            {/* Trust Quote */}
            <div className="pt-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex text-amber-400">★★★★★</span>
              <span>Trusted by students and verified alumni across leading tech universities</span>
            </div>

          </div>

          {/* Right Hero Composition (Actual BridgeUp SaaS Floating UI Cards) */}
          <div className="lg:col-span-5 relative z-10">
            <div className="relative mx-auto max-w-md space-y-4">
              
              {/* Card 1: AI Mentor Match */}
              <div className="hero-floating-card rounded-3xl border border-blue-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">AI Mentor Match</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/20">
                    92% Match
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4"
                    alt="Rahul Sharma"
                    className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">Rahul Sharma</h4>
                      <span className="text-blue-400 text-xs" title="College Verified">✓</span>
                    </div>
                    <p className="text-xs text-slate-400">Backend Engineer @ Microsoft</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">✓ College Verified</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">Node.js</span>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">PostgreSQL</span>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">System Design</span>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">AWS</span>
                </div>
              </div>

              {/* Card 2: Referral Opportunity */}
              <div className="hero-floating-card rounded-3xl border border-purple-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚀</span>
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Referral Opportunity</h4>
                      <p className="text-sm font-bold text-white">Software Engineer (L4 / SDE-1)</p>
                    </div>
                  </div>
                  <span className="rounded-xl bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-400 border border-purple-500/20">
                    Open Referral
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Google • Direct Alumni Recommendation Pipeline</p>
              </div>

              {/* Card 3: Hackathon Team Teaser */}
              <div className="hero-floating-card rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏆</span>
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Smart India Hackathon 2025</h4>
                      <p className="text-xs text-slate-300">Team: CodeCraft (3/4 Members)</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                    Needs AI/ML
                  </span>
                </div>
              </div>

              {/* Process Ribbon Flow */}
              <div className="hero-floating-card rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                <span>Student</span>
                <span className="text-blue-400">→</span>
                <span>Mentor</span>
                <span className="text-indigo-400">→</span>
                <span>Opportunity</span>
                <span className="text-cyan-400">→</span>
                <span className="text-white font-bold">Career</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. DATASET-DRIVEN STATS & SOCIAL PROOF (SHADY EFFECT & HIGH CONTRAST)
          ========================================================================= */}
      <section className="stats-shady-banner relative rounded-3xl p-6 sm:p-8 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          
          <div className="stats-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <p className="stats-num stats-num-1 text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                50+
              </p>
              <p className="stats-label text-xs font-bold uppercase tracking-wider">
                Demo Students Ingested
              </p>
            </div>
          </div>

          <div className="stats-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <p className="stats-num stats-num-2 text-3xl sm:text-4xl font-black tracking-tight text-blue-400 drop-shadow-sm">
                40+
              </p>
              <p className="stats-label text-xs font-bold uppercase tracking-wider">
                Verified Alumni Mentors
              </p>
            </div>
          </div>

          <div className="stats-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <p className="stats-num stats-num-3 text-3xl sm:text-4xl font-black tracking-tight text-indigo-400 drop-shadow-sm">
                8
              </p>
              <p className="stats-label text-xs font-bold uppercase tracking-wider">
                Partner Colleges & Univs
              </p>
            </div>
          </div>

          <div className="stats-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <p className="stats-num stats-num-4 text-3xl sm:text-4xl font-black tracking-tight text-cyan-400 drop-shadow-sm">
                100%
              </p>
              <p className="stats-label text-xs font-bold uppercase tracking-wider">
                Deterministic AI Match
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. TRUST STRIP
          ========================================================================= */}
      <section id="trust-strip" className="border-y border-slate-800/80 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <span className="text-emerald-400 font-black">✓</span>
            <span>College Verified</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <span className="text-blue-400 font-black">✓</span>
            <span>Secure Profiles</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <span className="text-indigo-400 font-black">✓</span>
            <span>AI-Powered Matching</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <span className="text-cyan-400 font-black">✓</span>
            <span>Trusted Opportunities</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. THE PROBLEM SECTION
          ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
            The Current Challenge
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Career opportunities shouldn't depend on who you already know.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Traditional campus networks leave students guessing and alumni disengaged. BridgeUp eliminates the friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl mb-4">
              📑
            </div>
            <h3 className="text-base font-bold text-white mb-2">Scattered Alumni Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alumni information is often spread across departments, outdated spreadsheets, and siloed messaging groups with zero continuity.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl mb-4">
              🧭
            </div>
            <h3 className="text-base font-bold text-white mb-2">Finding the Right Mentor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Students know they need guidance but don't know which specific alumni are on the precise technical path they want to follow.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl mb-4">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white mb-2">Low Trust & Fake Profiles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unverified or outdated profiles on general social platforms make it hard to confirm legitimate college credentials and industry status.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl mb-4">
              ⏳
            </div>
            <h3 className="text-base font-bold text-white mb-2">Missed Opportunities</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Internships, hackathons, job referrals, and industry connections disappear simply because the right person was never discovered in time.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. THE SOLUTION & ECOSYSTEM SECTION (SMART CITY CIRCUIT BACKGROUND)
          ========================================================================= */}
      <section className="ecosystem-circuit-banner relative rounded-3xl border border-cyan-500/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
        {/* Futuristic Circuit City Background */}
        <div 
          className="ecosystem-circuit-bg absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
          style={{ backgroundImage: `url('/ecosystem-circuit-bg.png')` }}
        />
        
        {/* Dynamic Dark Cyber Vignette Overlay */}
        <div className="ecosystem-circuit-overlay absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/90 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-3 mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-4 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-sm">
            <span>⚡ Unified Ecosystem</span>
          </span>
          <h2 className="ecosystem-title text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
            One network. <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Many possibilities.
            </span>
          </h2>
          <p className="ecosystem-desc text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl mx-auto font-normal drop-shadow">
            BridgeUp brings students, alumni, colleges, and recruiters into one college-verified ecosystem.
          </p>
        </div>

        {/* Interactive Ecosystem Hub Visual */}
        <div className="relative z-10 max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-slate-950/85 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            
            <div className="ecosystem-role-card p-4 rounded-2xl border border-blue-500/30 bg-blue-950/40 text-center transition-all hover:scale-105 hover:border-blue-400/60 shadow-md">
              <span className="text-2xl block mb-1">🎓</span>
              <h4 className="text-xs font-bold text-white mt-1">Students</h4>
              <p className="text-[10px] text-blue-300 font-medium">Mentorship & Hiring</p>
            </div>

            <div className="ecosystem-role-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-center transition-all hover:scale-105 hover:border-emerald-400/60 shadow-md">
              <span className="text-2xl block mb-1">💼</span>
              <h4 className="text-xs font-bold text-white mt-1">Alumni Mentors</h4>
              <p className="text-[10px] text-emerald-300 font-medium">Give Back & Refer</p>
            </div>

            <div className="ecosystem-role-card p-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 text-center transition-all hover:scale-105 hover:border-amber-400/60 shadow-md">
              <span className="text-2xl block mb-1">🏛️</span>
              <h4 className="text-xs font-bold text-white mt-1">Colleges</h4>
              <p className="text-[10px] text-amber-300 font-medium">Verification & Analytics</p>
            </div>

            <div className="ecosystem-role-card p-4 rounded-2xl border border-purple-500/30 bg-purple-950/40 text-center transition-all hover:scale-105 hover:border-purple-400/60 shadow-md">
              <span className="text-2xl block mb-1">🎯</span>
              <h4 className="text-xs font-bold text-white mt-1">Recruiters</h4>
              <p className="text-[10px] text-purple-300 font-medium">Direct Verified Talent</p>
            </div>

          </div>

          {/* Central Connecting Core */}
          <div className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-cyan-500/20 border border-cyan-300/30 inline-flex items-center gap-2 hover:scale-105 transition-all">
            <span>⚡ BRIDGEUP CENTRALIZED INTELLIGENCE CORE</span>
          </div>

          {/* Connected Pathways Under Core */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-slate-200">
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">🤝 Mentorship</span>
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">💼 Opportunities</span>
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">🏆 Hackathons</span>
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">🚀 Referrals</span>
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">🎯 Recruitment</span>
            <span className="ecosystem-pill rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 backdrop-blur-sm shadow-sm">📅 Campus Events</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PREMIUM FEATURE GRID
          ========================================================================= */}
      <section id="features" className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-400">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Everything you need for your next step.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Engineered from ground up to turn campus talent into industry achievement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div 
            onClick={() => handleAction('mentor-finder', 'STUDENT')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-blue-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🤖
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">AI Mentor Finder</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Tell us where you want to go. Discover verified alumni whose skills, experience and career path align with your goals.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-400">
              <span>Find Your Mentor</span>
              <span>→</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div 
            onClick={() => handleAction('alumni-mentors', 'STUDENT')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-emerald-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🎓
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Verified Alumni Hub</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Discover trusted alumni profiles verified through their college network, with company badges, booking calendars, and direct chat.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span>Explore Directory</span>
              <span>→</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div 
            onClick={() => handleAction('hackathons', 'STUDENT')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-cyan-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🏆
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Hackathon Partner Matching</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Find teammates based on complementary skills (Frontend, AI/ML, UI/UX, Cloud), domain preferences, and college location.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <span>Find Teammates</span>
              <span>→</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div 
            onClick={() => handleAction('jobs', 'STUDENT')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-purple-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              💼
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Jobs & Internships</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Discover opportunities relevant to your skills, career goals and academic background posted directly by recruiters and alumni.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <span>View Openings</span>
              <span>→</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div 
            onClick={() => handleAction('referrals', 'STUDENT')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-indigo-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🚀
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">Alumni Referral Engine</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Turn trusted alumni relationships into meaningful career opportunities through structured, verified referral pipelines.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <span>Request Referrals</span>
              <span>→</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div 
            onClick={() => handleAction('recruiter', 'RECRUITER')}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7 transition-all hover:border-amber-500/50 hover:bg-slate-900 hover:-translate-y-1 cursor-pointer group shadow-lg"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
              🎯
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Recruiter Talent Portal</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Discover verified candidates using skills, achievements, college and referral signals with 1-click interview scheduling.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>Recruiter Access</span>
              <span>→</span>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. AI MENTOR FINDER INTERACTIVE SHOWCASE
          ========================================================================= */}
      <section id="ai-matcher" className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Narrative */}
          <div className="lg:col-span-5 space-y-5">
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
              Live Interactive Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Don't search for a mentor. <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Find the right one.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              BridgeUp combines career goals, skills, experience and verified academic connections to surface relevant mentors.
            </p>

            {/* Interactive Goal Switcher */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Your Desired Career Goal (Interactive):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(goalProfiles).map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-left transition-all ${
                      selectedGoal === goal
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleAction('mentor-finder', 'STUDENT')}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                Launch Full AI Matcher →
              </button>
            </div>
          </div>

          {/* Right Live Match Preview Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/95 p-6 sm:p-8 shadow-2xl relative">
              
              {/* Header Match Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-400">Target Goal:</span>
                  <p className="text-sm font-black text-white">{selectedGoal}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400">
                    {activeMentor.matchScore}% Match Rate
                  </span>
                </div>
              </div>

              {/* Mentor Profile Details */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  src={activeMentor.avatar}
                  alt={activeMentor.mentor}
                  className="h-16 w-16 rounded-2xl border-2 border-blue-400/40 bg-slate-800 shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{activeMentor.mentor}</h3>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                      ✓ Verified Alumni
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-300">{activeMentor.role} @ {activeMentor.company}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeMentor.college}</p>
                </div>
              </div>

              {/* Skills Overlap */}
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-400 mb-1.5">Matched Skills & Competencies:</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeMentor.skills.map((s) => (
                    <span key={s} className="rounded-md bg-blue-950/40 border border-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Why This Match Explanation */}
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-bold text-cyan-400 mb-1">🤖 Why this match?</p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  "{activeMentor.reason}"
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-slate-400">⚡ Instant 1-Click Meeting Request Available</span>
                <button
                  onClick={() => handleAction('mentor-finder', 'STUDENT')}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 shadow-md transition-all"
                >
                  View Full Profile & Book →
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          8. HOW IT WORKS (4 STEPS)
          ========================================================================= */}
      <section id="how-it-works" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            How BridgeUp Works.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            From registration to verified referrals, your journey is streamlined and authenticated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 relative">
            <span className="text-4xl font-black text-blue-500/30">01</span>
            <h3 className="text-base font-bold text-white mt-2 mb-2">Create Your Profile</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Students and alumni create profiles with technical skills, career goals, graduation year, and college credentials.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 relative">
            <span className="text-4xl font-black text-indigo-500/30">02</span>
            <h3 className="text-base font-bold text-white mt-2 mb-2">Get Verified</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              College-linked verification establishes trusted identities, unlocking authentic mentorship and referral access.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 relative">
            <span className="text-4xl font-black text-purple-500/30">03</span>
            <h3 className="text-base font-bold text-white mt-2 mb-2">Find Your Match</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              BridgeUp matches students with relevant mentors, hackathon teammates, or recruiter opportunities with high precision.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 relative">
            <span className="text-4xl font-black text-cyan-500/30">04</span>
            <h3 className="text-base font-bold text-white mt-2 mb-2">Take Your Next Step</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mentorship sessions, company referrals, hackathons, and recruiter shortlists turn connections into tangible career progress.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          9. ROLE-BASED EXPERIENCE SECTION (4 CARDS)
          ========================================================================= */}
      <section id="roles" className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
            Multi-Stakeholder Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Built for everyone in the academic ecosystem.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Choose your role to explore dedicated tools designed specifically for your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Student */}
          <div className="rounded-3xl border border-blue-500/30 bg-slate-900/80 p-7 flex flex-col justify-between hover:border-blue-500 transition-all hover:-translate-y-1 shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4">
                🎓
              </div>
              <h3 className="text-xl font-bold text-white">Students</h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Find mentors. Discover verified internships. Build hackathon teams. Grow your technical career.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAction('dashboard', 'STUDENT')}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 shadow-md transition-all"
              >
                I'm a Student →
              </button>
            </div>
          </div>

          {/* Card 2: Alumni */}
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-7 flex flex-col justify-between hover:border-emerald-500 transition-all hover:-translate-y-1 shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-4">
                💼
              </div>
              <h3 className="text-xl font-bold text-white">Alumni Mentors</h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Give back, mentor promising juniors, share industry experience, and refer top talent to your company.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAction('alumni-dashboard', 'ALUMNI')}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 shadow-md transition-all"
              >
                I'm an Alumni →
              </button>
            </div>
          </div>

          {/* Card 3: Recruiter */}
          <div className="rounded-3xl border border-purple-500/30 bg-slate-900/80 p-7 flex flex-col justify-between hover:border-purple-500 transition-all hover:-translate-y-1 shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white">Recruiters</h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Discover verified candidates through vetted skills, academic achievements, and alumni referral signals.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAction('recruiter', 'RECRUITER')}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 shadow-md transition-all"
              >
                I'm a Recruiter →
              </button>
            </div>
          </div>

          {/* Card 4: College */}
          <div className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-7 flex flex-col justify-between hover:border-amber-500 transition-all hover:-translate-y-1 shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-4">
                🏛️
              </div>
              <h3 className="text-xl font-bold text-white">College Admins</h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Build a stronger alumni network, verify registered students, host campus webinars, and measure outcomes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleAction('college-admin', 'COLLEGE_ADMIN')}
                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 shadow-md transition-all"
              >
                I'm a College Admin →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          10. VERIFIED NETWORK & TRUST SECTION
          ========================================================================= */}
      <section id="trust" className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-6 space-y-4">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              Authenticity First
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Connections you can trust.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              BridgeUp is designed around college-verified connections so students, alumni, and recruiters can interact with greater confidence.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">✓</span>
                <span className="text-xs font-semibold text-slate-200">College-verified academic email & registry checks</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">✓</span>
                <span className="text-xs font-semibold text-slate-200">Verified alumni employer and job title badges</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">✓</span>
                <span className="text-xs font-semibold text-slate-200">Zero spam, authenticated 1-to-1 mentorship requests</span>
              </div>
            </div>
          </div>

          {/* Verification Badges Showcase */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
                <span className="text-3xl mb-2 block">🎓</span>
                <h4 className="text-xs font-bold text-emerald-300">College Verified</h4>
                <p className="text-[10px] text-slate-400 mt-1">Confirmed student/alumni status</p>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 text-center">
                <span className="text-3xl mb-2 block">💼</span>
                <h4 className="text-xs font-bold text-blue-300">Company Verified</h4>
                <p className="text-[10px] text-slate-400 mt-1">Authentic industry role</p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 text-center">
                <span className="text-3xl mb-2 block">🏆</span>
                <h4 className="text-xs font-bold text-purple-300">Achievement Verified</h4>
                <p className="text-[10px] text-slate-400 mt-1">Validated CGPA & projects</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 text-center">
                <span className="text-3xl mb-2 block">🚀</span>
                <h4 className="text-xs font-bold text-cyan-300">Referral Verified</h4>
                <p className="text-[10px] text-slate-400 mt-1">Vetted mentor endorsement</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          11. HACKATHON MATCHING SECTION
          ========================================================================= */}
      <section id="hackathons" className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
              Team Matchmaking
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Build better teams. <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Build together.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Find teammates with complementary skills for hackathons and technical competitions across colleges.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-300">Frontend</span>
              <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-300">Backend</span>
              <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300">AI / ML</span>
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">UI / UX</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleAction('hackathons', 'STUDENT')}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                Find Teammates Now →
              </button>
            </div>
          </div>

          {/* Hackathon Preview Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400">Smart India Hackathon 2025</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  Open Slot
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-bold text-white">Team: CyberSentinels</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Building AI-driven campus energy optimization system.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400">Team Size:</span>
                    <p className="font-bold text-white">3 / 4 Members</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400">Looking For:</span>
                    <p className="font-bold text-cyan-400">AI / ML Engineer & UI/UX</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Location: Kolkata / Hybrid</span>
                  <span className="text-emerald-400 font-semibold">✓ Verified IEM Students</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          12. REFERRAL + RECRUITER SECTION
          ========================================================================= */}
      <section id="referrals" className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: From Mentorship to Opportunity */}
          <div className="lg:col-span-5 space-y-4">
            <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-bold text-purple-400">
              Direct Referral Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              From mentorship to opportunity.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When students perform well in mentorship sessions, verified alumni can provide high-trust referrals directly to hiring recruiters.
            </p>

            <div className="space-y-3 pt-3">
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
                <span className="text-lg">1️⃣</span>
                <span className="text-xs font-semibold text-slate-200">1-on-1 Mentorship & Code Review</span>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
                <span className="text-lg">2️⃣</span>
                <span className="text-xs font-semibold text-slate-200">Alumni Endorsement & Referral Generation</span>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
                <span className="text-lg">3️⃣</span>
                <span className="text-xs font-semibold text-slate-200">Priority Recruiter Review & Fast-Track Interview</span>
              </div>
            </div>
          </div>

          {/* Right: Recruiter Dashboard Preview */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-purple-500/30 bg-slate-950 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-purple-400">Recruiter Candidate Discovery</span>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                  Priority Shortlist
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sayan&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4"
                  alt="Candidate"
                  className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-800"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Sayan Das</h4>
                    <span className="text-xs text-emerald-400 font-bold">✓ Verified Student</span>
                  </div>
                  <p className="text-xs text-slate-400">B.Tech Computer Science • IEM (CGPA: 9.02)</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl border border-purple-500/20 bg-purple-950/20">
                <p className="text-xs font-bold text-purple-300">Alumni Referral Endorsement:</p>
                <p className="text-xs text-slate-300 mt-0.5 italic">
                  "Recommended by Rahul Sharma (Microsoft): Strong understanding of distributed databases and clean API design."
                </p>
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleAction('recruiter', 'RECRUITER')}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2"
                >
                  View Full Candidate Profile
                </button>
                <button
                  onClick={() => handleAction('recruiter', 'RECRUITER')}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 shadow-md"
                >
                  Schedule Interview →
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          13. STAKEHOLDER IMPACT MATRIX
          ========================================================================= */}
      <section id="impact" className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
            Comprehensive Value
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            One platform. Four stakeholders. Shared growth.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Every user receives tailored tools designed for measurable impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h3 className="text-base font-bold text-blue-400">Students</h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">✓ Deterministic AI mentor matching</li>
              <li className="flex items-center gap-2">✓ Verified alumni referrals</li>
              <li className="flex items-center gap-2">✓ Hackathon teammate formation</li>
              <li className="flex items-center gap-2">✓ Curated jobs & internships</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h3 className="text-base font-bold text-emerald-400">Alumni Mentors</h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">✓ Flexible 1-click scheduling</li>
              <li className="flex items-center gap-2">✓ Verified talent referral rewards</li>
              <li className="flex items-center gap-2">✓ Stay connected with alma mater</li>
              <li className="flex items-center gap-2">✓ Host campus tech webinars</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h3 className="text-base font-bold text-purple-400">Recruiters</h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">✓ College-verified student records</li>
              <li className="flex items-center gap-2">✓ Direct skill & GPA filters</li>
              <li className="flex items-center gap-2">✓ Alumni-endorsed candidates</li>
              <li className="flex items-center gap-2">✓ Zero recruiter verification delays</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h3 className="text-base font-bold text-amber-400">College Admins</h3>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">✓ Centralized alumni registry</li>
              <li className="flex items-center gap-2">✓ Student verification portal</li>
              <li className="flex items-center gap-2">✓ Real-time placement insights</li>
              <li className="flex items-center gap-2">✓ Comprehensive audit logger</li>
            </ul>
          </div>

        </div>
      </section>

      {/* =========================================================================
          14. TESTIMONIALS / DEMO STORIES
          ========================================================================= */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-bold text-slate-400">
            Demo Experience Stories
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            What users experience on BridgeUp.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Finding alumni who followed a similar career path from CS academics into backend systems made mentorship feel immediate and actionable."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Student1&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4"
                alt="Student"
                className="h-10 w-10 rounded-xl bg-slate-800"
              />
              <div>
                <h4 className="text-xs font-bold text-white">Aarav Sen</h4>
                <p className="text-[10px] text-slate-400">3rd Year Student • IEM Kolkata</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "BridgeUp gives alumni a structured, trusted way to stay connected with our college community without getting overwhelmed by unvetted DMs."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor1&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=ffd5dc"
                alt="Mentor"
                className="h-10 w-10 rounded-xl bg-slate-800"
              />
              <div>
                <h4 className="text-xs font-bold text-white">Rahul Sharma</h4>
                <p className="text-[10px] text-emerald-400 font-semibold">Backend Engineer @ Microsoft</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Verified profiles and referral context make candidate discovery much faster and significantly improve our technical interview pass rates."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter1&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=c0aede"
                alt="Recruiter"
                className="h-10 w-10 rounded-xl bg-slate-800"
              />
              <div>
                <h4 className="text-xs font-bold text-white">Vikram Malhotra</h4>
                <p className="text-[10px] text-purple-400 font-semibold">Senior Technical Recruiter</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          15. FINAL CALL TO ACTION WITH NETWORK ILLUSTRATION BACKGROUND
          ========================================================================= */}
      <section className="cta-network-banner relative rounded-3xl border border-blue-500/40 p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
        {/* Background Network Graphic */}
        <div 
          className="cta-network-bg absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 scale-105"
          style={{ backgroundImage: `url('/cta-network-bg.png')` }}
        />
        
        {/* Deep Contrast Frosted Vignette Overlay */}
        <div className="cta-network-overlay absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/80 to-slate-950/85 backdrop-blur-[1.5px]" />
        <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-1 text-xs font-bold text-blue-300 backdrop-blur-md shadow-sm">
            <span>🌐 Verified Campus & Alumni Network</span>
          </div>

          <h2 className="cta-banner-title text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Your next opportunity could start with one connection.
          </h2>
          
          <p className="cta-banner-desc text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl mx-auto font-normal drop-shadow">
            Join a verified network where students discover mentors, alumni create impact, and recruiters find trusted talent.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleAction('dashboard', 'STUDENT')}
              className="cta-btn-primary rounded-2xl bg-white text-slate-950 font-extrabold text-sm px-8 py-4 shadow-2xl hover:scale-105 hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <span>Get Started Free →</span>
            </button>

            <button
              onClick={() => handleDemoLaunch('STUDENT')}
              className="cta-btn-secondary rounded-2xl border border-white/40 bg-white/15 backdrop-blur-md text-white font-bold text-sm px-8 py-4 hover:bg-white/25 transition-all flex items-center gap-2 shadow-lg"
            >
              <span>⚡ Try Live Demo (1-Click)</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          16. FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 pt-12 pb-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-sm">
                ⚡
              </div>
              <span className="text-xl font-black text-white tracking-tight">Bridge<span className="text-cyan-400">Up</span></span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              People. Opportunities. Progress. The unified university & alumni engagement ecosystem.
            </p>
            <p className="text-[11px] text-slate-500">
              Built with Node.js, Express, React, Tailwind CSS, and Supabase.
            </p>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Product</p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#ai-matcher" className="hover:text-blue-400 transition-colors">AI Mentor Finder</a></li>
              <li><a href="#roles" className="hover:text-blue-400 transition-colors">Alumni Hub</a></li>
              <li><a href="#hackathons" className="hover:text-blue-400 transition-colors">Hackathons</a></li>
              <li><a href="#referrals" className="hover:text-blue-400 transition-colors">Referrals</a></li>
            </ul>
          </div>

          {/* Col 3: For Users */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">For Users</p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><button onClick={() => handleAction('dashboard', 'STUDENT')} className="hover:text-blue-400 transition-colors">Students</button></li>
              <li><button onClick={() => handleAction('alumni-dashboard', 'ALUMNI')} className="hover:text-blue-400 transition-colors">Alumni Mentors</button></li>
              <li><button onClick={() => handleAction('recruiter', 'RECRUITER')} className="hover:text-blue-400 transition-colors">Recruiters</button></li>
              <li><button onClick={() => handleAction('college-admin', 'COLLEGE_ADMIN')} className="hover:text-blue-400 transition-colors">Colleges</button></li>
            </ul>
          </div>

          {/* Col 4: Legal & Social */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Company & Trust</p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li><a href="#trust" className="hover:text-blue-400 transition-colors">Verification System</a></li>
              <li><a href="#impact" className="hover:text-blue-400 transition-colors">Impact Matrix</a></li>
              <li><span className="text-slate-500">SIH 2025 Submission</span></li>
              <li><span className="text-slate-500">Privacy & Terms</span></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 BridgeUp Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">LinkedIn</span>
            <span className="hover:text-slate-400 cursor-pointer">GitHub</span>
            <span className="hover:text-slate-400 cursor-pointer">YouTube</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default HomePage;
