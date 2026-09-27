import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Get All Jobs & Internships
router.get('/', async (req, res) => {
  try {
    const { type, search, status } = req.query;

    let supaJobs = null;
    try {
      let q = supabase.from('jobs').select('*');
      if (status && status !== 'All') q = q.eq('status', status);
      if (type && type !== 'All') q = q.ilike('employment_type', `%${type}%`);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) supaJobs = data;
    } catch (e) {}

    let jobs = supaJobs || dbStore.getJobs({ type, search, status });

    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        (j.role_title && j.role_title.toLowerCase().includes(q)) ||
        (j.company_name && j.company_name.toLowerCase().includes(q)) ||
        (j.required_skills && j.required_skills.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Job by ID
router.get('/:id', async (req, res) => {
  try {
    let job = null;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(`id.eq.${req.params.id},job_id.eq.${Number(req.params.id) || 0}`)
        .maybeSingle();
      if (!error && data) job = data;
    } catch (e) {}

    if (!job) {
      job = dbStore.jobs.find(j => String(j.job_id) === String(req.params.id) || j.id === req.params.id);
    }

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
      description,
      salary_range
    } = req.body;

    if (!company_name || !role_title) {
      return res.status(400).json({ error: 'company_name and role_title are required.' });
    }

    const newJob = {
      id: `job-${Date.now()}`,
      job_id: Date.now() % 100000,
      company_name,
      role_title,
      employment_type: employment_type || 'Full-time',
      required_skills: required_skills || 'Full Stack, Problem Solving',
      status: 'Active',
      application_deadline: application_deadline || '2026-12-31',
      recruiter_id: Number(recruiter_id) || 3001,
      location: location || 'Remote',
      salary_range: salary_range || '$80,000 - $120,000',
      description: description || 'High-impact role at BridgeUp partner company.',
      created_at: new Date().toISOString()
    };

    dbStore.upsertJob(newJob);

    // Save in Supabase jobs table
    try {
      await supabase.from('jobs').insert([newJob]);
    } catch (e) {
      console.warn('Supabase job insert error:', e.message);
    }

    await logUserActivity({
      userId: `REC-${recruiter_id || 3001}`,
      action: 'POST_JOB',
      target_type: 'job',
      target_id: String(newJob.job_id),
      details: { role_title, company_name },
      req
    });

    return res.status(201).json({ success: true, message: 'Job posted and saved in Supabase!', job: newJob });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Apply for Job (Student)
router.post('/:id/apply', async (req, res) => {
  try {
    const { studentId, studentName } = req.body;
    let job = dbStore.jobs.find(j => String(j.job_id) === String(req.params.id) || j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Notify Recruiter in memory and in Supabase
    const notifObj = {
      id: `notif-${Date.now()}`,
      user_id: `REC-${job.recruiter_id}`,
      type: 'JOB_APPLICATION',
      title: 'New Job Application',
      message: `${studentName || 'A student'} applied for ${job.role_title}`,
      link: '/recruiter-dashboard',
      created_at: new Date().toISOString()
    };

    dbStore.createNotification(notifObj);

    try {
      await supabase.from('notifications').insert([notifObj]);
    } catch (e) {}

    await logUserActivity({
      userId: `STUDENT-${studentId || '1001'}`,
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
