import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { apiService } from '../services/api';
import { MessageSquare, Video, CheckCircle, Clock, XCircle, Send, User, Sparkles, ExternalLink } from 'lucide-react';

const AlumniDashboardPage = ({ setActivePage }) => {
  const { currentUser } = useAuth();
  const { conversations, sendMessage, startConversation } = useData ? useData() : {};
  const [requests, setRequests] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Chat Modal / Panel State
  const [activeChatStudent, setActiveChatStudent] = useState(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Submit Referral Modal State
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('Alex Rivera');
  const [studentEmail, setStudentEmail] = useState('alex.rivera@iem.edu.in');
  const [targetRole, setTargetRole] = useState('Software Engineer - University Grad 2026');
  const [referralNote, setReferralNote] = useState('Top performer in distributed systems, high GPA (9.2), excellent GitHub projects.');
  const [referralSuccess, setReferralSuccess] = useState('');

  const loadAlumniData = async () => {
    setLoading(true);
    try {
      const userIdentifier = currentUser?.id || currentUser?.user_id || currentUser?.alumni_id || currentUser?.email;
      const [reqs, refs] = await Promise.all([
        apiService.getMentorshipRequests(userIdentifier),
        apiService.getReferrals({ alumniId: userIdentifier })
      ]);
      setRequests(reqs || []);
      setReferrals(refs || []);
    } catch (err) {
      console.error('Failed to load alumni data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumniData();
    const interval = setInterval(loadAlumniData, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    const meetingLink = newStatus === 'ACCEPTED' ? 'https://meet.google.com/bridgeup-mentorship' : undefined;
    await apiService.updateMentorshipStatus(requestId, newStatus, meetingLink);
    await loadAlumniData();
  };

  const handleOpenChat = async (student) => {
    const studentPeer = {
      id: student.student_id || student.id,
      name: student.student_name || 'Student Mentee',
      avatar: student.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.student_name || 'student')}`
    };

    setActiveChatStudent(student);

    // Fetch or prepare conversation messages
    const convId = `conv-mentor-${student.student_id}-${currentUser?.id || currentUser?.alumni_id}`.replace(/[^a-zA-Z0-9-_]/g, '-');
    try {
      const allConvs = await apiService.getConversations(currentUser?.id);
      const found = (allConvs || []).find(c => c.id === convId || c.peerId === String(student.student_id));
      if (found && found.messages) {
        setChatMessages(found.messages);
      } else {
        setChatMessages([
          {
            id: 'init-1',
            sender: 'user',
            text: `Hi ${student.student_name}! I am excited to connect with you. Let me know your questions or when you are free to meet. Meeting Link: ${student.meeting_link || 'https://meet.google.com/bridgeup-mentorship'}`,
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
    if (!chatInputText.trim() || !activeChatStudent) return;

    const studentId = activeChatStudent.student_id || activeChatStudent.id;
    const alumniId = currentUser?.id || currentUser?.alumni_id || 'alm-1';
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
        senderId: alumniId,
        senderType: 'alumni',
        text: sentText,
        peerId: studentId,
        peerName: activeChatStudent.student_name,
        peerAvatar: activeChatStudent.student_avatar
      });
    } catch (e) {
      console.warn('Send chat message error:', e.message);
    }
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    try {
      await apiService.submitReferral({
        targetCompany: currentUser?.company || 'Google',
        roleTitle: targetRole,
        note: referralNote,
        studentName,
        studentEmail
      });
      setReferralSuccess(`Successfully submitted referral for ${studentName}!`);
      setReferralModalOpen(false);
      loadAlumniData();
    } catch (err) {
      alert(err.message || 'Failed to submit referral');
    }
  };

  const pendingRequests = requests.filter(r => (r.status || 'PENDING').toUpperCase() === 'PENDING' || (r.status || '').toUpperCase() === 'REQUESTED');
  const activeMentees = requests.filter(r => (r.status || '').toUpperCase() === 'ACCEPTED');

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni'}
            alt=""
            className="h-16 w-16 rounded-2xl border border-slate-700 bg-slate-800 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{currentUser?.name || currentUser?.display_name || 'Alumni Mentor'}</h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                Verified Mentor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser?.role_title || currentUser?.current_role || 'Staff Engineer'} @ <span className="text-blue-400 font-semibold">{currentUser?.company || 'Tech Leader'}</span> • {currentUser?.college_name || 'Institute of Engineering and Management'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {setActivePage && (
            <button
              onClick={() => setActivePage('messages')}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-all flex items-center gap-2"
            >
              <MessageSquare size={14} />
              <span>Campus Messages</span>
            </button>
          )}

          <button
            onClick={() => setReferralModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center gap-2"
          >
            <span>🚀 Refer a Student Candidate</span>
          </button>
        </div>
      </div>

      {referralSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{referralSuccess}</span>
          <button onClick={() => setReferralSuccess('')} className="text-emerald-300">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Incoming Mentorship Requests</p>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingRequests.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending your review & acceptance</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Active Mentees & Chat</p>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{activeMentees.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Direct communication channels active</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Referrals Submitted</p>
            <Sparkles size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 mt-1">{referrals.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Candidates referred to hiring teams</p>
        </div>
      </div>

      {/* 1. Incoming Mentorship Requests Queue */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Incoming Student Requests</h2>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              {pendingRequests.length} Waiting
            </span>
          </div>
          <button onClick={loadAlumniData} className="text-xs text-slate-400 hover:text-white transition-colors">
            🔄 Refresh
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <User size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No pending student requests right now.</p>
            <p className="text-xs text-slate-500 mt-1">When students request mentorship from the Mentor Directory or AI Matcher, they will appear here immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map((r) => (
              <div
                key={r.id || r.mentorship_id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={r.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.student_name || 'student')}`}
                    alt=""
                    className="h-13 w-13 rounded-2xl border border-slate-700 bg-slate-800 shrink-0 object-cover"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-base">{r.student_name || 'Alex Rivera'}</span>
                      <span className="text-xs text-slate-400">• {r.student_major || 'Computer Science'} ({r.student_college || 'Institute of Engineering and Management'})</span>
                      {r.student_gpa && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-slate-700">
                          GPA: {r.student_gpa}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900/90 rounded-xl p-3 border border-slate-800 leading-relaxed">
                      💬 <span className="font-semibold text-slate-200">"{r.notes || r.note || r.goal || 'Looking for technical guidance and interview prep.'}"</span>
                    </p>

                    {r.student_skills && Array.isArray(r.student_skills) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {r.student_skills.slice(0, 5).map((sk, idx) => (
                          <span key={idx} className="rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'ACCEPTED')}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Accept & Chat</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'DECLINED')}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1"
                  >
                    <XCircle size={14} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Active Mentees & Live Chat Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Active Mentees & Discussions</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {activeMentees.length} Active
            </span>
          </div>
        </div>

        {activeMentees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-500">No active mentees yet. Once you accept an incoming request, your direct chat channel and mentorship workspace will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMentees.map((mentee) => (
              <div
                key={mentee.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5 transition-all hover:border-blue-500/40 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentee.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentee.student_name || 'student')}`}
                        alt=""
                        className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-800 object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{mentee.student_name || 'Alex Rivera'}</h4>
                        <p className="text-xs text-slate-400">{mentee.student_major || 'Computer Science'}</p>
                        <p className="text-[11px] text-slate-500">{mentee.student_college || 'Institute of Engineering and Management'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      Active Mentee
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                    🎯 Goal: {mentee.goal || mentee.notes || 'Career guidance & mock technical interviews.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={mentee.meeting_link || 'https://meet.google.com/bridgeup-mentorship'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 font-semibold hover:text-blue-300"
                  >
                    <Video size={14} />
                    <span>Meet Link</span>
                    <ExternalLink size={10} />
                  </a>

                  <button
                    onClick={() => handleOpenChat(mentee)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>Chat with Student</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Referrals Pipeline Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">My Submitted Referrals</h2>
          <button
            onClick={() => setReferralModalOpen(true)}
            className="text-xs text-emerald-400 font-bold hover:underline"
          >
            + New Referral
          </button>
        </div>

        {referrals.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No referrals submitted yet. Click above to refer top-performing students directly.</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div
                key={ref.id || ref.referral_id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div>
                  <p className="text-sm font-bold text-white">{ref.student_name || 'Referred Candidate'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Role: {ref.role_title} @ {ref.target_company}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Note: {ref.referral_note}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
                    {ref.status}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(ref.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Interactive Student-Alumni Chat Modal */}
      {activeChatStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            {/* Chat Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeChatStudent.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeChatStudent.student_name || 'student')}`}
                  alt=""
                  className="h-10 w-10 rounded-xl border border-slate-700 object-cover"
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{activeChatStudent.student_name || 'Student Mentee'}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Mentorship Chat Channel • {activeChatStudent.student_major || 'Student'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeChatStudent.meeting_link || 'https://meet.google.com/bridgeup-mentorship'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/30 flex items-center gap-1"
                >
                  <Video size={13} />
                  <span>Google Meet</span>
                </a>
                <button
                  onClick={() => setActiveChatStudent(null)}
                  className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-950/60">
              {chatMessages.map((msg, index) => {
                const isMe = msg.sender === 'user' || msg.sender_type === 'alumni';
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

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2.5">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Message ${activeChatStudent.student_name || 'student'}...`}
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

      {/* Submit Referral Modal */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Submit Internal Student Referral</h3>
            <p className="text-xs text-slate-400 mt-1">Fast-track verified student into your company hiring pipeline.</p>

            <form onSubmit={handleSubmitReferral} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Candidate Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Opening / Role</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recommendation Note</label>
                <textarea
                  rows={3}
                  value={referralNote}
                  onChange={(e) => setReferralNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReferralModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Submit Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlumniDashboardPage;
