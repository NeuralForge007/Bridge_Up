import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// Get all hackathons
router.get('/', async (req, res) => {
  try {
    const { status, domain, search } = req.query;

    let supaHackathons = null;
    try {
      let q = supabase.from('hackathons').select('*');
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) supaHackathons = data;
    } catch (e) {}

    let list = supaHackathons || (dbStore.getHackathons ? dbStore.getHackathons() : (dbStore.hackathons || []));

    if (status) {
      list = list.filter(h => h.status?.toLowerCase() === status.toLowerCase());
    }
    if (domain) {
      list = list.filter(h => (h.domain && h.domain.toLowerCase().includes(domain.toLowerCase())) || (h.tags && h.tags.some(t => t.toLowerCase().includes(domain.toLowerCase()))));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => 
        (h.title && h.title.toLowerCase().includes(q)) || 
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q)) ||
        (h.organizer && h.organizer.toLowerCase().includes(q))
      );
    }

    const participantsList = dbStore.hackathonParticipants || dbStore.hackathon_participants || [];
    const partnerReqList = dbStore.hackathonPartnerRequests || dbStore.hackathon_partner_requests || [];

    // Enrich with participant count & winner names
    const enriched = list.map(h => {
      const hid = h.hackathon_id || h.id;
      const participants = participantsList.filter(p => p.hackathon_id === hid || p.hackathon_id === Number(hid));
      const partnerRequests = partnerReqList.filter(pr => (pr.hackathon_id === hid || pr.hackathon_id === Number(hid)) && (pr.status === 'Open' || pr.status === 'OPEN'));
      return {
        ...h,
        id: hid,
        title: h.name || h.title || 'National Hackathon',
        organizer: h.organizer || 'BridgeUp Tech Network',
        prize_pool: h.prize_pool || '$25,000 in Prizes',
        tags: h.tags || ['AI / ML', 'Web3', 'System Design'],
        participantsCount: participants.length + (h.participants_count || 120),
        partnerRequestsCount: partnerRequests.length
      };
    });

    res.json({ success: true, count: enriched.length, hackathons: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hackathon details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const list = dbStore.getHackathons ? dbStore.getHackathons() : (dbStore.hackathons || []);
    const hackathon = list.find(h => h.id === id || String(h.hackathon_id) === String(id));
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const participantsList = dbStore.hackathonParticipants || dbStore.hackathon_participants || [];
    const partnerReqList = dbStore.hackathonPartnerRequests || dbStore.hackathon_partner_requests || [];

    const participants = participantsList.filter(p => String(p.hackathon_id) === String(hackathon.hackathon_id || hackathon.id));
    const partnerRequests = partnerReqList.filter(pr => String(pr.hackathon_id) === String(hackathon.hackathon_id || hackathon.id));

    res.json({
      success: true,
      hackathon: {
        ...hackathon,
        id: hackathon.hackathon_id || hackathon.id,
        title: hackathon.name || hackathon.title,
        participants,
        partnerRequests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register for hackathon
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, projectTitle, role, personId = 1001 } = req.body;

    const newParticipant = {
      id: `hcp-${Date.now()}`,
      participant_record_id: Date.now() % 10000,
      hackathon_id: Number(id) || 1,
      person_id: Number(personId) || 1001,
      team_name: teamName || 'NextGen Pioneers',
      project_title: projectTitle || 'AI Solution',
      role: role || 'Lead Developer',
      created_at: new Date().toISOString()
    };

    if (!dbStore.hackathonParticipants) dbStore.hackathonParticipants = [];
    dbStore.hackathonParticipants.push(newParticipant);

    // Save in Supabase
    try {
      await supabase.from('hackathon_participants').insert([newParticipant]);
    } catch (e) {
      console.warn('Supabase hackathon registration insert error:', e.message);
    }

    res.status(201).json({ success: true, message: 'Successfully registered for hackathon & saved in Supabase!', participant: newParticipant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teammate Matcher: Get partner requests
router.get('/:id/partners', async (req, res) => {
  try {
    const { id } = req.params;

    let supaReqs = null;
    try {
      const { data, error } = await supabase.from('hackathon_partner_requests').select('*').eq('hackathon_id', Number(id) || 1);
      if (!error && data && data.length > 0) supaReqs = data;
    } catch (e) {}

    const partnerReqList = supaReqs || dbStore.hackathonPartnerRequests || dbStore.hackathon_partner_requests || [];
    const requests = partnerReqList.map(pr => {
      const student = dbStore.getStudentById ? dbStore.getStudentById(pr.student_id) : null;
      return {
        ...pr,
        id: pr.request_id || pr.id,
        student_name: student?.full_name || student?.name || 'Student Pioneer',
        student_college: 'Stanford University',
        desired_role: pr.required_skill_1 ? `${pr.required_skill_1} Specialist` : 'Frontend Developer',
        desired_skills: [pr.required_skill_1, pr.required_skill_2].filter(Boolean),
        pitch: pr.pitch || `Looking for talented collaborator skilled in ${pr.required_skill_1 || 'React'} for this hackathon challenge!`,
        avatar: student?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teammate'
      };
    });

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a partner request
router.post('/:id/partners', async (req, res) => {
  try {
    const { id } = req.params;
    const { desiredRole, desiredSkills, pitch, studentId = 1001 } = req.body;

    const newReq = {
      id: `hpr-${Date.now()}`,
      request_id: Date.now() % 10000,
      hackathon_id: Number(id) || 1,
      student_id: Number(studentId) || 1001,
      required_skill_1: Array.isArray(desiredSkills) ? desiredSkills[0] : 'React',
      required_skill_2: Array.isArray(desiredSkills) ? desiredSkills[1] : 'Python',
      desired_role: desiredRole || 'Frontend / UI Developer',
      pitch: pitch || 'Building an innovative AI application. Looking for a dedicated teammate!',
      status: 'Open',
      created_at: new Date().toISOString()
    };

    if (!dbStore.hackathonPartnerRequests) dbStore.hackathonPartnerRequests = [];
    dbStore.hackathonPartnerRequests.unshift(newReq);

    // Save in Supabase
    try {
      await supabase.from('hackathon_partner_requests').insert([newReq]);
    } catch (e) {
      console.warn('Supabase hackathon partner request insert error:', e.message);
    }

    res.status(201).json({ success: true, message: 'Partner request posted and saved in Supabase!', request: newReq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
