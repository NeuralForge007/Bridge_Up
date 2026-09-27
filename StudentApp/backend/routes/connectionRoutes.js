import express from 'express';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/connections/:userId — Get all active connections for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_id.eq.${userId},peer_id.eq.${userId}`)
      .eq('status', 'connected');

    if (error) {
      return res.json({ connections: [] });
    }

    return res.json({ connections: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/connections/toggle — Toggle connection state between current user and a peer
router.post('/toggle', async (req, res) => {
  try {
    const { userId, peerId } = req.body;

    if (!userId || !peerId) {
      return res.status(400).json({ error: 'userId and peerId are required.' });
    }

    // Check if connection exists
    const { data: existing } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user_id.eq.${userId},peer_id.eq.${peerId}),and(user_id.eq.${peerId},peer_id.eq.${userId})`)
      .maybeSingle();

    let newStatus = 'connected';

    if (existing) {
      newStatus = existing.status === 'connected' ? 'disconnected' : 'connected';
      await supabase
        .from('connections')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('connections')
        .insert([{ user_id: userId, peer_id: peerId, status: 'connected' }]);
    }

    // Log in Supabase user_logs
    await logUserActivity({
      userId,
      action: newStatus === 'connected' ? 'CONNECT' : 'DISCONNECT',
      details: { peerId, newStatus },
      req
    });

    return res.json({
      message: `Peer connection ${newStatus}`,
      status: newStatus,
      peerId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
