import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { MessageSquare, Video, ExternalLink, Send, CheckCircle } from 'lucide-react';

export const AlumniMentorsPage = ({ setActivePage }) => {
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

  // Active Chat Modal State
  const [activeChatMentor, setActiveChatMentor] = useState(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const companies = ['All', 'Google', 'Meta', 'Tesla', 'Microsoft', 'Amazon', 'Apple', 'Stripe'];

  const loadData = async () => {
    setLoading(true);
    try {
      const userIdentifier = currentUser?.id || currentUser?.user_id || currentUser?.student_id || currentUser?.email;
      const [mentorData, reqData] = await Promise.all([
        apiService.getMentors({
          company: selectedCompany === 'All' ? undefined : selectedCompany,
          search: searchQuery || undefined
        }),
        apiService.getMentorshipRequests(userIdentifier)
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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
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
      const userIdentifier = currentUser?.id || currentUser?.user_id || currentUser?.student_id || 'demo-1';
      await apiService.requestMentorship({
        student_id: userIdentifier,
        studentId: userIdentifier,
        studentName: currentUser?.name || currentUser?.displayName || 'Student Mentee',
        studentEmail: currentUser?.email || 'student@university.edu',
        studentAvatar: currentUser?.avatar,
        studentMajor: currentUser?.major || 'Computer Science',
        studentCollege: currentUser?.college_name || 'Stanford University',
        studentGpa: currentUser?.gpa || '3.85',
        studentSkills: currentUser?.skills || ['React', 'Python'],
        alumniId: selectedMentor.id || selectedMentor.alumni_id || selectedMentor.user_id,
        alumni_id: selectedMentor.id || selectedMentor.alumni_id || selectedMentor.user_id,
        mentorName: selectedMentor.name || selectedMentor.full_name,
        mentorCompany: selectedMentor.company,
        mentorAvatar: selectedMentor.avatar,
        goal: topic,
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

  const handleOpenChatWithMentor = async (req) => {
    setActiveChatMentor(req);
    const convId = `conv-mentor-${currentUser?.id || 'demo-1'}-${req.alumni_id}`.replace(/[^a-zA-Z0-9-_]/g, '-');
    try {
      const allConvs = await apiService.getConversations(currentUser?.id);
      const found = (allConvs || []).find(c => c.id === convId || c.peerId === String(req.alumni_id));
      if (found && found.messages) {
        setChatMessages(found.messages);
      } else {
        setChatMessages([
          {
            id: 'init-1',
            sender: 'peer',
            text: `Hi ${currentUser?.name || 'Student'}! I have accepted your mentorship request. Feel free to ask questions here or join via Google Meet. Link: ${req.meeting_link || 'https://meet.google.com/bridgeup-mentorship'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (e) {
      setChatMessages([]);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatMentor) return;

    const studentId = currentUser?.id || 'demo-1';
    const alumniId = activeChatMentor.alumni_id;
    const convId = `conv-mentor-${studentId}-${alumniId}`.replace(/[^a-zA-Z0-9-_]/g, '-');

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: chatInputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    const sentText = chatInputText.trim();
    setChatInputText('');

    try {
      await apiService.sendMessage({
        conversationId: convId,
        senderId: studentId,
        senderType: 'user',
        text: sentText,
        peerId: alumniId,
        peerName: activeChatMentor.mentor_name,
        peerAvatar: activeChatMentor.mentor_avatar
      });
    } catch (e) {
      console.warn('Send chat message error:', e.message);
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

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <>
          {/* Company Chips Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {companies.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCompany(c)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCompany === c
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {c === 'All' ? '🏢 All Companies' : c}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by mentor name, company, or skills (e.g. Distributed Systems, Python, Meta)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none backdrop-blur-xl"
            />
          </div>

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => {
              const skills = Array.isArray(mentor.skills) ? mentor.skills : [];
              return (
                <div
                  key={mentor.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between transition-all hover:border-blue-500/40 hover:bg-slate-900/90 shadow-xl"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      <img
                        src={mentor.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor'}
                        alt=""
                        className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-800 object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-white text-base">{mentor.name || mentor.full_name}</h3>
                        <p className="text-xs font-semibold text-blue-400">{mentor.role_title || mentor.current_role || 'Senior Engineer'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">🏢 {mentor.company || 'Tech Leader'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3.5 line-clamp-2 leading-relaxed">
                      {mentor.bio || `Specializing in ${skills.slice(0, 3).join(', ')}. Passionate about mentoring students.`}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {skills.slice(0, 4).map((sk, idx) => (
                        <span key={idx} className="rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Available
                    </span>
                    <button
                      onClick={() => handleOpenModal(mentor)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25"
                    >
                      Book 1-on-1 Session ⚡
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Requests / My Sessions Tab */}
      {activeTab === 'requests' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7">
          <h3 className="text-base font-bold text-white mb-4">Your Mentorship Sessions & Requests</h3>

          {userRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No session requests sent yet.</p>
          ) : (
            <div className="space-y-4">
              {userRequests.map((req, idx) => {
                const isAccepted = req.status === 'ACCEPTED';
                return (
                  <div
                    key={req.id || idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">Mentor: {req.mentor_name || 'Alumni Mentor'}</span>
                        <span className="text-xs text-slate-400">• {req.mentor_company || 'Tech Leader'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isAccepted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          req.status === 'DECLINED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {req.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-400 font-semibold mt-1">Goal: {req.goal || req.topic || 'Career Mentorship'}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Note: "{req.notes || req.note || 'Looking for technical guidance.'}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAccepted && (
                        <>
                          {req.meeting_link && (
                            <a
                              href={req.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 flex items-center gap-1.5"
                            >
                              <Video size={13} />
                              <span>Meet Link</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenChatWithMentor(req)}
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110 flex items-center gap-1.5"
                          >
                            <MessageSquare size={13} />
                            <span>Chat with Mentor</span>
                          </button>
                        </>
                      )}
                      {!isAccepted && (
                        <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                          Waiting for Mentor Review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Student-Mentor Interactive Chat Modal */}
      {activeChatMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeChatMentor.mentor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeChatMentor.mentor_name || 'mentor')}`}
                  alt=""
                  className="h-10 w-10 rounded-xl border border-slate-700 object-cover"
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{activeChatMentor.mentor_name || 'Alumni Mentor'}</h3>
                  <p className="text-[11px] text-blue-400 font-semibold">{activeChatMentor.mentor_company || 'Tech Leader'} • Mentorship Channel</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeChatMentor.meeting_link || 'https://meet.google.com/bridgeup-mentorship'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/30 flex items-center gap-1"
                >
                  <Video size={13} />
                  <span>Google Meet</span>
                </a>
                <button
                  onClick={() => setActiveChatMentor(null)}
                  className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-950/60">
              {chatMessages.map((msg, index) => {
                const isMe = msg.sender === 'user' || msg.sender_type === 'user' || msg.sender_type === 'student';
                return (
                  <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-500/20'
                          : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp || 'Just now'}</span>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2.5">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Ask ${activeChatMentor.mentor_name || 'mentor'} a question...`}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-500 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </form>
          </div>
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
                <CheckCircle size={36} className="mx-auto mb-2" />
                <p className="text-lg font-bold">Request Sent Successfully!</p>
                <p className="text-xs text-slate-400 mt-1">The alumni mentor has been notified in their dashboard.</p>
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
