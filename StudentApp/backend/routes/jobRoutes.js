import express from 'express';
import { dbStore } from '../dbStore.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Get All Jobs & Internships
router.get('/', (req, res) => {
  try {
    const { type, search, status } = req.query;
    const jobs = dbStore.getJobs({ type, search, status });
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Job by ID
router.get('/:id', (req, res) => {
  try {
    const job = dbStore.jobs.find(j => String(j.job_id) === String(req.params.id) || j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Post a New Job (Recruiter)
router.post('/', async (req, res) => {
  try {
    const {
      company_name,
      role_title,
      employment_type,
      required_skills,
      application_deadline,
      recruiter_id,
      location,
      description
    } = req.body;

    if (!company_name || !role_title) {
      return res.status(400).json({ error: 'company_name and role_title are required.' });
    }

    const newJob = dbStore.upsertJob({
      job_id: Date.now() % 100000,
      company_name,
      role_title,
      employment_type: employment_type || 'Full-time',
      required_skills: required_skills || 'Full Stack, Problem Solving',
      status: 'Active',
      application_deadline: application_deadline || '2026-12-31',
      recruiter_id: Number(recruiter_id) || 3001,
      location: location || 'Remote',
      description: description || 'High-impact role at BridgeUp partner company.'
    });

    await logUserActivity({
      userId: `REC-${recruiter_id}`,
      action: 'POST_JOB',
      target_type: 'job',
      target_id: String(newJob.job_id),
      details: { role_title, company_name },
      req
    });

    return res.status(201).json({ success: true, message: 'Job posted successfully!', job: newJob });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Apply for Job (Student)
router.post('/:id/apply', async (req, res) => {
  try {
    const { studentId, studentName } = req.body;
    const job = dbStore.jobs.find(j => String(j.job_id) === String(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Notify Recruiter
    dbStore.createNotification({
      user_id: `REC-${job.recruiter_id}`,
      type: 'JOB_APPLICATION',
      title: 'New Job Application',
      message: `${studentName || 'A student'} applied for ${job.role_title}`,
      link: '/recruiter-dashboard'
    });

    await logUserActivity({
      userId: `STUDENT-${studentId}`,
      action: 'APPLY_JOB',
      target_type: 'job',
      target_id: req.params.id,
      details: { role_title: job.role_title },
      req
    });

    return res.json({ success: true, message: `Application submitted successfully for ${job.role_title}!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
