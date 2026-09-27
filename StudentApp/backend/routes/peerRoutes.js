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
      if (supabase && typeof supabase.from === 'function') {
        let query = supabase.from('students').select('*');
        if (excludeId) query = query.neq('id', excludeId);
        if (excludeEmail) query = query.neq('email', excludeEmail);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          peers = data.map(p => ({
            id: p.id || `std-${p.student_id}`,
            name: p.full_name || p.name || 'Student Peer',
            email: p.email,
            major: p.major || p.department || 'Computer Science',
            skills: p.skills || ['JavaScript', 'React', 'Python'],
            collegeId: p.college_id,
            cgpa: p.cgpa || 8.5,
            graduationYear: p.graduation_year || 2026,
            jobTitle: 'Student',
            streakDays: 7,
            studyHoursWeek: 20.0,
            verificationStatus: p.verification_status || 'Verified',
            avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.email || 'student')}`
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase peers query note:', e.message);
    }

    if (!peers || peers.length === 0) {
      peers = dbStore.getStudentPeers ? dbStore.getStudentPeers(excludeId, excludeEmail) : [];
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
