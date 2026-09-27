import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const STAGES = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'HIRED'];

const ReferralsPage = () => {
  const { currentUser } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const data = await apiService.getReferrals();
      setReferrals(data || []);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [currentUser]);

  const getStageIndex = (status) => {
    const idx = STAGES.indexOf(status?.toUpperCase());
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 mb-2">
          <span>🚀 Real-Time Alumni Referral Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Referrals Pipeline & Hiring Stages
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Track end-to-end status of company referrals submitted by alumni mentors.
        </p>
      </div>

      {/* Referrals List */}
      <div className="space-y-6">
        {referrals.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <p className="text-sm font-semibold text-slate-300">No referrals found in your pipeline.</p>
            <p className="text-xs text-slate-500 mt-1">Connect with Alumni Mentors to request internal company referrals.</p>
          </div>
        ) : (
          referrals.map((ref) => {
            const currentStageIdx = getStageIndex(ref.status);

            return (
              <div
                key={ref.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      {ref.target_company || 'Top Tech Corp'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{ref.role_title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Candidate: <span className="text-slate-200 font-semibold">{ref.student_name}</span> • Referred by: <span className="text-emerald-400 font-semibold">{ref.alumni_name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                      Stage: {ref.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Submitted on {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="mt-6">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {STAGES.map((stage, idx) => {
                      const isComplete = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div key={stage} className="relative">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-800'
                            }`}
                          />
                          <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent ? 'text-emerald-400 font-black' : isComplete ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {stage}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Referral Note */}
                {ref.referral_note && (
                  <div className="mt-5 rounded-2xl bg-slate-950/60 p-3.5 text-xs text-slate-400 border border-slate-800/80">
                    <span className="font-semibold text-slate-300">Alumni Endorsement Note:</span>
                    <p className="mt-1 italic leading-relaxed">"{ref.referral_note}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default ReferralsPage;
