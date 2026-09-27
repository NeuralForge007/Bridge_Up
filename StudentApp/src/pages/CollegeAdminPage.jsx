import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const CollegeAdminPage = () => {
  const { currentUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'alumni' | 'events'
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerCompany, setSpeakerCompany] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, stuList, almList] = await Promise.all([
        apiService.getCollegeDashboard(),
        apiService.getPendingStudents(),
        apiService.getPendingAlumni()
      ]);
      setDashboard(dash || null);
      setPendingStudents(stuList || []);
      setPendingAlumni(almList || []);
    } catch (err) {
      console.error('Failed to load college admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleVerifyStudent = async (studentId, status) => {
    await apiService.verifyStudent(studentId, status);
    loadData();
  };

  const handleVerifyAlumni = async (alumniId, status) => {
    await apiService.verifyAlumni(alumniId, status);
    loadData();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await apiService.createEvent({
        title: eventTitle,
        description: eventDescription,
        speakerName,
        speakerCompany,
        eventType: 'WEBINAR'
      });
      setEventSuccess('Campus webinar successfully scheduled!');
      setEventTitle('');
      setEventDescription('');
      setSpeakerName('');
      setSpeakerCompany('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{currentUser?.college_name || 'Stanford University'}</h1>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                Administration Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Admin: {currentUser?.name || 'Dean of Student Affairs'} • Institutional Verification & Alumni Network Oversight
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Total Enrolled Students</p>
          <p className="text-2xl font-black text-white mt-1">{dashboard?.metrics?.totalStudents || 840}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Verified Alumni Network</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{dashboard?.metrics?.verifiedAlumni || 320}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Student Verifications Queue</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingStudents.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold text-slate-400">Alumni Claims Queue</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{pendingAlumni.length}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'students'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎓 Pending Students ({pendingStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('alumni')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'alumni'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💼 Pending Alumni ({pendingAlumni.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'events'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📅 Schedule Campus Event
        </button>
      </div>

      {/* Tab 1: Student Verification Queue */}
      {activeTab === 'students' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-base font-bold text-white mb-4">Student Enrollment & Credential Verification Queue</h2>
          {pendingStudents.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">All registered students for this college are currently verified ✓</p>
          ) : (
            <div className="space-y-3">
              {pendingStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student'}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.major} • {s.year}</p>
                      <p className="text-[11px] text-slate-500">Email: {s.email} | GPA: {s.gpa || '8.80'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyStudent(s.id, 'VERIFIED')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleVerifyStudent(s.id, 'REJECTED')}
                      className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Alumni Verification Queue */}
      {activeTab === 'alumni' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-base font-bold text-white mb-4">Alumni Degree & Graduation Claim Verifications</h2>
          {pendingAlumni.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No pending alumni verification claims at this moment.</p>
          ) : (
            <div className="space-y-3">
              {pendingAlumni.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={a.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni'}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{a.name}</p>
                      <p className="text-xs text-slate-400">{a.role_title} @ {a.company}</p>
                      <p className="text-[11px] text-slate-500">Degree: {a.degree || 'B.S. Computer Science'} (Grad {a.grad_year || 2020})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyAlumni(a.id, 'VERIFIED')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      ✓ Verify Alumni
                    </button>
                    <button
                      onClick={() => handleVerifyAlumni(a.id, 'REJECTED')}
                      className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Schedule Event */}
      {activeTab === 'events' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 max-w-2xl">
          <h2 className="text-base font-bold text-white mb-2">Publish Campus Webinar or Alumni Workshop</h2>
          <p className="text-xs text-slate-400 mb-5">Broadcast event to all university students and verified alumni.</p>

          {eventSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              {eventSuccess}
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Session Title</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Breaking into AI Research & Engineering at OpenAI"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Key Takeaways</label>
              <textarea
                rows={3}
                required
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Detailed session agenda, pre-requisites, and topics..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Speaker Name</label>
                <input
                  type="text"
                  required
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="e.g. Vikram Sethi"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Speaker Company</label>
                <input
                  type="text"
                  required
                  value={speakerCompany}
                  onChange={(e) => setSpeakerCompany(e.target.value)}
                  placeholder="e.g. Google Cloud"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110"
            >
              Publish Campus Event 📅
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default CollegeAdminPage;
