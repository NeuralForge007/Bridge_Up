import express from 'express';
import { supabase, SEED_STUDY_GROUPS } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/groups — Fetch study groups with membership status
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    let groups = [];
    const { data: dbGroups, error } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbGroups && dbGroups.length > 0) {
      groups = dbGroups;
    } else {
      groups = SEED_STUDY_GROUPS;
    }

    // Check user joined status
    let joinedGroupIds = new Set();
    if (userId) {
      const { data: memberships } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (memberships) {
        joinedGroupIds = new Set(memberships.map(m => m.group_id));
      }
    }

    const formatted = groups.map(g => ({
      id: g.id,
      name: g.name,
      course: g.course,
      description: g.description,
      membersCount: g.members_count || g.membersCount || 1,
      maxMembers: g.max_members || g.maxMembers || 20,
      leader: g.leader,
      meetingTime: g.meeting_time || g.meetingTime,
      location: g.location,
      tags: g.tags || [],
      isJoined: joinedGroupIds.has(g.id) || g.isJoined || false
    }));

    return res.json({ groups: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/join — Toggle join/leave study group
router.post('/join', async (req, res) => {
  try {
    const { groupId, userId, userName } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({ error: 'groupId and userId are required.' });
    }

    // Check if membership exists
    const { data: existing } = await supabase
      .from('study_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    let isJoined = false;

    if (existing) {
      // Leave group
      await supabase.from('study_group_members').delete().eq('id', existing.id);
      isJoined = false;
      // Decrement members count
      try {
        const { data: grp } = await supabase.from('study_groups').select('members_count').eq('id', groupId).single();
        if (grp) {
          await supabase.from('study_groups').update({ members_count: Math.max(1, grp.members_count - 1) }).eq('id', groupId);
        }
      } catch (e) {}

      await logUserActivity({
        userId,
        userName,
        action: 'LEAVE_GROUP',
        details: { groupId },
        req
      });
    } else {
      // Join group
      await supabase.from('study_group_members').insert([{ group_id: groupId, user_id: userId }]);
      isJoined = true;
      // Increment members count
      try {
        const { data: grp } = await supabase.from('study_groups').select('members_count').eq('id', groupId).single();
        if (grp) {
          await supabase.from('study_groups').update({ members_count: (grp.members_count || 1) + 1 }).eq('id', groupId);
        }
      } catch (e) {}

      await logUserActivity({
        userId,
        userName,
        action: 'JOIN_GROUP',
        details: { groupId },
        req
      });
    }

    return res.json({
      message: isJoined ? 'Joined study group!' : 'Left study group.',
      isJoined,
      groupId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/create — Create new study group in Supabase
router.post('/create', async (req, res) => {
  try {
    const { name, course, description, leader, leaderId, meetingTime, location, tags, maxMembers } = req.body;

    if (!name || !course) {
      return res.status(400).json({ error: 'Group name and course are required.' });
    }

    const groupId = 'sg-' + Date.now();
    const newGroup = {
      id: groupId,
      name,
      course,
      description: description || '',
      members_count: 1,
      max_members: maxMembers || 20,
      leader: leader || 'Student Leader',
      leader_id: leaderId || null,
      meeting_time: meetingTime || 'TBD',
      location: location || 'Campus Library',
      tags: tags || []
    };

    await supabase.from('study_groups').insert([newGroup]);

    if (leaderId) {
      await supabase.from('study_group_members').insert([{ group_id: groupId, user_id: leaderId }]);
    }

    await logUserActivity({
      userId: leaderId,
      userName: leader,
      action: 'JOIN_GROUP',
      details: { groupId, groupName: name, course },
      req
    });

    return res.status(201).json({
      message: 'Study group created successfully!',
      group: {
        id: groupId,
        name,
        course,
        description,
        membersCount: 1,
        maxMembers: maxMembers || 20,
        leader,
        meetingTime,
        location,
        tags,
        isJoined: true
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
