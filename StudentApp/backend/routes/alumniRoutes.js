import express from 'express';
import { dbStore } from '../dbStore.js';

const router = express.Router();

// 1. Get All Alumni Mentors
router.get('/', (req, res) => {
  try {
    const { search, company, college_id, verification_status } = req.query;
    const alumni = dbStore.getAlumni({ search, company, college_id, verification_status });
    return res.json({ success: true, count: alumni.length, alumni });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Alumni by ID
router.get('/:id', (req, res) => {
  try {
    const alumni = dbStore.getAlumniById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    return res.json({ success: true, alumni });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Update Alumni Profile
router.patch('/:id', (req, res) => {
  try {
    const alumni = dbStore.getAlumniById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });

    const updated = dbStore.upsertAlumni({
      ...alumni,
      ...req.body
    });

    return res.json({ success: true, message: 'Alumni profile updated.', alumni: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
