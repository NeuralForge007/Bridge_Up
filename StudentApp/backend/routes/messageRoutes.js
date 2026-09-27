import express from 'express';
import { supabase } from '../supabaseClient.js';
import { dbStore } from '../dbStore.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// Helper to resolve all user IDs
async function resolveUserAliases(userId) {
  const ids = new Set([String(userId).trim()]);
  const user = dbStore.findUserById ? dbStore.findUserById(userId) : dbStore.users.find(u => String(u.id) === String(userId) || String(u.user_id) === String(userId) || u.email?.toLowerCase() === String(userId).toLowerCase());
  if (user) {
    if (user.id) ids.add(String(user.id));
    if (user.user_id) ids.add(String(user.user_id));
    if (user.email) ids.add(String(user.email).toLowerCase());
  }
  const alumni = dbStore.alumni?.find(a => String(a.id) === String(userId) || String(a.alumni_id) === String(userId) || String(a.user_id) === String(userId) || a.email?.toLowerCase() === String(userId).toLowerCase());
  if (alumni) {
    if (alumni.id) ids.add(String(alumni.id));
    if (alumni.alumni_id) ids.add(String(alumni.alumni_id));
    if (alumni.user_id) ids.add(String(alumni.user_id));
    if (alumni.email) ids.add(String(alumni.email).toLowerCase());
  }
  const student = dbStore.students?.find(s => String(s.id) === String(userId) || String(s.student_id) === String(userId) || String(s.user_id) === String(userId) || s.email?.toLowerCase() === String(userId).toLowerCase());
  if (student) {
    if (student.id) ids.add(String(student.id));
    if (student.student_id) ids.add(String(student.student_id));
    if (student.user_id) ids.add(String(student.user_id));
    if (student.email) ids.add(String(student.email).toLowerCase());
  }
  return Array.from(ids);
}

// GET /api/messages/conversations/:userId — Get all conversation threads for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const aliases = await resolveUserAliases(userId);

    // Fetch conversations from Supabase
    let supaConvs = [];
    try {
      const { data, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!convErr && data) {
        supaConvs = data;
      }
    } catch (e) {
      console.warn('Conversations Supabase query note:', e.message);
    }

    const memoryConvs = dbStore.conversations || [];
    const convMap = new Map();
    [...supaConvs, ...memoryConvs].forEach(c => {
      if (c && c.id && !convMap.has(c.id)) {
        convMap.set(c.id, c);
      }
    });

    const allConvs = Array.from(convMap.values());
    let filteredConvs = allConvs.filter(c => {
      if (!c) return false;
      if (Array.isArray(c.participant_ids) && c.participant_ids.some(p => aliases.some(a => String(p).toLowerCase() === a.toLowerCase()))) return true;
      if (c.student_id && aliases.some(a => String(c.student_id).toLowerCase() === a.toLowerCase())) return true;
      if (c.alumni_id && aliases.some(a => String(c.alumni_id).toLowerCase() === a.toLowerCase())) return true;
      if (c.peer_id && aliases.some(a => String(c.peer_id).toLowerCase() === a.toLowerCase())) return true;
      if (aliases.some(a => String(c.id).toLowerCase().includes(a.toLowerCase()))) return true;
      return false;
    });

    // If empty and user is looking for demo messages
    if (filteredConvs.length === 0) {
      filteredConvs = [
        {
          id: 'conv-1',
          peer_id: 'peer-1',
          peer_name: 'David Kim',
          peer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
          last_message: 'Awesome! Are you coming to the CS301 review session tonight?',
          unread_count: 1
        }
      ];
    }

    // For each conversation, fetch messages
    const formatted = await Promise.all(filteredConvs.map(async (c) => {
      let supaMsgs = [];
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: true });
        if (data && data.length > 0) supaMsgs = data;
      } catch (e) {}

      const memMsgs = (dbStore.messages || []).filter(m => m.conversation_id === c.id);
      const msgMap = new Map();
      [...supaMsgs, ...memMsgs].forEach(m => {
        if (m && m.id && !msgMap.has(m.id)) {
          msgMap.set(m.id, m);
        }
      });
      let msgs = Array.from(msgMap.values()).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

      if (msgs.length === 0 && c.id === 'conv-1') {
        msgs = [
          { id: 'm1', sender_id: 'peer-1', sender_type: 'peer', text: 'Hey! Did you finish the graph traversal problem for CS301?', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'm2', sender_id: userId, sender_type: 'user', text: 'Working on Dijkstra right now! Almost done with the priority queue implementation.', created_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'm3', sender_id: 'peer-1', sender_type: 'peer', text: 'Awesome! Are you coming to the CS301 review session tonight?', created_at: new Date(Date.now() - 600000).toISOString() }
        ];
      }

      // Determine peer details depending on who is viewing
      let peerName = c.peer_name || 'Study Peer';
      let peerAvatar = c.peer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerName)}`;
      let peerId = c.peer_id || 'peer-1';

      if (c.student_id && c.alumni_id) {
        const isAlumniViewing = aliases.some(a => a.toLowerCase() === String(c.alumni_id).toLowerCase());
        if (isAlumniViewing) {
          const studentObj = dbStore.students?.find(s => String(s.id) === String(c.student_id) || String(s.student_id) === String(c.student_id) || String(s.user_id) === String(c.student_id) || s.email?.toLowerCase() === String(c.student_id).toLowerCase());
          peerName = studentObj?.name || studentObj?.full_name || studentObj?.display_name || c.peer_name || 'Student Mentee';
          peerAvatar = studentObj?.avatar || c.peer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerName)}`;
          peerId = String(c.student_id);
        } else {
          const alumniObj = dbStore.alumni?.find(a => String(a.id) === String(c.alumni_id) || String(a.alumni_id) === String(c.alumni_id) || String(a.user_id) === String(c.alumni_id) || a.email?.toLowerCase() === String(c.alumni_id).toLowerCase());
          peerName = alumniObj?.name || alumniObj?.full_name || 'Alumni Mentor';
          peerAvatar = alumniObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerName)}`;
          peerId = String(c.alumni_id);
        }
      }

      return {
        id: c.id,
        peerId,
        peerName,
        peerAvatar,
        lastMessage: c.last_message || (msgs[msgs.length - 1]?.text) || '',
        unread: c.unread_count || 0,
        messages: msgs.map(m => ({
          id: m.id,
          sender: aliases.some(a => a.toLowerCase() === String(m.sender_id).toLowerCase()) || m.sender_type === 'user' ? 'user' : 'peer',
          text: m.text,
          timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    const convRecord = {
      id: conversationId,
      participant_ids: [String(senderId), String(peerId || 'peer')],
      peer_id: peerId || null,
      peer_name: peerName || 'Peer',
      peer_avatar: peerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerName || 'peer')}`,
      last_message: text,
      updated_at: new Date().toISOString()
    };

    // Update in-memory dbStore
    if (!dbStore.conversations) dbStore.conversations = [];
    const convIdx = dbStore.conversations.findIndex(c => c.id === conversationId);
    if (convIdx !== -1) {
      dbStore.conversations[convIdx] = { ...dbStore.conversations[convIdx], ...convRecord };
    } else {
      dbStore.conversations.unshift(convRecord);
    }

    const msgId = 'msg-' + Date.now();
    const newMsg = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: String(senderId || 'user'),
      sender_type: senderType,
      text: text,
      created_at: new Date().toISOString()
    };

    if (!dbStore.messages) dbStore.messages = [];
    dbStore.messages.push(newMsg);

    // Save to Supabase
    try {
      await supabase.from('conversations').upsert([convRecord], { onConflict: 'id' });
      await supabase.from('messages').insert([newMsg]);
    } catch (e) {
      console.warn('Supabase message sync error:', e.message);
    }

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
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
