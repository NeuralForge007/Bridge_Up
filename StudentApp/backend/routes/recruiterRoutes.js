import express from 'express';
import { dbStore } from '../dbStore.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Recruiter Candidate Discovery (Search & Verification-Aware Filter)
router.get('/candidates', (req, res) => {
  try {
    const {
      search,
      college_id,
      minCgpa,
      skills,
      career_domain,
      verification_status,
      hasReferral
    } = req.query;

    let candidates = dbStore.getStudents({
      search,
      college_id,
      minCgpa,
      verification_status
    });

    if (career_domain && career_domain !== 'All') {
      candidates = candidates.filter(c => c.career_domain?.toLowerCase() === career_domain.toLowerCase());
    }

    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim().toLowerCase());
      candidates = candidates.filter(c =>
        c.skills?.some(cs => skillArr.some(reqS => cs.toLowerCase().includes(reqS))) ||
        skillArr.some(reqS => c.primary_skill?.toLowerCase().includes(reqS))
      );
    }

    // Attach Referrals & Hackathon Achievements
    const enriched = candidates.map(student => {
      const referrals = dbStore.getReferrals({ student_id: student.student_id });
      const hackathons = dbStore.hackathonParticipants.filter(hp => hp.person_id === student.student_id);
      const college = dbStore.getCollegeById(student.college_id);

      return {
        ...student,
        collegeName: college?.college_name || `College #${student.college_id}`,
        referralsCount: referrals.length,
        hasAlumniReferral: referrals.length > 0,
        referrals,
        hackathonAwards: hackathons.map(h => `${h.result}: ${h.hackathon_name}`),
        isCollegeVerified: student.verification_status === 'Verified',
        isIdentityVerified: true
      };
    });

    if (hasReferral === 'true') {
      return res.json({ success: true, count: enriched.filter(e => e.hasAlumniReferral).length, candidates: enriched.filter(e => e.hasAlumniReferral) });
    }

    return res.json({ success: true, count: enriched.length, candidates: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Shortlist Candidate
router.post('/shortlist', async (req, res) => {
  try {
    const { recruiterId, studentId, jobId, notes } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });

    // Notify student
    dbStore.createNotification({
      user_id: `STUDENT-${studentId}`,
      type: 'RECRUITER_SHORTLIST',
      title: 'Shortlisted by Recruiter!',
      message: `A company recruiter has shortlisted your profile for upcoming career opportunities.`,
      link: '/dashboard'
    });

    await logUserActivity({
      userId: recruiterId || 'recruiter',
      action: 'SHORTLIST_CANDIDATE',
      target_type: 'student',
      target_id: String(studentId),
      details: { jobId, notes },
      req
    });

    return res.json({ success: true, message: 'Candidate shortlisted successfully!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Recruiter Dashboard Metrics
router.get('/metrics', (req, res) => {
  try {
    const allStudents = dbStore.getStudents();
    const allJobs = dbStore.getJobs();
    const allReferrals = dbStore.getReferrals();

    return res.json({
      success: true,
      metrics: {
        totalVerifiedCandidates: allStudents.filter(s => s.verification_status === 'Verified').length,
        activeJobPostings: allJobs.filter(j => j.status === 'Active').length,
        totalReferredCandidates: allReferrals.length,
        shortlistedCount: 14
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
