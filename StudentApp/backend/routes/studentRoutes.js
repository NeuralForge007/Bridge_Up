import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Get All Students (Search & Filters)
router.get('/', async (req, res) => {
  try {
    const { search, college_id, minCgpa, verification_status } = req.query;

    // Fetch from Supabase
    let supaStudents = null;
    try {
      let query = supabase.from('students').select('*');
      if (college_id) query = query.eq('college_id', Number(college_id));
      if (verification_status) query = query.eq('verification_status', verification_status);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        supaStudents = data;
      }
    } catch (e) {
      console.warn('Supabase students fetch note:', e.message);
    }

    let students = supaStudents || dbStore.getStudents({ search, college_id, minCgpa, verification_status });

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.primary_skill && s.primary_skill.toLowerCase().includes(q)) ||
        (s.skills && Array.isArray(s.skills) && s.skills.some(sk => sk.toLowerCase().includes(q)))
      );
    }

    if (minCgpa) {
      students = students.filter(s => Number(s.cgpa || s.gpa || 0) >= Number(minCgpa));
    }

    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`id.eq.${id},user_id.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        student = data;
      }
    } catch (e) {}

    if (!student) {
      student = dbStore.getStudentById(id);
    }

    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Student Profile
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = dbStore.getStudentById(id);
    const updated = dbStore.upsertStudent({
      ...(student || {}),
      ...updates
    });

    // Write to Supabase students table
    try {
      await supabase
        .from('students')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .or(`id.eq.${id},user_id.eq.${id},student_id.eq.${Number(id) || 0}`);
    } catch (e) {
      console.warn('Supabase student update error:', e.message);
    }

    // Also update users table if applicable
    if (student?.user_id || student?.email) {
      try {
        await supabase
          .from('users')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .or(`id.eq.${student.user_id || id},email.eq.${student.email || ''}`);
      } catch (e) {}
    }

    await logUserActivity({
      userId: student?.user_id || id,
      userEmail: student?.email,
      action: 'PROFILE_UPDATE',
      details: { updates: Object.keys(updates) },
      req
    });

    return res.json({ success: true, message: 'Student profile updated in Supabase.', student: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
