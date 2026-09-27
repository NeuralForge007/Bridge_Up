import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AIMentorFinderPage = () => {
  const { currentUser } = useAuth();
  
  // Search & Match Parameters
  const [goal, setGoal] = useState('Land a Software Engineer role at Google / Meta and master Distributed Systems');
  const [domain, setDomain] = useState('Software Engineering');
  const [path, setPath] = useState('FAANG / Big Tech SDE');
  const [skills, setSkills] = useState(currentUser?.skills?.join(', ') || 'React, Python, Machine Learning, System Design');
  const [collegeId, setCollegeId] = useState('');

  // Results & State
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const handleAIMatch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setRequestSuccess('');
    try {
      const results = await apiService.aiMatchMentors({
        goal,
        domain,
        path,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        collegeId: collegeId || undefined,
        limit: 8
      });
      setMatches(results || []);
    } catch (err) {
      console.error('AI match failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAIMatch();
  }, []);

  const handleOpenRequest = (mentor) => {
    setSelectedMentor(mentor);
    setRequestNote(`Hi ${mentor.name}, I am deeply inspired by your career journey at ${mentor.company}. I'd love your mentorship on ${domain} and portfolio review!`);
    setRequestModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    try {
      await apiService.requestMentorship({
        alumniId: selectedMentor.id,
        mentorName: selectedMentor.name,
        company: selectedMentor.company,
        note: requestNote
      });
      setRequestSuccess(`Mentorship request successfully sent to ${selectedMentor.name}!`);
      setRequestModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to send mentorship request');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 mb-4">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            AI-Driven Deterministic Multi-Factor Matcher
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Find Your Ideal <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Alumni Mentor</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Our deterministic scoring engine analyzes Skill Overlap (35%), Career Goal Alignment (25%), Industry Domain (15%), Target Pathway (10%), Shared Alma Mater (10%), and Mentor Availability (5%) to calculate exact compatibility.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {requestSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{requestSuccess}</span>
          </div>
          <button onClick={() => setRequestSuccess('')} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* AI Search & Filter Bar */}
      <form onSubmit={handleAIMatch} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🎯 Target Career Goal / Objective</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master system design, crack Google SDE interviews, or transition to AI Research"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🏢 Target Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option>Software Engineering</option>
              <option>Data Science & AI</option>
              <option>Product Management</option>
              <option>Cybersecurity</option>
              <option>Quantitative Finance</option>
              <option>Biotech & Robotics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🛣️ Career Pathway</label>
            <select
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option>FAANG / Big Tech SDE</option>
              <option>High Growth Tech Startups</option>
              <option>AI / ML Researcher</option>
              <option>Product Leader</option>
              <option>Founder / Entrepreneur</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">⚡ Your Current Skills (Comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Python, Machine Learning, Go"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Matching via AI Engine...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Calculate AI Matches</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* AI Matches Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">Top Recommended Mentors</h3>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
              {matches.length} matches found
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => {
            const score = m.matchScore || 85;
            const scoreColor = score >= 90 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                               score >= 80 ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                               'text-amber-400 bg-amber-500/10 border-amber-500/20';

            return (
              <div
                key={m.id}
                className="group relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar & Match Score Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={m.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor'}
                        alt={m.name}
                        className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{m.name}</h4>
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                            {m.company || 'Tech Leader'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-300 mt-0.5">{m.role_title || m.title || 'Senior Software Engineer'}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>🎓 {m.college_name || 'Alumni'}</span>
                          {m.grad_year && <span>• Class of {m.grad_year}</span>}
                        </p>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div className={`shrink-0 rounded-2xl border px-3 py-1.5 text-center ${scoreColor}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider">AI Match</p>
                      <p className="text-lg font-black leading-none mt-0.5">{score}%</p>
                    </div>
                  </div>

                  {/* AI Explanation / Rationale */}
                  <div className="mt-4 rounded-2xl border border-blue-500/15 bg-blue-950/20 p-3.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px] mb-1">
                      <span>✨ Match Rationale:</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {m.matchRationale || `${m.name} has proven expertise in ${m.skills?.slice(0, 3).join(', ')} and matches your goal to pursue top engineering roles.`}
                    </p>
                    
                    {/* Breakdown Chips */}
                    {m.scoreBreakdown && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-blue-500/10 text-[10px] text-slate-400">
                        <span>Skills: {m.scoreBreakdown.skillsScore}/35</span>
                        <span>•</span>
                        <span>Goal: {m.scoreBreakdown.goalScore}/25</span>
                        <span>•</span>
                        <span>Domain: {m.scoreBreakdown.domainScore}/15</span>
                        <span>•</span>
                        <span>Alma Mater: {m.scoreBreakdown.collegeScore}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {m.bio && (
                    <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {m.bio}
                    </p>
                  )}

                  {/* Skills Tag Cloud */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(m.skills || ['Distributed Systems', 'System Design', 'Mentorship']).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-lg bg-slate-800/80 px-2 py-1 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{m.availability_hours_per_month || 4} hrs/mo available</span>
                  </div>
                  
                  <button
                    onClick={() => handleOpenRequest(m)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110 transition-all"
                  >
                    Request Mentorship ⚡
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mentorship Request Modal */}
      {requestModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Request Mentorship from <span className="text-blue-400">{selectedMentor.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedMentor.role_title} @ {selectedMentor.company}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Personalized Message / Discussion Agenda
              </label>
              <textarea
                rows={4}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Share your goals, what you are looking to learn, and specific questions..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRequestModalOpen(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIMentorFinderPage;
