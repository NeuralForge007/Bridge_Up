import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export const AlumniMentorsPage = () => {
  const { currentUser } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'requests'
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Request Modal State
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [topic, setTopic] = useState('Career Guidance & Technical Mentorship');
  const [proposedDate, setProposedDate] = useState('2026-10-15');
  const [note, setNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // User Requests List State
  const [userRequests, setUserRequests] = useState([]);

  const companies = ['All', 'Google', 'Meta', 'Tesla', 'Microsoft', 'Amazon', 'Apple', 'Stripe'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [mentorData, reqData] = await Promise.all([
        apiService.getMentors({
          company: selectedCompany === 'All' ? undefined : selectedCompany,
          search: searchQuery || undefined
        }),
        apiService.getMentorshipRequests(currentUser?.id)
      ]);
      setMentors(mentorData || []);
      setUserRequests(reqData || []);
    } catch (err) {
      console.error('Failed to load mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, searchQuery, currentUser]);

  const handleOpenModal = (mentor) => {
    setSelectedMentor(mentor);
    setTopic('Career Guidance & Technical Mentorship');
    setNote(`Hi ${mentor.name || 'Mentor'}, I'd love to connect with you for mentorship on system design, interview preparation, and career guidance.`);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      await apiService.requestMentorship({
        alumniId: selectedMentor.id || selectedMentor.alumni_id,
        mentorName: selectedMentor.name,
        company: selectedMentor.company,
        note
      });

      setRequestSuccess(true);
      setTimeout(() => {
        setRequestSuccess(false);
        setSelectedMentor(null);
        setNote('');
        loadData();
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit mentorship request');
    }
  };

  const filteredMentors = mentors.filter(m => {
    const name = m.name || m.full_name || '';
    const comp = m.company || '';
    const skills = Array.isArray(m.skills) ? m.skills : [];

    const matchesCompany = selectedCompany === 'All' || comp.toLowerCase().includes(selectedCompany.toLowerCase());
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCompany && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 mb-2">
            <span>🎓 Verified Alumni Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Alumni Mentors & Career Advisors
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Connect directly with verified graduates working across FAANG, Fortune 500, and high-growth tech firms.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            👥 Mentor Directory
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            📅 My Sessions ({userRequests.length})
          </button>
        </div>
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Search & Filter Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by mentor name, company (Google, Meta), or skills (System Design, Python)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {companies.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCompany(c)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      selectedCompany === c
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMentors.map(mentor => {
              const name = mentor.name || mentor.full_name || 'Alumni Mentor';
              const company = mentor.company || 'Tech Leader';
              const roleTitle = mentor.role_title || mentor.jobTitle || mentor.current_role || 'Software Engineer';
              const skills = Array.isArray(mentor.skills) ? mentor.skills : ['System Design', 'Python', 'Leadership'];

              return (
                <div
                  key={mentor.id || mentor.alumni_id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all hover:border-blue-500/40 hover:bg-slate-900/90 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar & Company Info */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={mentor.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor'}
                          alt={name}
                          className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{name}</h3>
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              ✓ Verified Alumni
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-blue-400 mt-0.5">{roleTitle} @ {company}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            🎓 {mentor.college_name || 'Stanford University'} {mentor.gradYear || mentor.grad_year ? `• Class of ${mentor.gradYear || mentor.grad_year}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          ⭐ {mentor.rating || mentor.mentor_rating || '4.9'}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      "{mentor.bio || `Tech mentor at ${company}. Passionate about helping students crack technical interviews and build scalable architectures.`}"
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating & Action Row */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-2">
                    <span className="text-[11px] text-slate-400">
                      ⏱️ {mentor.availability || mentor.availability_hours_per_month ? `${mentor.availability_hours_per_month || 4} hrs/mo` : 'Open for 1-on-1 Sessions'}
                    </span>

                    <button
                      onClick={() => handleOpenModal(mentor)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all"
                    >
                      Request Session ⚡
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-base font-bold text-white mb-4">Your Mentorship Sessions & Requests</h3>

          {userRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No session requests sent yet.</p>
          ) : (
            <div className="space-y-3">
              {userRequests.map((req, idx) => (
                <div
                  key={req.id || idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Session with {req.mentor_name || req.mentorName || 'Alumni Mentor'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        req.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        req.status === 'DECLINED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {req.status || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-400 font-semibold mt-1">Topic: {req.goal || req.topic || 'Career Mentorship'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Note: "{req.note || req.notes || 'Looking for technical guidance.'}"</p>
                    {req.meeting_link && (
                      <a
                        href={req.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-2 hover:underline"
                      >
                        <span>📹 Join Google Meet Session</span>
                      </a>
                    )}
                  </div>

                  <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                    45 Min 1-on-1 Session
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Mentorship Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Request Mentorship from <span className="text-blue-400">{selectedMentor.name || selectedMentor.full_name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedMentor.role_title || selectedMentor.jobTitle || 'Engineer'} @ {selectedMentor.company}
            </p>

            {requestSuccess ? (
              <div className="py-8 text-center text-emerald-400">
                <p className="text-lg font-bold">Request Sent Successfully!</p>
                <p className="text-xs text-slate-400 mt-1">The alumni mentor has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Focus Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Note & Goals</label>
                  <textarea
                    rows={4}
                    required
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AlumniMentorsPage;
