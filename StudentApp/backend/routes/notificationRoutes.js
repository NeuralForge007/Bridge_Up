import express from 'express';
import { dbStore } from '../dbStore.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user's notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const student = dbStore.students.find(s => s.user_id === req.user.id);
    const alumni = dbStore.alumni.find(a => a.user_id === req.user.id);

    const userIds = [req.user.id];
    if (student) userIds.push(student.id);
    if (alumni) userIds.push(alumni.id);

    const notifs = (dbStore.notifications || []).filter(n => userIds.includes(n.user_id) || n.user_id === 'all');

    res.json({
      success: true,
      count: notifs.length,
      unreadCount: notifs.filter(n => !n.is_read).length,
      notifications: notifs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a single notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notif = dbStore.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
    }
    res.json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.post('/read-all', authenticateToken, (req, res) => {
  try {
    const student = dbStore.students.find(s => s.user_id === req.user.id);
    const alumni = dbStore.alumni.find(a => a.user_id === req.user.id);
    const userIds = [req.user.id];
    if (student) userIds.push(student.id);
    if (alumni) userIds.push(alumni.id);

    (dbStore.notifications || []).forEach(n => {
      if (userIds.includes(n.user_id) || n.user_id === 'all') {
        n.is_read = true;
      }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
