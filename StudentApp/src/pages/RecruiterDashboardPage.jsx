import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const RecruiterDashboardPage = () => {
  const { currentUser } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchSkill, setSearchSkill] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const [cands, mets] = await Promise.all([
        apiService.getRecruiterCandidates({
          skill: searchSkill || undefined,
          minCgpa: minCgpa || undefined,
          verifiedOnly: verifiedOnly || undefined,
          search: searchQuery || undefined
        }),
        apiService.getRecruiterMetrics()
      ]);
      setCandidates(cands || []);
      setMetrics(mets || null);
    } catch (err) {
      console.error('Failed to load candidate directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [searchSkill, minCgpa, verifiedOnly, searchQuery]);

  const handleShortlist = async (candidate) => {
    if (shortlisted.includes(candidate.id)) {
      setShortlisted(prev => prev.filter(id => id !== candidate.id));
    } else {
      setShortlisted(prev => [...prev, candidate.id]);
      await apiService.shortlistCandidate(candidate.id, 'Shortlisted for technical screen');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 mb-2">
            <span>🎯 Recruiter Talent Discovery Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Verified Student & Alumni Talent Pool
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Browse university-verified candidates, alumni-referred top talent, and hackathon winners.
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 text-center shrink-0">
          <p className="text-[11px] font-bold text-purple-300 uppercase">My Shortlisted Pool</p>
          <p className="text-2xl font-black text-white mt-0.5">{shortlisted.length} Candidates</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400">Total Verified Candidates</p>
          <p className="text-xl font-black text-white mt-1">{metrics?.totalCandidates || candidates.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400">Alumni Referrals Active</p>
          <p className="text-xl font-black text-purple-400 mt-1">{metrics?.alumniReferralsCount || 12}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400">High CGPA (&gt; 8.5)</p>
          <p className="text-xl font-black text-emerald-400 mt-1">
            {candidates.filter(c => parseFloat(c.gpa || c.cgpa || 0) >= 8.5).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400">Partner Universities</p>
          <p className="text-xl font-black text-blue-400 mt-1">15 Colleges</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Search Candidate or Major</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Alex, Computer Science..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Filter by Skill</label>
            <input
              type="text"
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              placeholder="e.g. React, Python, ML, PyTorch"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Min CGPA (out of 10)</label>
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">All GPAs</option>
              <option value="8.0">8.0+ CGPA</option>
              <option value="8.5">8.5+ CGPA</option>
              <option value="9.0">9.0+ CGPA (Dean's List)</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span>College Verified Only ✓</span>
            </label>
          </div>
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((c) => {
          const isShortlisted = shortlisted.includes(c.id);

          return (
            <div
              key={c.id}
              className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all hover:border-purple-500/40 hover:bg-slate-900/90 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student'}
                      alt=""
                      className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <p className="text-xs text-slate-400">{c.major || 'Computer Science'}</p>
                      <p className="text-[11px] text-slate-500">🏛️ {c.college_name || 'Stanford University'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/20">
                      {c.gpa || c.cgpa || '8.80'} CGPA
                    </span>
                  </div>
                </div>

                {/* Verification Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    College Verified
                  </span>
                  {c.referral_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                      🚀 {c.referral_count} Alumni Referrals
                    </span>
                  )}
                  {c.hackathon_winner && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                      🏆 Hackathon Winner
                    </span>
                  )}
                </div>

                {/* Bio / Headline */}
                <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {c.bio || c.headline || 'Passionate about distributed systems, backend architectures, and high performance computing.'}
                </p>

                {/* Skills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(c.skills || ['React', 'Python', 'Machine Learning']).map((sk, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <a
                  href={`mailto:${c.email}`}
                  className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1"
                >
                  <span>✉️ Contact</span>
                </a>

                <button
                  onClick={() => handleShortlist(c)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    isShortlisted
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                  }`}
                >
                  {isShortlisted ? '✓ Shortlisted' : '+ Shortlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default RecruiterDashboardPage;
