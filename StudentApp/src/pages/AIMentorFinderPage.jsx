import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AIMentorFinderPage = () => {
  const { currentUser } = useAuth();
  
  // Search & Match Parameters
  const [goal, setGoal] = useState('I want to become an AI Researcher at Google');
  const [domain, setDomain] = useState('AI/ML');
  const [skills, setSkills] = useState(currentUser?.skills?.join(', ') || 'Python, PyTorch, Deep Learning, NLP');

  // Results & State
  const [matches, setMatches] = useState([]);
  const [exactMatchFound, setExactMatchFound] = useState(true);
  const [studentCollege, setStudentCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null); // { code, message, retryable }
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const collegeDisplayName = currentUser?.college_name || studentCollege?.name || 'Institute of Engineering and Management';

  const handleAIMatch = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorInfo(null);
    setRequestSuccess('');

    const controller = new AbortController();

    try {
      const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      const response = await apiService.aiMatchMentors({
        career_goal: goal,
        goal,
        career_domain: domain,
        domain,
        skills: skillsArray,
        student_id: currentUser?.student_id || currentUser?.id,
        college_id: currentUser?.college_id,
        limit: 8
      }, controller.signal);
      
      if (response && response.success) {
        const resultsList = response.matches || [];
        setMatches(resultsList);
        setExactMatchFound(Boolean(response.exact_match_found));
        if (response.student_college) {
          setStudentCollege(response.student_college);
        }
        setHasSearched(true);
      } else {
        setErrorInfo({
          code: response?.code || 'NO_MATCHES',
          message: response?.message || 'Failed to generate mentor recommendations.',
          retryable: true
        });
        setMatches([]);
      }
    } catch (err) {
      if (err.code === 'CANCELLED') return;
      console.error('AI mentor match failed:', err);
      
      let code = err.code || 'AI_SERVICE_UNAVAILABLE';
      let msg = err.message || 'The AI Alumni Mentor Matcher service (Sentence-BERT) is currently starting up or unavailable.';
      
      if (code === 'AI_SERVICE_WARMING' || msg.includes('loading') || msg.includes('preparing')) {
        code = 'AI_SERVICE_WARMING';
        msg = 'Recommendation model is preparing. Try again in a few moments.';
      }

      setErrorInfo({
        code,
        message: msg,
        retryable: err.retryable !== false
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync skills when currentUser changes without firing unrequested AI API requests
  useEffect(() => {
    if (currentUser?.skills && currentUser.skills.length > 0) {
      setSkills(currentUser.skills.join(', '));
    }
  }, [currentUser]);

  const handleOpenRequest = (mentor) => {
    setSelectedMentor(mentor);
    setRequestNote(`Hi ${mentor.name}, I am a student at ${collegeDisplayName}. I am deeply inspired by your journey at ${mentor.company} and would appreciate your mentorship on ${domain}!`);
    setRequestModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    try {
      await apiService.requestMentorship({
        alumni_id: selectedMentor.alumni_id || selectedMentor.id,
        goal: goal || 'Career Mentorship',
        note: requestNote,
        ai_match_score: selectedMentor.match_score
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
            Personalized alumni recommendations from your verified college network: <span className="font-bold text-blue-300">{collegeDisplayName}</span>. Matches are powered by 384-dimensional Sentence-BERT embeddings, pgvector retrieval, and adaptive multi-factor reranking.
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

      {/* Error / Service Notice Banner with Retry Action */}
      {errorInfo && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-base">{errorInfo.code === 'AI_SERVICE_WARMING' ? '⏳' : '⚠️'}</span>
            <div>
              <p className="font-bold">
                {errorInfo.code === 'AI_SERVICE_WARMING' ? 'Model Initializing' : 'Recommendation Service Notice'}
              </p>
              <p className="mt-0.5 text-rose-200/90">{errorInfo.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {errorInfo.retryable && (
              <button
                onClick={handleAIMatch}
                disabled={loading}
                className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-[11px] font-bold text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
              >
                {loading ? 'Retrying...' : 'Retry Search 🔄'}
              </button>
            )}
            <button onClick={() => setErrorInfo(null)} className="text-rose-300 hover:text-white ml-1">✕</button>
          </div>
        </div>
      )}

      {/* AI Search & Filter Bar */}
      <form onSubmit={handleAIMatch} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🎯 Desired Career Goal / Target Role & Company</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I want to become an AI Researcher at Google"
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">🏫 College Network (Hard Filter)</label>
            <div className="w-full rounded-xl border border-blue-500/30 bg-blue-950/40 px-4 py-2.5 text-xs font-semibold text-blue-300 truncate">
              🎓 {collegeDisplayName}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">⚡ Your Current Skills (Comma-separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, PyTorch, Deep Learning, SQL"
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
                  <span>Find Best Mentors</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Notice if no Exact Match Found */}
      {!exactMatchFound && matches.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
          <span className="text-base">ℹ️</span>
          <div>
            <p className="font-bold">No exact verified alumni match found for: "{goal}"</p>
            <p className="text-amber-200/80 mt-0.5">Showing closest career matches and strong alumni mentors from your college network (<span className="font-semibold">{collegeDisplayName}</span>) below:</p>
          </div>
        </div>
      )}

      {/* AI Matches Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">Recommended Alumni Mentors</h3>
            {matches.length > 0 && (
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                {matches.length} same-college alumni
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-3 w-48 bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="h-12 bg-slate-800/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            {hasSearched ? (
              <>
                <p className="text-sm font-semibold text-slate-300">No alumni mentors found for this search.</p>
                <p className="text-xs text-slate-500 mt-1">Try expanding your target skills or exploring different career domains.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-300">Ready to discover alumni mentors.</p>
                <p className="text-xs text-slate-500 mt-1">Click <span className="text-blue-400 font-semibold">"Find Best Mentors"</span> above to generate real-time Sentence-BERT recommendations from <span className="text-slate-300">{collegeDisplayName}</span>.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => {
              const score = typeof m.match_score === 'number' ? m.match_score.toFixed(1) : m.match_score;
              const matchType = (m.match_type || 'STRONG').toUpperCase();
              
              const badgeStyles = matchType === 'EXACT' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : matchType === 'STRONG'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';

              const badgeLabel = matchType === 'EXACT' ? '🎯 Exact Career Match' : matchType === 'STRONG' ? '⚡ Strong Match' : '🔍 Related Match';

              return (
                <div
                  key={m.alumni_id || m.id}
                  className="group relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar, Info & Match Score Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.alumni_id}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`}
                          alt={m.name}
                          className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{m.name}</h4>
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                              {m.company}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-300 mt-0.5">{m.current_role}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>🎓 {m.college_name}</span>
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

                    {/* Explainable Match Reasons */}
                    <div className="mt-3.5 rounded-2xl border border-blue-500/15 bg-blue-950/20 p-3.5 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px] mb-1.5">
                        <span>✨ Match Rationale:</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {(m.reasons || []).map((r, rIdx) => (
                          <li key={rIdx} className="leading-tight flex items-start gap-1.5">
                            <span className="text-blue-400">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Skills Cloud */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {(m.matched_skills || []).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded-lg px-2 py-0.5 text-[10px] font-semibold border bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        >
                          {skill} ✓
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{m.availability || 'Available'}</span>
                      <span className="text-slate-600">•</span>
                      <span>⭐ {m.mentor_rating || 4.8}/5.0</span>
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
        )}
      </div>

      {/* Mentorship Request Modal */}
      {requestModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Request Mentorship from <span className="text-blue-400">{selectedMentor.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedMentor.current_role} @ {selectedMentor.company} ({selectedMentor.college_name})
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Personalized Message / Discussion Agenda
              </label>
              <textarea
                rows={4}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Share your goals, questions about target roles/companies, and discussion topics..."
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
