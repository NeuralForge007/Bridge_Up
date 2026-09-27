import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AlumniDashboardPage = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Referral Modal State
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('Alex Rivera');
  const [studentEmail, setStudentEmail] = useState('alex.rivera@stanford.edu');
  const [targetRole, setTargetRole] = useState('Software Engineer - University Grad 2026');
  const [referralNote, setReferralNote] = useState('Top performer in distributed systems, high GPA (9.2), excellent GitHub projects.');
  const [referralSuccess, setReferralSuccess] = useState('');

  const loadAlumniData = async () => {
    setLoading(true);
    try {
      const [reqs, refs] = await Promise.all([
        apiService.getMentorshipRequests(currentUser?.id),
        apiService.getReferrals({ alumniId: currentUser?.id })
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
  }, [currentUser]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    const meetingLink = newStatus === 'ACCEPTED' ? 'https://meet.google.com/bridgeup-mentorship' : undefined;
    await apiService.updateMentorshipStatus(requestId, newStatus, meetingLink);
    loadAlumniData();
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni'}
            alt=""
            className="h-16 w-16 rounded-2xl border border-slate-700 bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{currentUser?.name || 'Alumni Mentor'}</h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                Alumni / Mentor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser?.role_title || 'Engineer'} @ {currentUser?.company || 'Tech Leader'} • {currentUser?.college_name || 'Stanford University'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setReferralModalOpen(true)}
          className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span>🚀 Refer a Student to {currentUser?.company || 'My Company'}</span>
        </button>
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
          <p className="text-xs font-semibold text-slate-400">Incoming Mentorship Requests</p>
          <p className="text-2xl font-black text-white mt-1">{requests.filter(r => r.status === 'PENDING').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Active Mentees</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{requests.filter(r => r.status === 'ACCEPTED').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Referrals Submitted</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{referrals.length}</p>
        </div>
      </div>

      {/* Mentorship Requests Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Incoming Mentorship Requests</h2>
        {requests.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No incoming requests right now.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{r.student_name || 'Alex Rivera'}</span>
                    <span className="text-[11px] text-slate-400">• {r.student_college || 'Stanford University'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      r.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      r.status === 'DECLINED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{r.note || 'Looking for interview prep and resume feedback.'}</p>
                  {r.meeting_link && (
                    <a
                      href={r.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold mt-2 hover:underline"
                    >
                      <span>📹 Join Google Meet Session</span>
                    </a>
                  )}
                </div>

                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'ACCEPTED')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20"
                    >
                      Accept & Meet
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'DECLINED')}
                      className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals Pipeline Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-bold text-white mb-4">My Submitted Referrals</h2>
        {referrals.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No referrals submitted yet. Click the button above to refer talented students.</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div
                key={ref.id}
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
                    {new Date(ref.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
