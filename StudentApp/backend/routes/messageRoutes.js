import express from 'express';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/messages/conversations/:userId — Get all conversation threads for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch conversations
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (convErr || !convs || convs.length === 0) {
      return res.json({ conversations: [] });
    }

    // For each conversation, fetch its messages
    const formatted = await Promise.all(convs.map(async (c) => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: true });

      return {
        id: c.id,
        peerId: c.peer_id,
        peerName: c.peer_name,
        peerAvatar: c.peer_avatar,
        lastMessage: c.last_message || '',
        unread: c.unread_count || 0,
        messages: (msgs || []).map(m => ({
          id: m.id,
          sender: m.sender_type || (m.sender_id === userId ? 'user' : 'peer'),
          text: m.text,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      };
    }));

    return res.json({ conversations: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/send — Send a message in a conversation
router.post('/send', async (req, res) => {
  try {
    const { conversationId, senderId, senderType = 'user', text, peerId, peerName, peerAvatar } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ error: 'conversationId and text are required.' });
    }

    // Ensure conversation exists
    await supabase.from('conversations').upsert([{
      id: conversationId,
      peer_id: peerId || null,
      peer_name: peerName || 'Study Peer',
      peer_avatar: peerAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      last_message: text,
      updated_at: new Date().toISOString()
    }], { onConflict: 'id' });

    // Insert message into Supabase
    const msgId = 'msg-' + Date.now();
    const newMsg = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId || 'user',
      sender_type: senderType,
      text: text,
      created_at: new Date().toISOString()
    };

    const { error: msgErr } = await supabase
      .from('messages')
      .insert([newMsg])
      .select()
      .single();

    if (msgErr) {
      console.warn('Supabase message insert error:', msgErr.message);
    }

    // Log MESSAGE_SENT event in Supabase user_logs
    await logUserActivity({
      userId: senderId,
      action: 'MESSAGE_SENT',
      details: { conversationId, textPreview: text.substring(0, 50), senderType },
      req
    });

    return res.status(201).json({
      message: 'Message sent successfully.',
      data: {
        id: msgId,
        sender: senderType,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
