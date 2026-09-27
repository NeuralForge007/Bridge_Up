import express from 'express';
import { dbStore } from '../dbStore.js';

const router = express.Router();

// 1. Get All Students (Search & Filters)
router.get('/', (req, res) => {
  try {
    const { search, college_id, minCgpa, verification_status } = req.query;
    const students = dbStore.getStudents({ search, college_id, minCgpa, verification_status });
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Student by ID
router.get('/:id', (req, res) => {
  try {
    const student = dbStore.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Student Profile
router.patch('/:id', (req, res) => {
  try {
    const student = dbStore.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const updated = dbStore.upsertStudent({
      ...student,
      ...req.body
    });

    return res.json({ success: true, message: 'Student profile updated.', student: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
