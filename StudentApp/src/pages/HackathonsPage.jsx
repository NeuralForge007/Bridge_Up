import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const CANONICAL_COLLEGES = [
  { id: '', name: 'Any College (All Networks)' },
  { id: '1', name: 'Institute of Engineering and Management (IEM)' },
  { id: '2', name: 'Jadavpur University (JU)' },
  { id: '3', name: 'University of Calcutta (CU)' },
  { id: '4', name: 'IIT Kharagpur (IIT KGP)' },
  { id: '5', name: 'NIT Durgapur (NIT DGP)' }
];

const PRESET_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'FastAPI', 'PyTorch', 'TensorFlow',
  'C++', 'Arduino', 'ESP32', 'PostgreSQL', 'Docker', 'AWS', 'Solidity', 'Figma', 'GraphQL'
];

const HackathonsPage = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'requirements' | 'requests'
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Team Requirements state
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Join Requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Requirement Modal Form
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [desiredRole, setDesiredRole] = useState('Frontend Developer');
  const [selectedSkills, setSelectedSkills] = useState(['React', 'TypeScript']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [preferredGender, setPreferredGender] = useState('Any');
  const [minHackathons, setMinHackathons] = useState(0);
  const [minProjects, setMinProjects] = useState(0);
  const [preferredCollegeId, setPreferredCollegeId] = useState('');
  const [collaborationMode, setCollaborationMode] = useState('Any');
  const [availableSlots, setAvailableSlots] = useState(2);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Send Join Request Modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const loadHackathons = async () => {
    setLoading(true);
    try {
      const list = await apiService.getHackathons();
      setHackathons(list || []);
      if (list && list.length > 0) {
        const first = list[0];
        setSelectedHackathon(first);
        loadRequirements(first.id);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async (hackathonId) => {
    try {
      const reqs = await apiService.getTeamRequirements(hackathonId);
      setRequirements(reqs || []);
      if (reqs && reqs.length > 0) {
        setSelectedRequirement(reqs[0]);
        loadRecommendations(hackathonId, reqs[0].id);
      } else {
        setSelectedRequirement(null);
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Failed to load requirements:', err);
    }
  };

  const loadRecommendations = async (hackathonId, reqId) => {
    setRecLoading(true);
    try {
      const recData = await apiService.getTeammateRecommendations(hackathonId, reqId);
      if (recData && recData.matches) {
        setRecommendations(recData.matches);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const [inc, outg] = await Promise.all([
        apiService.getIncomingTeamJoinRequests(),
        apiService.getOutgoingTeamJoinRequests()
      ]);
      setIncomingRequests(inc || []);
      setOutgoingRequests(outg || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  useEffect(() => {
    loadHackathons();
    loadRequests();
  }, []);

  const handleSelectHackathon = (h) => {
    setSelectedHackathon(h);
    loadRequirements(h.id);
  };

  const handleSelectRequirement = (req) => {
    setSelectedRequirement(req);
    if (selectedHackathon) {
      loadRecommendations(selectedHackathon.id, req.id);
    }
  };

  const handleToggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handlePostRequirementSubmit = async (e) => {
    e.preventDefault();
    const targetHackathon = selectedHackathon || (hackathons.length > 0 ? hackathons[0] : null);
    if (!targetHackathon) {
      setActionError('Please select a hackathon first.');
      return;
    }
    if (selectedSkills.length === 0 && !desiredRole) {
      setActionError('Please specify at least one required skill or desired role.');
      return;
    }

    setFormSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await apiService.postTeamRequirement(targetHackathon.id, {
        team_name: teamName || `${currentUser?.name || 'Student'}'s Team`,
        project_idea: projectIdea,
        pitch: projectIdea,
        desired_role: desiredRole,
        required_skills: selectedSkills,
        preferred_gender: preferredGender,
        min_hackathons_participated: Number(minHackathons) || 0,
        min_successful_projects: Number(minProjects) || 0,
        preferred_college_id: preferredCollegeId ? Number(preferredCollegeId) : null,
        collaboration_mode: collaborationMode,
        available_slots: Number(availableSlots) || 2
      });

      setActionSuccess('Teammate requirement successfully posted! Generated AI recommendations below.');
      setPostModalOpen(false);
      
      // Reload requirements and trigger recommendations for the newly created post
      await loadRequirements(targetHackathon.id);
      if (res && res.requirement) {
        setSelectedRequirement(res.requirement);
        loadRecommendations(targetHackathon.id, res.requirement.id);
      }
      setActiveTab('requirements');
    } catch (err) {
      setActionError(err.message || 'Failed to post requirement.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenJoinModal = (candidate) => {
    setSelectedCandidate(candidate);
    setJoinMessage(`Hi ${candidate.name}, I reviewed your profile and noticed your strong skills in ${candidate.matched_skills?.join(', ') || 'software development'}. I would love to team up for ${selectedHackathon?.title || 'this hackathon'}!`);
    setJoinModalOpen(true);
  };

  const handleSendJoinRequest = async () => {
    if (!selectedCandidate || !selectedRequirement || !selectedHackathon) return;
    setSendingRequest(true);
    try {
      await apiService.sendTeamJoinRequest(selectedHackathon.id, selectedRequirement.id, {
        recipient_student_id: selectedCandidate.student_id,
        candidate_id: selectedCandidate.student_id,
        message: joinMessage,
        match_score: selectedCandidate.match_score
      });
      setActionSuccess(`Team invite successfully sent to ${selectedCandidate.name}!`);
      setJoinModalOpen(false);
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to send join request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await apiService.acceptTeamJoinRequest(requestId);
      setActionSuccess('Join request accepted! Teammate added to team.');
      loadRequests();
      if (selectedHackathon) loadHackathons();
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await apiService.rejectTeamJoinRequest(requestId);
      setActionSuccess('Join request declined.');
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    }
  };

  const handleWithdrawRequest = async (requestId) => {
    try {
      await apiService.withdrawTeamJoinRequest(requestId);
      setActionSuccess('Join request withdrawn.');
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to withdraw request');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 mb-2">
            <span>🏆 AI Hackathon Arena & Teammate Finder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Hackathons & AI Teammate Finder
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Discover upcoming hackathons, post teammate requirements, match with high-precision student profiles across top engineering colleges, and manage team formation.
          </p>
        </div>

        <button
          onClick={() => {
            setTeamName(`${currentUser?.name || 'Student'}'s Team`);
            setPostModalOpen(true);
          }}
          className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all shrink-0 flex items-center gap-2"
        >
          <span>+ Find Teammates / Post Requirement 👥</span>
        </button>
      </div>

      {/* Success & Error Banners */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'browse'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏆 Upcoming Hackathons ({hackathons.length})
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'requirements'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 Teammate Matcher & Posts ({requirements.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'requests'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📬 Team Join Requests ({incomingRequests.length + outgoingRequests.length})
        </button>
      </div>

      {/* TAB 1: BROWSE HACKATHONS */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {hackathons.map((h) => {
            const isSelected = selectedHackathon?.id === h.id;
            return (
              <div
                key={h.id}
                className={`rounded-3xl border p-6 shadow-xl transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500/50 bg-slate-900/90 ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                      {h.status || 'UPCOMING'}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      🎁 {h.prize_pool}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1.5">{h.title}</h3>
                  <p className="text-xs text-amber-300 font-semibold mb-2">🏛️ {h.organizer}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{h.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(h.tags || []).map((tag, tIdx) => (
                      <span key={tIdx} className="rounded-lg bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-4">
                    <div>📅 Date: <span className="text-white font-semibold">{h.date}</span></div>
                    <div>👥 Open Teams: <span className="text-amber-400 font-semibold">{h.requirements_count} posts</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      handleSelectHackathon(h);
                      setActiveTab('requirements');
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition-all"
                  >
                    View Requirements & AI Match
                  </button>
                  <button
                    onClick={() => {
                      setSelectedHackathon(h);
                      setTeamName(`${currentUser?.name || 'Student'}'s Team`);
                      setPostModalOpen(true);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all"
                  >
                    + Post Role
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEAM REQUIREMENTS & AI RECOMMENDATIONS */}
      {activeTab === 'requirements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Requirements List for Selected Hackathon */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Team Requirements ({requirements.length})
              </h3>
              <button
                onClick={() => setPostModalOpen(true)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                + Post New
              </button>
            </div>

            {requirements.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
                <p className="text-xs text-slate-400">No open team requirements posted for this hackathon yet.</p>
                <button
                  onClick={() => setPostModalOpen(true)}
                  className="mt-3 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requirements.map((req) => {
                  const isSel = selectedRequirement?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => handleSelectRequirement(req)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSel
                          ? 'border-amber-500/50 bg-slate-900 ring-1 ring-amber-500/30'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{req.team_name}</span>
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          {req.available_slots || 2} Slots Left
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-amber-300 mb-1">Seeking: {req.desired_role}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{req.pitch}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {(req.required_skills || []).map((s, idx) => (
                          <span key={idx} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: AI Teammate Recommendations for Selected Requirement */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>⚡ AI Recommended Teammates</span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                    {recommendations.length} Ranked Profiles
                  </span>
                </h3>
                {selectedRequirement && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Matching candidates for <span className="text-amber-300 font-semibold">{selectedRequirement.desired_role}</span> in {selectedRequirement.team_name}
                  </p>
                )}
              </div>
            </div>

            {recLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-800" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-28 bg-slate-800 rounded" />
                        <div className="h-3 w-40 bg-slate-800/60 rounded" />
                      </div>
                    </div>
                    <div className="h-10 bg-slate-800/30 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <p className="text-xs font-semibold text-slate-300">Select a team requirement on the left to view ranked teammate recommendations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((cand) => {
                  const score = typeof cand.match_score === 'number' ? cand.match_score.toFixed(1) : cand.match_score;
                  const isExact = cand.match_type === 'EXACT';

                  return (
                    <div
                      key={cand.student_id}
                      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all"
                    >
                      <div>
                        {/* Top: Avatar, Name & Score */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={cand.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.student_id}`}
                              alt={cand.name}
                              className="h-12 w-12 rounded-2xl border border-slate-700 bg-slate-800 shrink-0"
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white">{cand.name}</h4>
                              <p className="text-[11px] text-amber-300 font-medium">🎓 {cand.college_name}</p>
                              <p className="text-[10px] text-slate-400">Year {cand.year_of_study} • {cand.department}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                              isExact
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                            }`}>
                              {isExact ? '🎯 EXACT' : '⚡ STRONG'}
                            </span>
                            <p className="text-lg font-black text-white mt-0.5">{score}%</p>
                          </div>
                        </div>

                        {/* Experience stats */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mb-3">
                          <div>🏆 {cand.hackathons_participated} Hackathons</div>
                          <div>🚀 {cand.successful_projects} Projects Done</div>
                        </div>

                        {/* Reasons */}
                        <div className="rounded-xl bg-blue-950/20 border border-blue-500/15 p-2.5 text-[10px] text-slate-300 mb-3 space-y-1">
                          {(cand.reasons || []).slice(0, 2).map((r, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-1">
                              <span className="text-blue-400">✓</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(cand.skills || []).slice(0, 5).map((sk, skIdx) => {
                            const isM = (cand.matched_skills || []).some(m => m.toLowerCase() === sk.toLowerCase());
                            return (
                              <span
                                key={skIdx}
                                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border ${
                                  isM
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                {sk} {isM && '✓'}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleOpenJoinModal(cand)}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition-all shadow-md shadow-amber-500/20"
                      >
                        Send Join Request ✉️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: JOIN REQUESTS LIFECYCLE */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Incoming Requests */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📥 Incoming Join Requests</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                {incomingRequests.length}
              </span>
            </h3>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No incoming join requests right now.</p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{req.sender_name}</h4>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-300">🎓 {req.sender_college}</p>
                    <p className="text-xs text-slate-300 italic">"{req.message}"</p>

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          Accept Teammate ✓
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
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

          {/* Outgoing Requests */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📤 Sent Join Requests</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/20">
                {outgoingRequests.length}
              </span>
            </h3>

            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">You haven't sent any team join requests yet.</p>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">To Student #{req.recipient_student_id}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        req.status === 'WITHDRAWN' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{req.message}"</p>

                    {req.status === 'PENDING' && (
                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleWithdrawRequest(req.id)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          Withdraw Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL: POST TEAM REQUIREMENT */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl my-8">
            <h3 className="text-xl font-bold text-white mb-1">
              Post Teammate Requirement
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Publish your project requirement for <span className="text-amber-300 font-semibold">{selectedHackathon?.title || hackathons[0]?.title || 'Upcoming Hackathon'}</span>.
            </p>

            {hackathons.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Hackathon</label>
                <select
                  value={selectedHackathon?.id || hackathons[0]?.id || ''}
                  onChange={(e) => {
                    const h = hackathons.find(x => String(x.id) === String(e.target.value));
                    if (h) setSelectedHackathon(h);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {hackathons.map(h => (
                    <option key={h.id} value={h.id}>{h.title || h.name}</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handlePostRequirementSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. NextGen Innovators"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Desired Teammate Role</label>
                  <select
                    value={desiredRole}
                    onChange={(e) => setDesiredRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="ML Engineer">ML Engineer / Data Scientist</option>
                    <option value="Embedded Systems Engineer">Embedded Systems / IoT Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Pitch and Presentation Lead">Pitch & Presentation Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Project Idea & Pitch</label>
                <textarea
                  rows={3}
                  required
                  value={projectIdea}
                  onChange={(e) => setProjectIdea(e.target.value)}
                  placeholder="Describe what you plan to build, key architecture choices, and who you are looking for..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Multi-Select Required Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Required Skills (Multi-select)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_SKILLS.map((sk) => {
                    const active = selectedSkills.includes(sk);
                    return (
                      <button
                        type="button"
                        key={sk}
                        onClick={() => handleToggleSkill(sk)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                          active
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sk} {active && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder="Add custom skill (e.g. OpenCV, LangChain)..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Structured Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preferred Gender (Optional)</label>
                  <select
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    <option value="Any">Any Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">College Filter (Optional)</label>
                  <select
                    value={preferredCollegeId}
                    onChange={(e) => setPreferredCollegeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    {CANONICAL_COLLEGES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Collaboration Mode</label>
                  <select
                    value={collaborationMode}
                    onChange={(e) => setCollaborationMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    <option value="Any">Any Mode</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="In-person">In-person</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Min Hackathons</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={minHackathons}
                    onChange={(e) => setMinHackathons(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Min Projects</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={minProjects}
                    onChange={(e) => setMinProjects(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Available Slots</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={availableSlots}
                    onChange={(e) => setAvailableSlots(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 disabled:opacity-50"
                >
                  {formSubmitting ? 'Publishing...' : 'Publish & Match Teammates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEND JOIN REQUEST */}
      {joinModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              Send Team Join Request to <span className="text-amber-400">{selectedCandidate.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              🎓 {selectedCandidate.college_name} • Match Score: <span className="text-emerald-400 font-bold">{selectedCandidate.match_score}%</span>
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Invitation Message
              </label>
              <textarea
                rows={4}
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Introduce your project and role expectations..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setJoinModalOpen(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendJoinRequest}
                disabled={sendingRequest}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 disabled:opacity-50"
              >
                {sendingRequest ? 'Sending...' : 'Send Join Request'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HackathonsPage;
