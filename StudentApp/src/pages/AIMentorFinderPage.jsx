import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AIMentorFinderPage = () => {
  const { currentUser } = useAuth();
  
  // Search & Match Parameters
  const [goal, setGoal] = useState('I want to become an AI Researcher at Google');
  const [domain, setDomain] = useState('AI/ML');
  const [path, setPath] = useState('AI / ML Researcher');
  const [skills, setSkills] = useState(currentUser?.skills?.join(', ') || 'Python, PyTorch, Deep Learning, NLP');
  const [collegeId, setCollegeId] = useState('');

  // Results & State
  const [matches, setMatches] = useState([]);
  const [exactMatchFound, setExactMatchFound] = useState(true);
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
      const response = await apiService.aiMatchMentors({
        goal,
        career_goal: goal,
        domain,
        career_domain: domain,
        path,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        collegeId: collegeId || undefined,
        college_id: collegeId || undefined,
        limit: 8
      });
      
      const resultsList = Array.isArray(response) ? response : (response?.matches || response?.mentors || []);
      setMatches(resultsList);
      if (response && response.exact_match_found !== undefined) {
        setExactMatchFound(response.exact_match_found);
      } else {
        setExactMatchFound(resultsList.some(m => (m.matchType || m.match_type) === 'EXACT'));
      }
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
      const userIdentifier = currentUser?.id || currentUser?.user_id || currentUser?.student_id || 'demo-1';
      await apiService.requestMentorship({
        student_id: userIdentifier,
        studentId: userIdentifier,
        studentName: currentUser?.name || currentUser?.displayName || 'Student Mentee',
        studentEmail: currentUser?.email || 'student@university.edu',
        studentAvatar: currentUser?.avatar,
        studentMajor: currentUser?.major || 'Computer Science',
        studentCollege: currentUser?.college_name || 'Institute of Engineering and Management',
        studentGpa: currentUser?.gpa || '3.85',
        studentSkills: currentUser?.skills || ['React', 'Python'],
        alumniId: selectedMentor.id || selectedMentor.alumni_id || selectedMentor.user_id,
        alumni_id: selectedMentor.id || selectedMentor.alumni_id || selectedMentor.user_id,
        mentorName: selectedMentor.name || selectedMentor.full_name,
        mentorCompany: selectedMentor.company,
        mentorAvatar: selectedMentor.avatar,
        goal: goal || 'AI Mentorship Program',
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
            Sentence-BERT & pgvector AI Recommender (all-MiniLM-L6-v2)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Find Your Career <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Alumni Mentor</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Our 2-Stage Hybrid Re-ranking Engine combines 384-dimensional Sentence-BERT semantic embeddings with structured role families, company alignment, and skill compatibility across 300+ verified alumni.
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🎯 Desired Career Goal / Destination</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I want to become an AI Researcher at Google or join DRDO as Cybersecurity Analyst"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🏫 College Network (Hard Filter)</label>
            <select
              value={collegeId || (currentUser?.college_id || 1)}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="1">Institute of Engineering and Management (IEM)</option>
              <option value="2">Jadavpur University (JU)</option>
              <option value="3">University of Calcutta (CU)</option>
              <option value="4">IIT Kharagpur (IIT KGP)</option>
              <option value="5">NIT Durgapur (NIT DGP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🏢 Target Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="AI/ML">AI / Machine Learning</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Data Science">Data Science</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Embedded Systems & Robotics">Embedded Systems & Robotics</option>
              <option value="Product Management">Product Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🛣️ Career Pathway</label>
            <select
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="AI / ML Researcher">AI / ML Researcher</option>
              <option value="FAANG / Big Tech SDE">FAANG / Big Tech SDE</option>
              <option value="Cybersecurity Specialist">Cybersecurity Specialist</option>
              <option value="Space & Defence Research">Space & Defence Research</option>
              <option value="Product Leader">Product Leader</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">⚡ Your Current Skills (Comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, PyTorch, Deep Learning, NLP"
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
                <span>Generating SBERT Matches...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Find Best Matched Mentors</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Fallback Notice if no Exact Match Found */}
      {!exactMatchFound && matches.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
          <span className="text-base">ℹ️</span>
          <div>
            <p className="font-bold">No exact verified alumni found for: "{goal}"</p>
            <p className="text-amber-200/80 mt-0.5">Showing closest career matches and relevant mentors from your college network below:</p>
          </div>
        </div>
      )}

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
            const score = m.match_score || m.matchScore || 85;
            const matchType = (m.match_type || m.matchType || (score >= 85 ? 'EXACT' : score >= 70 ? 'STRONG' : 'RELATED')).toUpperCase();
            
            const badgeStyles = matchType === 'EXACT' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
              : matchType === 'STRONG'
              ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
              : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';

            const badgeLabel = matchType === 'EXACT' ? '🎯 Exact Career Match' : matchType === 'STRONG' ? '⚡ Strong Match' : '🔍 Related Match';

            return (
              <div
                key={m.id || m.alumni_id}
                className="group relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar, Info & Match Score Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.alumni_id || 'Mentor'}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`}
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
                        <p className="text-xs font-medium text-slate-300 mt-0.5">{m.current_role || m.role_title || 'Senior Engineer'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>🎓 {m.college_name || 'Alumni Network'}</span>
                          {m.graduation_year && <span>• Class of {m.graduation_year}</span>}
                          {m.experience_years !== undefined && <span>• {m.experience_years} yrs exp</span>}
                        </p>
                      </div>
                    </div>

                    {/* AI Score & Match Type Badge */}
                    <div className="text-right shrink-0">
                      <span className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${badgeStyles}`}>
                        {badgeLabel}
                      </span>
                      <p className="text-xl font-black text-white leading-none">{score}%</p>
                    </div>
                  </div>

                  {/* Career Trajectory Path */}
                  {m.career_path && (
                    <div className="mt-3 rounded-xl bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="text-blue-400 font-bold shrink-0">🛣️ Trajectory:</span>
                      <span className="truncate">{m.career_path}</span>
                    </div>
                  )}

                  {/* Explainable Match Reasons */}
                  <div className="mt-3.5 rounded-2xl border border-blue-500/15 bg-blue-950/20 p-3.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px] mb-1.5">
                      <span>✨ Match Rationale:</span>
                    </div>
                    {m.reasons && m.reasons.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {m.reasons.map((r, rIdx) => (
                          <li key={rIdx} className="leading-tight flex items-start gap-1">
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="leading-relaxed text-slate-300 text-[11px]">
                        {m.matchRationale || `${m.name} has proven industry expertise in ${m.career_domain}.`}
                      </p>
                    )}
                  </div>

                  {/* Skills Cloud */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {(m.skills || []).slice(0, 6).map((skill, sIdx) => {
                      const isMatched = (m.matched_skills || []).some(ms => ms.toLowerCase() === skill.toLowerCase());
                      return (
                        <span
                          key={sIdx}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium border ${
                            isMatched
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-semibold'
                              : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                          }`}
                        >
                          {skill} {isMatched && '✓'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{m.availability || 'Available'}</span>
                    <span className="text-slate-600">•</span>
                    <span>⭐ {m.mentor_rating || m.rating || 4.8}/5.0</span>
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
              {selectedMentor.current_role || selectedMentor.role_title} @ {selectedMentor.company}
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
