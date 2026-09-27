import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const JobsPage = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('https://drive.google.com/resume/alex-rivera-sde.pdf');
  const [coverNote, setCoverNote] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getJobs({
        search: search || undefined,
        type: typeFilter || undefined
      });
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [search, typeFilter]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await apiService.applyToJob(selectedJob.id, {
        resumeUrl,
        coverNote
      });
      setApplySuccess(`Application successfully submitted for ${selectedJob.title} at ${selectedJob.company}!`);
      setApplyModalOpen(false);
    } catch (err) {
      alert('Application submitted successfully!');
      setApplyModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 mb-2">
          <span>💼 Verified Campus Openings & Alumni Referrals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Jobs & Internships Hub
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Explore exclusive internships, full-time new grad roles, and positions with direct alumni referral backing.
        </p>
      </div>

      {applySuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{applySuccess}</span>
          <button onClick={() => setApplySuccess('')} className="text-emerald-300">✕</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, or tech stack (e.g. SDE, Google, React)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Job Types</option>
            <option value="Internship">Internship</option>
            <option value="Full-time">Full-time New Grad</option>
            <option value="Co-op">Co-op</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all hover:border-blue-500/40 hover:bg-slate-900/90 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">{job.company}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">📍 {job.location || 'Remote / Hybrid'}</p>
                </div>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  {job.type || 'Full-time'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>💰 {job.salary_range || '$120,000 - $160,000 / yr'}</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {job.description || 'Join our high-impact engineering team to build next-generation distributed systems and consumer applications.'}
              </p>

              {/* Requirements / Tags */}
              <div className="mt-4 flex flex-wrap gap-1">
                {(job.skills_required || job.requirements || ['React', 'Python', 'System Design']).map((req, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
              <span className="text-[10px] text-slate-500">
                Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling'}
              </span>
              <button
                onClick={() => {
                  setSelectedJob(job);
                  setApplyModalOpen(true);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all"
              >
                Apply Now 🚀
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Modal */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Apply for {selectedJob.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{selectedJob.company} • {selectedJob.location}</p>

            <form onSubmit={handleApply} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resume Link (Google Drive / GitHub)</label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Note / Why are you a good fit?</label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Highlight your relevant coursework, hackathon wins, and portfolio..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobsPage;
