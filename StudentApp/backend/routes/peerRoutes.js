import express from 'express';
import { supabase } from '../supabaseClient.js';
import { dbStore } from '../dbStore.js';

const router = express.Router();

// GET /api/peers — return all registered student peers from Supabase / dbStore
router.get('/', async (req, res) => {
  try {
    const { excludeId, excludeEmail, major, search } = req.query;

    let peers = [];

    try {
      let query = supabase.from('users').select('*').eq('role', 'student');
      if (excludeId) query = query.neq('id', excludeId);
      if (excludeEmail) query = query.neq('email', excludeEmail);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        peers = data.map(p => ({
          ...p,
          jobTitle: p.job_title || '',
          streakDays: p.streak_days || 1,
          studyHoursWeek: p.study_hours_week || 12.0
        }));
      }
    } catch (e) {
      console.warn('Supabase peers query note:', e.message);
    }

    if (peers.length === 0) {
      peers = dbStore.getStudentPeers(excludeId, excludeEmail);
    }

    // Filter by major if specified
    if (major && major !== 'All') {
      peers = peers.filter(p => (p.major || '').toLowerCase().includes(major.toLowerCase()));
    }

    // Filter by search query if specified
    if (search) {
      const q = search.toLowerCase();
      peers = peers.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.major || '').toLowerCase().includes(q) ||
        (Array.isArray(p.skills) && p.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    return res.json({ peers, total: peers.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
