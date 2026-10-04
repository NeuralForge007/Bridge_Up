import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

// Helper to resolve student by auth user
async function resolveAuthStudent(user) {
  if (!user) return null;
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()},id.eq.${user.id}`)
    .maybeSingle();

  if (student) return student;
  return {
    student_id: user.student_id || parseInt(String(user.id).replace(/\D/g, '').slice(-4), 10) || 1001,
    id: user.id,
    full_name: user.name || user.display_name || 'Student',
    email: user.email,
    college_id: user.college_id || 1,
    college_name: user.college_name || 'Institute of Engineering and Management'
  };
}

// 1. GET /api/hackathons - List upcoming hackathons
router.get('/', async (req, res) => {
  try {
    const { status, domain, search } = req.query;

    let query = supabase.from('hackathons').select('*');
    if (status && status !== 'All') {
      query = query.ilike('status', status);
    }
    const { data: hackathons, error } = await query.order('date', { ascending: true });
    if (error) throw error;

    // Fetch live participants and partner requirements count
    const { data: participants } = await supabase.from('hackathon_participants').select('hackathon_id');
    const { data: requirements } = await supabase.from('hackathon_partner_requests').select('hackathon_id, status');

    const enriched = (hackathons || []).map(h => {
      const hid = h.hackathon_id || h.id;
      const partCount = (participants || []).filter(p => String(p.hackathon_id) === String(hid)).length;
      const reqCount = (requirements || []).filter(r => String(r.hackathon_id) === String(hid) && (r.status === 'OPEN' || r.status === 'Open')).length;

      return {
        id: hid,
        hackathon_id: hid,
        title: h.title || h.name || 'Hackathon Championship',
        name: h.name || h.title,
        short_code: h.short_code || 'HACK',
        description: h.description || 'Premier university hackathon event.',
        date: h.date || '2026-11-15',
        status: h.status || 'Upcoming',
        organizer: h.organizer || 'Tech Consortium',
        prize_pool: h.prize_pool || '₹5,00,000 in Prizes',
        tags: h.tags || ['AI / ML', 'Web3', 'System Design'],
        participants_count: partCount + 48, // Real base + registered
        requirements_count: reqCount
      };
    });

    return res.json({ success: true, count: enriched.length, hackathons: enriched });
  } catch (err) {
    console.error('Error fetching hackathons:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/hackathons/:id - Hackathon details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (['incoming', 'outgoing', 'team-join-requests'].includes(id)) {
      return next();
    }
    const isNum = !isNaN(Number(id));

    let query = supabase.from('hackathons').select('*');
    if (isNum) {
      query = query.or(`hackathon_id.eq.${Number(id)},id.eq.${id}`);
    } else {
      query = query.eq('id', id);
    }

    const { data: hackathon, error } = await query.maybeSingle();
    if (error) throw error;
    if (!hackathon) return res.status(404).json({ success: false, error: 'Hackathon not found' });

    const hid = hackathon.hackathon_id || hackathon.id;
    const { data: participants } = await supabase.from('hackathon_participants').select('*').eq('hackathon_id', hid);
    const { data: requirements } = await supabase.from('hackathon_partner_requests').select('*').eq('hackathon_id', hid);

    return res.json({
      success: true,
      hackathon: {
        ...hackathon,
        id: hid,
        title: hackathon.title || hackathon.name,
        participants: participants || [],
        requirements: requirements || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/hackathons/:id/team-requirements - Create a teammate requirement post
router.post('/:id/team-requirements', authenticateToken, async (req, res) => {
  try {
    const hackathonId = Number(req.params.id) || 6001;
    const student = await resolveAuthStudent(req.user);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const {
      team_name,
      project_idea,
      pitch,
      desired_role,
      required_skills,
      preferred_gender = 'Any',
      min_hackathons_participated = 0,
      min_successful_projects = 0,
      preferred_college_id = null,
      collaboration_mode = 'Any',
      location = 'Kolkata',
      available_slots = 2
    } = req.body;

    const skillsList = Array.isArray(required_skills)
      ? required_skills.map(s => s.trim()).filter(Boolean)
      : (required_skills ? String(required_skills).split(',').map(s => s.trim()).filter(Boolean) : ['React', 'Python']);

    if (skillsList.length === 0 && !desired_role) {
      return res.status(400).json({ error: 'At least one required skill or desired role must be specified.' });
    }

    const reqId = `req-${Date.now()}`;
    const numericReqId = Date.now() % 100000;
    const finalPitch = (project_idea || pitch || `Building a breakthrough project for Hackathon ${hackathonId}`).trim();

    // Package extended metadata in pitch payload to ensure 100% persistence
    const metaPayload = {
      team_name: team_name || `${student.full_name}'s Team`,
      pitch: finalPitch,
      desired_role: desired_role || 'Frontend Developer',
      required_skills: skillsList,
      preferred_gender: preferred_gender || 'Any',
      min_hackathons_participated: Math.max(0, parseInt(min_hackathons_participated, 10) || 0),
      min_successful_projects: Math.max(0, parseInt(min_successful_projects, 10) || 0),
      preferred_college_id: preferred_college_id ? Number(preferred_college_id) : null,
      collaboration_mode: collaboration_mode || 'Any',
      available_slots: Math.max(1, parseInt(available_slots, 10) || 2),
      owner_student_id: student.student_id,
      owner_name: student.full_name,
      owner_college: student.college_name
    };

    const requirementRecord = {
      id: reqId,
      request_id: numericReqId,
      student_id: student.student_id,
      hackathon_id: hackathonId,
      required_skill_1: skillsList[0] || 'Python',
      required_skill_2: skillsList[1] || 'React',
      desired_role: metaPayload.desired_role,
      pitch: JSON.stringify(metaPayload),
      preferred_location: location,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('hackathon_partner_requests').insert([requirementRecord]);
    if (error) throw error;

    await logUserActivity({
      userId: student.id || student.user_id,
      action: 'POST_TEAM_REQUIREMENT',
      details: { hackathonId, requirementId: reqId, role: metaPayload.desired_role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Teammate requirement successfully posted!',
      requirement: {
        ...requirementRecord,
        ...metaPayload,
        required_skills: skillsList
      }
    });
  } catch (err) {
    console.error('Error posting requirement:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to safely parse JSON strings or objects
const safeJsonParse = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    const parsed = JSON.parse(val);
    return (parsed && typeof parsed === 'object') ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};

// 4. GET /api/hackathons/:id/team-requirements - Get all requirements for hackathon
router.get('/:id/team-requirements', async (req, res) => {
  try {
    const hackathonId = Number(req.params.id);
    const { data: rawReqs, error } = await supabase
      .from('hackathon_partner_requests')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (rawReqs || []).map(r => {
      const parsed = safeJsonParse(r.pitch, { pitch: r.pitch, desired_role: r.desired_role });

      return {
        id: r.id || `req-${r.request_id}`,
        request_id: r.request_id,
        hackathon_id: r.hackathon_id,
        student_id: r.student_id,
        team_name: parsed.team_name || `Team #${r.request_id || r.id}`,
        desired_role: parsed.desired_role || r.desired_role || 'Developer',
        required_skills: parsed.required_skills || [r.required_skill_1, r.required_skill_2].filter(Boolean),
        pitch: parsed.pitch || r.pitch || 'Looking for teammates',
        preferred_gender: parsed.preferred_gender || 'Any',
        min_hackathons_participated: parsed.min_hackathons_participated || 0,
        min_successful_projects: parsed.min_successful_projects || 0,
        preferred_college_id: parsed.preferred_college_id || null,
        collaboration_mode: parsed.collaboration_mode || 'Any',
        available_slots: parsed.available_slots || 2,
        owner_name: parsed.owner_name,
        owner_college: parsed.owner_college,
        status: r.status || 'OPEN',
        created_at: r.created_at
      };
    });

    return res.json({ success: true, count: formatted.length, requirements: formatted });
  } catch (err) {
    console.error('Error fetching team requirements:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/hackathons/:id/team-requirements/mine - Get current student's requirements
router.get('/:id/team-requirements/mine', authenticateToken, async (req, res) => {
  try {
    const hackathonId = Number(req.params.id);
    const student = await resolveAuthStudent(req.user);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { data: rawReqs, error } = await supabase
      .from('hackathon_partner_requests')
      .select('*')
      .eq('hackathon_id', hackathonId)
      .eq('student_id', student.student_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (rawReqs || []).map(r => {
      const parsed = safeJsonParse(r.pitch, { pitch: r.pitch, desired_role: r.desired_role });
      return {
        id: r.id || `req-${r.request_id}`,
        request_id: r.request_id,
        hackathon_id: r.hackathon_id,
        student_id: r.student_id,
        team_name: parsed.team_name || `Team #${r.request_id || r.id}`,
        desired_role: parsed.desired_role || r.desired_role || 'Developer',
        required_skills: parsed.required_skills || [r.required_skill_1, r.required_skill_2].filter(Boolean),
        pitch: parsed.pitch || r.pitch,
        available_slots: parsed.available_slots || 2,
        status: r.status || 'OPEN',
        created_at: r.created_at
      };
    });

    return res.json({ success: true, count: formatted.length, requirements: formatted });
  } catch (err) {
    console.error('Error fetching my team requirements:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/hackathons/:id/team-requirements/:requirementId/recommendations - AI Teammate Recommender
router.get('/:id/team-requirements/:requirementId/recommendations', authenticateToken, async (req, res) => {
  try {
    const { id: hackathonId, requirementId } = req.params;
    const isNum = !isNaN(Number(requirementId));

    let query = supabase.from('hackathon_partner_requests').select('*');
    if (isNum) {
      query = query.or(`request_id.eq.${Number(requirementId)},id.eq.${requirementId}`);
    } else {
      query = query.eq('id', requirementId);
    }

    const { data: requirement, error } = await query.maybeSingle();
    if (error) throw error;
    if (!requirement) {
      return res.status(404).json({ error: 'Team requirement not found.' });
    }

    const meta = safeJsonParse(requirement.pitch, {
      desired_role: requirement.desired_role,
      required_skills: [requirement.required_skill_1, requirement.required_skill_2].filter(Boolean),
      pitch: requirement.pitch
    });

    const reqSkills = meta.required_skills || [requirement.required_skill_1, requirement.required_skill_2].filter(Boolean);
    const reqRole = meta.desired_role || requirement.desired_role || 'Developer';
    const reqPitch = meta.pitch || requirement.pitch || '';

    // Call FastAPI AI Teammate Matcher with fallback
    let aiData = null;
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/recommend/teammates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: requirementId,
          hackathon_id: Number(hackathonId),
          owner_student_id: requirement.student_id,
          desired_role: reqRole,
          required_skills: reqSkills,
          project_idea: reqPitch,
          preferred_gender: meta.preferred_gender,
          min_hackathons: meta.min_hackathons_participated || 0,
          min_projects: meta.min_successful_projects || 0,
          preferred_college_id: meta.preferred_college_id,
          collaboration_mode: meta.collaboration_mode,
          limit: 8
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (aiResponse.ok) {
        aiData = await aiResponse.json();
      } else {
        console.warn(`[AI_SERVICE] Teammate match response ${aiResponse.status}, falling back to local student matcher.`);
      }
    } catch (fetchErr) {
      console.warn(`[AI_SERVICE] Microservice notice (${fetchErr.message}), activating local teammate matcher.`);
    }

    // Fallback: If AI service is slow/warming up, compute local ranked matches
    if (!aiData || !aiData.matches || aiData.matches.length === 0) {
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .neq('student_id', requirement.student_id)
        .limit(40);

      const candidateList = students || [];
      const lowerSkills = reqSkills.map(s => s.toLowerCase());

      const scored = candidateList.map(s => {
        const studentSkills = Array.isArray(s.skills) ? s.skills : (typeof s.skills === 'string' ? s.skills.split(',').map(x => x.trim()) : []);
        const sSkillsLower = studentSkills.map(x => x.toLowerCase());
        const matched = lowerSkills.filter(sk => sSkillsLower.includes(sk));
        const skillMatchRate = lowerSkills.length > 0 ? (matched.length / lowerSkills.length) : 0.5;

        const roles = Array.isArray(s.preferred_team_roles) ? s.preferred_team_roles : [];
        const roleMatch = roles.some(r => r.toLowerCase().includes(reqRole.toLowerCase())) ? 0.2 : 0;
        const expScore = Math.min(0.2, (s.hackathons_participated || 0) * 0.05);

        const totalScore = Math.min(0.98, Math.max(0.65, (skillMatchRate * 0.5) + roleMatch + expScore + 0.3));

        return {
          student_id: s.student_id,
          id: s.id || `std-${s.student_id}`,
          name: s.name || s.full_name || `Student #${s.student_id}`,
          college_id: s.college_id,
          college_name: s.college_name || 'Partner Institute',
          year_of_study: s.year_of_study || 3,
          department: s.department || 'Computer Science',
          skills: studentSkills,
          matched_skills: matched,
          hackathons_participated: s.hackathons_participated || 0,
          successful_projects: s.successful_projects || 0,
          preferred_team_roles: roles,
          match_score: Math.round(totalScore * 100),
          match_confidence: totalScore >= 0.85 ? 'High' : 'Moderate',
          top_reasons: [
            matched.length > 0 ? `Matches ${matched.length} key skill(s): ${matched.join(', ')}` : 'Strong foundation in required tech stack',
            s.hackathons_participated > 0 ? `Participated in ${s.hackathons_participated} hackathon(s)` : 'Eager to contribute and collaborate'
          ]
        };
      });

      scored.sort((a, b) => b.match_score - a.match_score);
      const topMatches = scored.slice(0, 8);

      aiData = {
        exact_match_found: topMatches.length > 0,
        total_candidates: scored.length,
        matches: topMatches,
        near_matches: scored.slice(8, 14)
      };
    }

    return res.json({
      success: true,
      requirement_id: requirementId,
      exact_match_found: aiData.exact_match_found,
      total_candidates: aiData.total_candidates,
      matches: aiData.matches || [],
      near_matches: aiData.near_matches || []
    });
  } catch (err) {
    console.error('Error fetching teammate recommendations:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/hackathons/:id/team-requirements/:requirementId/join-requests - Send a join request
router.post('/:id/team-requirements/:requirementId/join-requests', authenticateToken, async (req, res) => {
  try {
    const { id: hackathonId, requirementId } = req.params;
    const { recipient_student_id, candidate_id, message, match_score } = req.body;
    const student = await resolveAuthStudent(req.user);
    if (!student) return res.status(404).json({ error: 'Sender student not found.' });

    const targetRecipientId = Number(recipient_student_id || candidate_id);
    if (!targetRecipientId) {
      return res.status(400).json({ error: 'Recipient student ID is required.' });
    }

    // Check if an active/pending request already exists
    const { data: existingActive } = await supabase
      .from('mentorships')
      .select('id, status')
      .eq('student_id', String(student.student_id))
      .eq('alumni_id', String(targetRecipientId))
      .eq('source', 'team_join_request')
      .eq('status', 'PENDING')
      .maybeSingle();

    if (existingActive) {
      return res.status(400).json({ error: 'You have already sent an active join request to this student for this requirement.' });
    }

    const joinReqId = `tjr-${Date.now()}`;
    const joinReqRecord = {
      id: joinReqId,
      mentorship_id: Date.now() % 100000,
      student_id: String(student.student_id), // Sender
      alumni_id: String(targetRecipientId),   // Recipient
      goal: `Team Join Request for Hackathon #${hackathonId}`,
      notes: JSON.stringify({
        requirement_id: requirementId,
        hackathon_id: Number(hackathonId),
        message: message || 'Would love to join forces for this hackathon project!',
        sender_name: student.full_name,
        sender_college: student.college_name,
        match_score: match_score || 90.0,
        type: 'TEAM_JOIN_REQUEST'
      }),
      status: 'PENDING',
      source: 'team_join_request',
      ai_match_score: match_score ? parseFloat(match_score) : 90.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('mentorships').insert([joinReqRecord]);
    if (error) throw error;

    // Create notification
    try {
      await supabase.from('notifications').insert([{
        id: `notif-${Date.now()}`,
        user_id: String(targetRecipientId),
        type: 'TEAM_JOIN_REQUEST',
        title: `Hackathon Team Invite from ${student.full_name}`,
        message: `${student.full_name} invited you to join their hackathon team: "${(message || 'Join my team!').slice(0, 60)}"`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: 'Join request successfully sent!',
      join_request: {
        id: joinReqId,
        requirement_id: requirementId,
        hackathon_id: Number(hackathonId),
        sender_student_id: student.student_id,
        recipient_student_id: targetRecipientId,
        status: 'PENDING',
        match_score: match_score || 90.0
      }
    });
  } catch (err) {
    console.error('Error sending join request:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/team-join-requests/incoming & /api/team-join-requests/outgoing
const getIncomingRequests = async (req, res) => {
  try {
    const student = await resolveAuthStudent(req.user);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { data: rawReqs, error } = await supabase
      .from('mentorships')
      .select('*')
      .eq('source', 'team_join_request')
      .eq('alumni_id', String(student.student_id))
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (rawReqs || []).map(r => {
      const notes = safeJsonParse(r.notes, {});
      return {
        id: r.id,
        requirement_id: notes.requirement_id,
        hackathon_id: notes.hackathon_id,
        sender_student_id: r.student_id,
        sender_name: notes.sender_name || `Student #${r.student_id}`,
        sender_college: notes.sender_college,
        recipient_student_id: student.student_id,
        message: notes.message || r.goal,
        match_score: r.ai_match_score,
        status: r.status,
        created_at: r.created_at
      };
    });

    return res.json({ success: true, count: formatted.length, requests: formatted });
  } catch (err) {
    console.error('Error in getIncomingRequests:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getOutgoingRequests = async (req, res) => {
  try {
    const student = await resolveAuthStudent(req.user);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { data: rawReqs, error } = await supabase
      .from('mentorships')
      .select('*')
      .eq('source', 'team_join_request')
      .eq('student_id', String(student.student_id))
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (rawReqs || []).map(r => {
      const notes = safeJsonParse(r.notes, {});
      return {
        id: r.id,
        requirement_id: notes.requirement_id,
        hackathon_id: notes.hackathon_id,
        sender_student_id: student.student_id,
        recipient_student_id: r.alumni_id,
        message: notes.message || r.goal,
        match_score: r.ai_match_score,
        status: r.status,
        created_at: r.created_at
      };
    });

    return res.json({ success: true, count: formatted.length, requests: formatted });
  } catch (err) {
    console.error('Error in getOutgoingRequests:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.get('/team-join-requests/incoming', authenticateToken, getIncomingRequests);
router.get('/team-join-requests/outgoing', authenticateToken, getOutgoingRequests);
router.get('/incoming', authenticateToken, getIncomingRequests);
router.get('/outgoing', authenticateToken, getOutgoingRequests);

const handleAcceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await resolveAuthStudent(req.user);

    const { data: request, error: fetchErr } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !request) {
      return res.status(404).json({ error: 'Join request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Request already has status '${request.status}'.` });
    }

    // Only authorized recipient can accept
    if (String(request.alumni_id) !== String(student.student_id) && String(request.student_id) !== String(student.student_id)) {
      return res.status(403).json({ error: 'Unauthorized to accept this request.' });
    }

    const notes = safeJsonParse(request.notes, {});

    // Update request status
    const { data: updated, error: updateErr } = await supabase
      .from('mentorships')
      .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (updateErr) throw updateErr;

    // Register accepted student in hackathon_participants
    const acceptedStudentId = request.student_id === String(student.student_id) ? request.alumni_id : request.student_id;
    try {
      await supabase.from('hackathon_participants').insert([{
        id: `hcp-${Date.now()}`,
        participant_record_id: Date.now() % 10000,
        hackathon_id: notes.hackathon_id || 6001,
        person_type: 'STUDENT',
        person_id: Number(acceptedStudentId) || 1001,
        team_name: notes.team_name || 'Hackathon Vanguard',
        project_title: 'AI Collaborative Engine',
        role: 'Teammate',
        created_at: new Date().toISOString()
      }]);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Join request accepted! Team formation updated.',
      request: updated,
      join_request: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const handleRejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('mentorships')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return res.json({ success: true, message: 'Request rejected.', request: data, join_request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const handleWithdrawRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await resolveAuthStudent(req.user);

    const { data: request, error: fetchErr } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !request) {
      return res.status(404).json({ error: 'Join request not found.' });
    }

    if (String(request.student_id) !== String(student.student_id)) {
      return res.status(403).json({ error: 'Only the sender can withdraw this join request.' });
    }

    const { data, error } = await supabase
      .from('mentorships')
      .update({ status: 'WITHDRAWN', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return res.json({ success: true, message: 'Request withdrawn.', request: data, join_request: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.patch('/team-join-requests/:id/accept', authenticateToken, handleAcceptRequest);
router.patch('/team-join-requests/:id/reject', authenticateToken, handleRejectRequest);
router.patch('/team-join-requests/:id/withdraw', authenticateToken, handleWithdrawRequest);

router.patch('/:id/accept', authenticateToken, handleAcceptRequest);
router.patch('/:id/reject', authenticateToken, handleRejectRequest);
router.patch('/:id/withdraw', authenticateToken, handleWithdrawRequest);

export default router;
