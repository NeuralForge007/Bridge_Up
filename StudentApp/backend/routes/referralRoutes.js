import express from 'express';
import { dbStore } from '../dbStore.js';

const router = express.Router();

// Get all referrals (filtered by user role or query)
router.get('/', (req, res) => {
  try {
    const { status, studentId, alumniId } = req.query;
    let list = dbStore.getReferrals ? dbStore.getReferrals() : (dbStore.referrals || []);

    if (status) {
      list = list.filter(r => r.status?.toLowerCase() === status.toLowerCase());
    }
    if (studentId) {
      list = list.filter(r => String(r.student_id) === String(studentId));
    }
    if (alumniId) {
      list = list.filter(r => String(r.alumni_id) === String(alumniId));
    }

    // Enrich with student, alumni, and job details
    const enriched = list.map(r => {
      const student = dbStore.getStudentById ? dbStore.getStudentById(r.student_id) : null;
      const alumni = dbStore.getAlumniById ? dbStore.getAlumniById(r.alumni_id) : null;
      const job = dbStore.getJobById ? dbStore.getJobById(r.job_id) : null;

      return {
        ...r,
        id: r.referral_id || r.id,
        student_name: student?.full_name || student?.name || 'Alex Rivera',
        student_email: student?.email || 'alex.rivera@stanford.edu',
        student_college: 'Stanford University',
        student_skills: ['React', 'Python', 'Machine Learning'],
        alumni_name: alumni?.full_name || alumni?.name || 'Vikram Sethi',
        alumni_company: alumni?.company || 'Google',
        target_company: job?.company_name || alumni?.company || r.target_company || 'Top Tech Corp',
        role_title: job?.role_title || r.role_title || 'Software Engineering Role',
        referral_note: r.recommendation_reason || r.referral_note || 'Highly recommended based on strong project portfolio and academic track record.'
      };
    });

    res.json({ success: true, count: enriched.length, referrals: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a new referral
router.post('/', (req, res) => {
  try {
    const { studentName, studentEmail, targetCompany, roleTitle, note } = req.body;

    const newReferral = {
      referral_id: Date.now() % 10000,
      id: `ref-${Date.now()}`,
      student_id: 1001,
      alumni_id: 2001,
      student_name: studentName || 'Alex Rivera',
      target_company: targetCompany || 'Google',
      role_title: roleTitle || 'Software Engineer',
      referral_note: note || 'Highly recommended based on outstanding project work.',
      recommendation_reason: note || 'Highly recommended based on outstanding project work.',
      status: 'SUBMITTED',
      created_at: new Date().toISOString()
    };

    if (dbStore.upsertReferral) dbStore.upsertReferral(newReferral);
    else dbStore.referrals.unshift(newReferral);

    res.status(201).json({ success: true, referral: newReferral });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update referral status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    let list = dbStore.getReferrals ? dbStore.getReferrals() : (dbStore.referrals || []);
    const referral = list.find(r => String(r.referral_id) === String(id) || r.id === id);
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    referral.status = status?.toUpperCase() || 'VIEWED';
    if (feedback) referral.feedback = feedback;

    res.json({ success: true, referral });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
