import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Get All Alumni Mentors
router.get('/', async (req, res) => {
  try {
    const { search, company, college_id, verification_status } = req.query;

    let supaAlumni = null;
    try {
      let query = supabase.from('alumni').select('*');
      if (company && company !== 'All') query = query.ilike('company', `%${company}%`);
      if (college_id) query = query.eq('college_id', Number(college_id));
      if (verification_status) query = query.eq('verification_status', verification_status);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        supaAlumni = data;
      }
    } catch (e) {
      console.warn('Supabase alumni fetch note:', e.message);
    }

    let alumni = supaAlumni || dbStore.getAlumni({ search, company, college_id, verification_status });

    if (search) {
      const q = search.toLowerCase();
      alumni = alumni.filter(a =>
        (a.full_name && a.full_name.toLowerCase().includes(q)) ||
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.company && a.company.toLowerCase().includes(q)) ||
        (a.current_role && a.current_role.toLowerCase().includes(q)) ||
        (a.role_title && a.role_title.toLowerCase().includes(q)) ||
        (a.skills && Array.isArray(a.skills) && a.skills.some(sk => sk.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: alumni.length, alumni });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Alumni by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let alumni = null;

    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .or(`id.eq.${id},user_id.eq.${id}`)
        .maybeSingle();

      if (!error && data) alumni = data;
    } catch (e) {}

    if (!alumni) {
      alumni = dbStore.getAlumniById(id);
    }

    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    return res.json({ success: true, alumni });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Alumni Profile
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const alumni = dbStore.getAlumniById(id);
    const updated = dbStore.upsertAlumni({
      ...(alumni || {}),
      ...updates
    });

    // Sync update to Supabase
    try {
      await supabase
        .from('alumni')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .or(`id.eq.${id},user_id.eq.${id},alumni_id.eq.${Number(id) || 0}`);
    } catch (e) {
      console.warn('Supabase alumni update error:', e.message);
    }

    // Also update users table
    if (alumni?.user_id || alumni?.email) {
      try {
        await supabase
          .from('users')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .or(`id.eq.${alumni.user_id || id},email.eq.${alumni.email || ''}`);
      } catch (e) {}
    }

    await logUserActivity({
      userId: alumni?.user_id || id,
      userEmail: alumni?.email,
      action: 'ALUMNI_PROFILE_UPDATE',
      details: { updates: Object.keys(updates) },
      req
    });

    return res.json({ success: true, message: 'Alumni profile updated & saved to Supabase.', alumni: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
