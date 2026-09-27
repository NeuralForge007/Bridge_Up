import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const HackathonsPage = () => {
  const { currentUser } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'teams'
  const [loading, setLoading] = useState(true);

  // Post Teammate Request State
  const [postTeamModal, setPostTeamModal] = useState(false);
  const [desiredRole, setDesiredRole] = useState('Frontend / Full Stack Engineer');
  const [desiredSkills, setDesiredSkills] = useState('React, Tailwind CSS, WebSockets');
  const [teamPitch, setTeamPitch] = useState('Building an AI-driven real-time collaboration tool for university labs. Need a frontend builder!');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadHackathons = async () => {
    setLoading(true);
    try {
      const list = await apiService.getHackathons();
      setHackathons(list || []);
      if (list && list.length > 0) {
        setSelectedHackathon(list[0]);
        const partners = await apiService.getHackathonPartners(list[0].id);
        setPartnerRequests(partners || []);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  const handleSelectHackathon = async (h) => {
    setSelectedHackathon(h);
    const partners = await apiService.getHackathonPartners(h.id);
    setPartnerRequests(partners || []);
  };

  const handleRegister = async (hackathonId) => {
    try {
      await apiService.registerForHackathon(hackathonId, {
        teamName: `${currentUser?.name || 'Student'}'s Team`,
        projectTitle: 'Autonomous AI Assistant',
        role: 'Full Stack Engineer'
      });
      setActionSuccess('Successfully registered for hackathon!');
      loadHackathons();
    } catch (err) {
      alert(err.message || 'Registration completed!');
    }
  };

  const handlePostTeammate = async (e) => {
    e.preventDefault();
    if (!selectedHackathon) return;
    try {
      await apiService.postHackathonPartnerRequest(selectedHackathon.id, {
        desiredRole,
        desiredSkills: desiredSkills.split(',').map(s => s.trim()),
        pitch: teamPitch
      });
      setActionSuccess('Partner request successfully published to teammate board!');
      setPostTeamModal(false);
      const partners = await apiService.getHackathonPartners(selectedHackathon.id);
      setPartnerRequests(partners || []);
    } catch (err) {
      alert(err.message || 'Failed to post partner request');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 mb-2">
            <span>🏆 Hackathon Arena & Teammate Matcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Compete, Build & Find Hackathon Partners
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Form teams with verified peers, showcase projects, win cash prizes & gain recruiter recognition.
          </p>
        </div>

        <button
          onClick={() => setPostTeamModal(true)}
          className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all shrink-0"
        >
          + Post Teammate Request 👥
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-300">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'browse'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏆 All Hackathons ({hackathons.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'teams'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 Teammate Matcher Board ({partnerRequests.length})
        </button>
      </div>

      {/* Hackathons Grid */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => (
            <div
              key={h.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all hover:border-amber-500/40 hover:bg-slate-900/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                    {h.status || 'UPCOMING'}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    🎁 {h.prize_pool || '$25,000 in Prizes'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{h.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Organized by {h.organizer || 'BridgeUp Tech Network'}</p>

                <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {h.description || 'Build cutting-edge decentralized or AI-powered solutions to solve critical challenges.'}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1">
                  {(h.tags || ['AI / ML', 'Web3', 'Open Innovation']).map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                <span className="text-[10px] text-slate-400">
                  👥 {h.participantsCount || 150} Registered
                </span>
                <button
                  onClick={() => handleRegister(h.id)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-500 transition-all"
                >
                  Register ⚡
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teammate Matcher Board */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">
              Currently viewing teammate requests for: <span className="text-amber-400 font-bold">{selectedHackathon?.title}</span>
            </span>
            <button
              onClick={() => setPostTeamModal(true)}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              + Create Teammate Request
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerRequests.map((pr) => (
              <div
                key={pr.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={pr.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teammate'}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{pr.student_name || 'Student'}</h4>
                      <p className="text-xs text-slate-400">{pr.student_college || 'Institute of Engineering and Management'}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-amber-400">Seeking: {pr.desired_role}</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{pr.pitch}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(pr.desired_skills || ['React', 'Python']).map((sk, idx) => (
                      <span key={idx} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3 flex justify-end">
                  <a
                    href="mailto:partner@university.edu"
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    💬 Connect & Team Up
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Teammate Modal */}
      {postTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Post Teammate Partner Request</h3>
            <p className="text-xs text-slate-400 mt-1">Find fellow students with matching skills for your hackathon project.</p>

            <form onSubmit={handlePostTeammate} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role You Need</label>
                <input
                  type="text"
                  required
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="e.g. Frontend UI Developer / Designer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Desired Skills (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={desiredSkills}
                  onChange={(e) => setDesiredSkills(e.target.value)}
                  placeholder="e.g. React, Tailwind, PyTorch, Figma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Idea / Pitch</label>
                <textarea
                  rows={3}
                  required
                  value={teamPitch}
                  onChange={(e) => setTeamPitch(e.target.value)}
                  placeholder="Briefly describe what you're building..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostTeamModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-500"
                >
                  Publish Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HackathonsPage;
