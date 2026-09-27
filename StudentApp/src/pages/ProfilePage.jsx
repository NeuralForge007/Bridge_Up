import React, { useState, useEffect } from 'react';
import { useAuth, AVATAR_PRESETS } from '../context/AuthContext';

export const ProfilePage = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [major, setMajor] = useState(currentUser?.major || '');
  const [year, setYear] = useState(currentUser?.year || '');
  const [gpa, setGpa] = useState(currentUser?.gpa || '8.85');
  const [avatar, setAvatar] = useState(currentUser?.avatar || AVATAR_PRESETS[0]);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [company, setCompany] = useState(currentUser?.company || currentUser?.company_name || '');
  const [roleTitle, setRoleTitle] = useState(currentUser?.role_title || '');
  const [skillsInput, setSkillsInput] = useState(currentUser?.skills?.join(', ') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setMajor(currentUser.major || '');
      setYear(currentUser.year || '');
      setGpa(currentUser.gpa || '8.85');
      setAvatar(currentUser.avatar || AVATAR_PRESETS[0]);
      setBio(currentUser.bio || '');
      setCompany(currentUser.company || currentUser.company_name || '');
      setRoleTitle(currentUser.role_title || '');
      setSkillsInput(currentUser.skills?.join(', ') || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile({
      name,
      major,
      year,
      gpa: String(gpa),
      avatar,
      bio,
      company,
      role_title: roleTitle,
      skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean)
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Account & <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Profile Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your BridgeUp identity, choose among 16 professional cartoon avatars, and adjust academic credentials.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Profile changes successfully updated & synced!</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
        
        {/* User Badge Top Row */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800 mb-6">
          <img
            src={avatar || currentUser.avatar}
            alt=""
            className="h-20 w-20 rounded-2xl border-2 border-blue-400/40 bg-slate-800 shadow-xl"
          />
          <div>
            <h2 className="text-xl font-bold text-white">{name || currentUser.name}</h2>
            <p className="text-xs text-blue-400 font-semibold mt-0.5">
              {currentUser.role === 'STUDENT' ? (major || 'Computer Science') :
               currentUser.role === 'ALUMNI' ? (`${roleTitle} @ ${company}`) :
               currentUser.role === 'RECRUITER' ? (`Talent Partner @ ${company}`) :
               currentUser.role === 'COLLEGE_ADMIN' ? (`Admin @ ${currentUser.college_name}`) : 'Super Administrator'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                CGPA {gpa || '8.85'} / 10.0
              </span>
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                Role: {currentUser.role}
              </span>
              <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                Status: {currentUser.verification_status || 'VERIFIED'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Gallery (16 Styles) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">Choose Professional Cartoon Avatar (16 Styles)</label>
              <span className="text-[10px] text-slate-500">Click any avatar to select</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              {AVATAR_PRESETS.map((preset, idx) => {
                const isSelected = avatar === preset;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`relative rounded-xl p-1 transition-all hover:scale-105 ${
                      isSelected ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx + 1}`} className="h-10 w-10 rounded-lg mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Student Fields */}
          {currentUser.role === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Major / Branch</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option>Freshman (Year 1)</option>
                  <option>Sophomore (Year 2)</option>
                  <option>Junior (Year 3)</option>
                  <option>Senior (Year 4)</option>
                  <option>Master's / Ph.D.</option>
                </select>
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Alumni Fields */}
          {currentUser.role === 'ALUMNI' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Key Skills (Comma-separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="React, Python, Machine Learning, System Design"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Headline</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your interests, study goals, or mentorship focus..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-110"
            >
              Save Profile Updates 💾
            </button>
          </div>
        </form>
      </div>

      {/* Account Session & Sign Out Section */}
      <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-red-400">Account Session</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Currently authenticated as <span className="text-white font-medium">{currentUser.email}</span>. Click below to terminate your session.
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-900/40 px-5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-800/60 hover:text-white transition-all shadow-md shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out of BridgeUp</span>
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;
