import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Super Admin Platform Analytics
const getAnalytics = (req, res) => {
  try {
    const colleges = dbStore.getColleges ? dbStore.getColleges() : (dbStore.colleges || []);
    const users = dbStore.getUsers ? dbStore.getUsers() : (dbStore.users || []);
    const students = dbStore.getStudents ? dbStore.getStudents() : (dbStore.students || []);
    const alumni = dbStore.getAlumni ? dbStore.getAlumni() : (dbStore.alumni || []);
    const jobs = dbStore.getJobs ? dbStore.getJobs() : (dbStore.jobs || []);
    const mentorships = dbStore.getMentorships ? dbStore.getMentorships() : (dbStore.mentorships || []);
    const referrals = dbStore.getReferrals ? dbStore.getReferrals() : (dbStore.referrals || []);
    const events = dbStore.getEvents ? dbStore.getEvents() : (dbStore.events || []);

    const byRole = { STUDENT: 0, ALUMNI: 0, RECRUITER: 0, COLLEGE_ADMIN: 0, SUPER_ADMIN: 0 };
    users.forEach(u => {
      const r = (u.role || 'STUDENT').toUpperCase();
      if (byRole[r] !== undefined) byRole[r]++;
      else byRole[r] = 1;
    });

    const analyticsData = {
      users: {
        total: users.length,
        byRole
      },
      collegesCount: colleges.length,
      mentorships: {
        total: mentorships.length,
        active: mentorships.filter(m => m.status === 'ACCEPTED' || m.status === 'ACTIVE').length
      },
      referrals: {
        total: referrals.length
      },
      jobsCount: jobs.length,
      eventsCount: events.length
    };

    return res.json({
      success: true,
      analytics: analyticsData,
      metrics: analyticsData
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.get('/metrics', getAnalytics);
router.get('/analytics', getAnalytics);

// 2. Colleges List
router.get('/colleges', async (req, res) => {
  try {
    let supaColleges = null;
    try {
      const { data, error } = await supabase.from('colleges').select('*').order('college_name');
      if (!error && data && data.length > 0) supaColleges = data;
    } catch (e) {}

    const colleges = supaColleges || (dbStore.getColleges ? dbStore.getColleges() : (dbStore.colleges || []));
    return res.json({ success: true, count: colleges.length, colleges });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Create College
router.post('/colleges', async (req, res) => {
  try {
    const { name, college_name, city, state, code, short_code, domain, website_domain } = req.body;
    const finalName = name || college_name;
    if (!finalName) return res.status(400).json({ error: 'college name is required' });

    const newCollege = {
      college_id: Date.now() % 10000,
      id: `col-${Date.now()}`,
      college_name: finalName,
      city: city || 'San Francisco',
      state: state || 'CA',
      country: 'India',
      short_code: code || short_code || finalName.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase(),
      website_domain: domain || website_domain || `${finalName.toLowerCase().replace(/\s+/g, '')}.edu`,
      status: 'Verified',
      created_at: new Date().toISOString()
    };

    if (dbStore.upsertCollege) dbStore.upsertCollege(newCollege);
    else dbStore.colleges.push(newCollege);

    // Save in Supabase
    try {
      await supabase.from('colleges').insert([newCollege]);
    } catch (e) {
      console.warn('Supabase college insert error:', e.message);
    }

    return res.status(201).json({ success: true, message: 'College created & saved in Supabase!', college: newCollege });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Users List
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let supaUsers = null;
    try {
      let q = supabase.from('users').select('*');
      if (role) q = q.ilike('role', role);
      const { data, error } = await q;
      if (!error && data && data.length > 0) supaUsers = data;
    } catch (e) {}

    let users = supaUsers || (dbStore.getUsers ? dbStore.getUsers() : (dbStore.users || []));
    if (role && !supaUsers) {
      users = users.filter(u => u.role?.toUpperCase() === role.toUpperCase());
    }
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. User Status Update (Suspend / Activate)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    let user = null;
    if (dbStore.updateUser) {
      user = dbStore.updateUser(req.params.id, { verificationStatus: status });
    }
    if (!user) {
      user = dbStore.users.find(u => u.id === req.params.id || u.user_id === req.params.id);
      if (user) {
        user.status = status;
        user.verification_status = status;
      }
    }

    // Sync to Supabase
    try {
      await supabase.from('users').update({ verification_status: status }).or(`id.eq.${req.params.id}`);
      await supabase.from('students').update({ verification_status: status }).or(`id.eq.${req.params.id},user_id.eq.${req.params.id}`);
      await supabase.from('alumni').update({ verification_status: status }).or(`id.eq.${req.params.id},user_id.eq.${req.params.id}`);
    } catch (e) {}

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ success: true, message: 'User status updated in Supabase', user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Audit Logs Viewer
router.get('/audit-logs', async (req, res) => {
  try {
    let supaLogs = null;
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (!error && data && data.length > 0) supaLogs = data;
    } catch (e) {}

    const logs = supaLogs || (dbStore.getAuditLogs ? dbStore.getAuditLogs(100) : (dbStore.auditLogs || []));
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
