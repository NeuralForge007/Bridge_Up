import express from 'express';
import { dbStore } from '../dbStore.js';
import { rankMentorsForStudent } from '../services/aiMatcher.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// AI Matcher Handler
const handleAIMatch = async (req, res) => {
  try {
    const {
      studentId,
      goal,
      careerGoal,
      domain,
      careerDomain,
      path,
      skills,
      company,
      college_id,
      collegeId,
      experienceYears,
      onlyVerified = true,
      limit = 8
    } = req.body;

    const targetGoal = goal || careerGoal || 'Land a Software Engineer role and master Distributed Systems';
    const targetDomain = domain || careerDomain || 'Software Engineering';

    let student = null;
    if (studentId && dbStore.getStudentById) {
      student = dbStore.getStudentById(studentId);
    }

    if (!student) {
      student = {
        student_id: 9999,
        career_goal: targetGoal,
        career_domain: targetDomain,
        skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : ['Python', 'SQL', 'React', 'Machine Learning'],
        primary_skill: 'Python',
        college_id: collegeId || college_id ? Number(collegeId || college_id) : 1
      };
    }

    const allAlumni = dbStore.getAlumni ? dbStore.getAlumni() : (dbStore.alumni || []);
    const ranked = rankMentorsForStudent(student, allAlumni, {
      careerGoal: targetGoal,
      careerDomain: targetDomain,
      path,
      skills,
      company,
      college_id: collegeId || college_id,
      experienceYears,
      onlyVerified,
      limit
    });

    const enrichedMatches = ranked.map(m => ({
      ...m,
      name: m.name || m.full_name,
      avatar: m.avatar || m.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor',
      role_title: m.role_title || m.current_role || 'Staff Engineer',
      company: m.company || 'Tech Leader',
      college_name: m.college_name || 'Stanford University',
      skills: m.skills || ['Distributed Systems', 'Go', 'System Design', 'GCP'],
      matchScore: m.matchScore || Math.round((m.finalScore || 0.85) * 100),
      matchRationale: m.matchRationale || `${m.name || m.full_name} has high expertise in ${m.career_domain || 'Engineering'} and matches your target goals.`,
      scoreBreakdown: m.scoreBreakdown || {
        skillsScore: 32,
        goalScore: 23,
        domainScore: 14,
        pathScore: 9,
        collegeScore: 10,
        availabilityScore: 5
      }
    }));

    return res.json({
      success: true,
      count: enrichedMatches.length,
      isLocalAI: true,
      query: { goal: targetGoal, domain: targetDomain, skills },
      matches: enrichedMatches,
      mentors: enrichedMatches
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 1. AI Match Endpoints
router.post('/match', handleAIMatch);
router.post('/ai/match', handleAIMatch);

// 2. Get All Mentors (with Filters)
router.get('/', (req, res) => {
  try {
    const { company, search, college_id, verification_status } = req.query;
    let mentors = dbStore.getAlumni ? dbStore.getAlumni({ company, search, college_id, verification_status }) : (dbStore.alumni || []);
    
    mentors = mentors.map(m => ({
      ...m,
      name: m.name || m.full_name,
      avatar: m.avatar || m.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor',
      role_title: m.role_title || m.current_role || 'Software Engineer',
      company: m.company || 'Tech Leader'
    }));

    return res.json({ success: true, count: mentors.length, mentors });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Get Mentor by ID
router.get('/:id', (req, res) => {
  try {
    const mentor = dbStore.getAlumniById ? dbStore.getAlumniById(req.params.id) : dbStore.alumni.find(a => a.id === req.params.id || a.alumni_id === Number(req.params.id));
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    return res.json({ success: true, mentor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Send Mentorship Request
router.post('/request', async (req, res) => {
  try {
    const { student_id, alumni_id, alumniId, goal, note, notes, ai_match_score } = req.body;
    const targetAlumniId = alumni_id || alumniId;
    const targetStudentId = student_id || req.user?.id || 1001;

    const newReq = {
      id: `mreq-${Date.now()}`,
      mentorship_id: Date.now() % 10000,
      student_id: targetStudentId,
      alumni_id: targetAlumniId,
      goal: goal || note || notes || 'Career Guidance & Technical Mentorship',
      note: note || notes || 'Looking for technical interview preparation and career mentorship.',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    if (dbStore.createMentorshipRequest) dbStore.createMentorshipRequest(newReq);
    if (!dbStore.mentorships) dbStore.mentorships = [];
    dbStore.mentorships.unshift(newReq);

    return res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully!',
      request: newReq
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Get Mentorship Requests for Student or Alumni
router.get('/requests/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    let list = dbStore.mentorships || [];

    const enriched = list.map(r => {
      const student = dbStore.students ? dbStore.students.find(s => s.id === r.student_id || s.student_id === Number(r.student_id) || s.user_id === r.student_id) : null;
      const alumni = dbStore.alumni ? dbStore.alumni.find(a => a.id === r.alumni_id || a.alumni_id === Number(r.alumni_id) || a.user_id === r.alumni_id) : null;
      return {
        ...r,
        student_name: student?.name || student?.full_name || 'Student Mentee',
        student_college: student?.college_name || 'University',
        mentor_name: alumni?.name || alumni?.full_name || 'Alumni Mentor',
        mentor_company: alumni?.company || 'Tech Leader',
        meeting_link: r.meeting_link || 'https://meet.google.com/bridgeup-session'
      };
    });

    return res.json({ success: true, count: enriched.length, requests: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Update Mentorship Request Status (Accept / Reject / Complete)
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { status, feedback, meetingLink } = req.body;
    let reqObj = dbStore.mentorships.find(r => r.id === req.params.id || String(r.mentorship_id) === req.params.id);
    if (reqObj) {
      reqObj.status = status;
      if (meetingLink) reqObj.meeting_link = meetingLink;
      if (feedback) reqObj.feedback = feedback;
    }

    return res.json({ success: true, message: `Mentorship ${status?.toLowerCase()}!`, request: reqObj });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
