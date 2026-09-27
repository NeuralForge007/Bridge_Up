import express from 'express';
import { dbStore } from '../dbStore.js';
import { supabase } from '../supabaseClient.js';
import { rankMentorsForStudent } from '../services/aiMatcher.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// Helper to resolve all possible matching identifiers for a user
async function resolveUserIdentifiers(userId) {
  const ids = new Set([String(userId).trim()]);
  
  // Check memory store
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

  // Also query Supabase users & alumni & students
  try {
    const { data: supaUser } = await supabase.from('users').select('*').or(`id.eq.${userId},email.eq.${userId}`).maybeSingle();
    if (supaUser) {
      if (supaUser.id) ids.add(String(supaUser.id));
      if (supaUser.email) ids.add(String(supaUser.email).toLowerCase());
    }

    const { data: supaAlumni } = await supabase.from('alumni').select('*').or(`id.eq.${userId},email.eq.${userId}`).maybeSingle();
    if (supaAlumni) {
      if (supaAlumni.id) ids.add(String(supaAlumni.id));
      if (supaAlumni.alumni_id) ids.add(String(supaAlumni.alumni_id));
      if (supaAlumni.user_id) ids.add(String(supaAlumni.user_id));
      if (supaAlumni.email) ids.add(String(supaAlumni.email).toLowerCase());
    }

    const { data: supaStudent } = await supabase.from('students').select('*').or(`id.eq.${userId},email.eq.${userId}`).maybeSingle();
    if (supaStudent) {
      if (supaStudent.id) ids.add(String(supaStudent.id));
      if (supaStudent.student_id) ids.add(String(supaStudent.student_id));
      if (supaStudent.user_id) ids.add(String(supaStudent.user_id));
      if (supaStudent.email) ids.add(String(supaStudent.email).toLowerCase());
    }
  } catch (e) {}

  return Array.from(ids);
}

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
router.get('/', async (req, res) => {
  try {
    const { company, search, college_id, verification_status } = req.query;

    let mentors = dbStore.getAlumni ? dbStore.getAlumni({ company, search, college_id, verification_status }) : (dbStore.alumni || []);
    
    mentors = mentors.map(m => ({
      ...m,
      id: m.id || `alm-${m.alumni_id}`,
      name: m.name || m.full_name,
      avatar: m.avatar || m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.full_name || m.name || 'Mentor')}`,
      role_title: m.role_title || m.current_role || 'Software Engineer',
      company: m.company || 'Tech Leader'
    }));

    return res.json({ success: true, count: mentors.length, mentors });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Get Mentor by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = dbStore.getAlumniById ? dbStore.getAlumniById(req.params.id) : dbStore.alumni.find(a => a.id === req.params.id || a.alumni_id === Number(req.params.id) || a.user_id === req.params.id);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
    return res.json({ success: true, mentor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Send Mentorship Request
router.post('/request', async (req, res) => {
  try {
    const {
      student_id,
      studentId,
      studentName,
      studentEmail,
      studentAvatar,
      studentMajor,
      studentCollege,
      studentGpa,
      studentSkills,
      alumni_id,
      alumniId,
      mentorName,
      mentorCompany,
      mentorAvatar,
      goal,
      note,
      notes,
      ai_match_score
    } = req.body;

    const targetAlumniId = String(alumni_id || alumniId).trim();
    const targetStudentId = String(student_id || studentId || req.user?.id || 'demo-1').trim();

    // Fetch student info
    let studentObj = dbStore.findUserById ? dbStore.findUserById(targetStudentId) : null;
    if (!studentObj && dbStore.students) {
      studentObj = dbStore.students.find(s => String(s.id) === targetStudentId || String(s.student_id) === targetStudentId || String(s.user_id) === targetStudentId || s.email?.toLowerCase() === targetStudentId.toLowerCase());
    }
    if (!studentObj) {
      try {
        const { data } = await supabase.from('users').select('*').or(`id.eq.${targetStudentId},email.eq.${targetStudentId}`).maybeSingle();
        if (data) studentObj = data;
      } catch (e) {}
    }

    // Fetch mentor info
    let mentorObj = dbStore.getAlumniById ? dbStore.getAlumniById(targetAlumniId) : null;
    if (!mentorObj && dbStore.alumni) {
      mentorObj = dbStore.alumni.find(a => String(a.id) === targetAlumniId || String(a.alumni_id) === targetAlumniId || String(a.user_id) === targetAlumniId || a.email?.toLowerCase() === targetAlumniId.toLowerCase());
    }
    if (!mentorObj) {
      try {
        const { data } = await supabase.from('alumni').select('*').or(`id.eq.${targetAlumniId},email.eq.${targetAlumniId}`).maybeSingle();
        if (data) mentorObj = data;
      } catch (e) {}
    }

    const finalStudentName = studentName || studentObj?.name || studentObj?.display_name || studentObj?.full_name || 'Student Mentee';
    const finalStudentEmail = studentEmail || studentObj?.email || 'student@university.edu';
    const finalStudentAvatar = studentAvatar || studentObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalStudentEmail)}`;
    const finalStudentCollege = studentCollege || studentObj?.college_name || 'Stanford University';
    const finalStudentMajor = studentMajor || studentObj?.major || studentObj?.department || 'Computer Science';
    const finalStudentGpa = studentGpa || studentObj?.gpa || studentObj?.cgpa || '3.85';
    const finalStudentSkills = studentSkills || studentObj?.skills || ['React', 'Python', 'Machine Learning'];

    const finalMentorName = mentorName || mentorObj?.name || mentorObj?.full_name || 'Alumni Mentor';
    const finalMentorCompany = mentorCompany || mentorObj?.company || 'Tech Leader';
    const finalMentorAvatar = mentorAvatar || mentorObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalMentorName)}`;

    const reqId = `mreq-${Date.now()}`;
    const mentorshipNumId = Date.now() % 100000;
    const finalGoal = goal || note || notes || 'Career Guidance & Technical Mentorship';
    const finalNote = note || notes || 'Looking for technical interview preparation and career mentorship.';

    const newReq = {
      id: reqId,
      mentorship_id: mentorshipNumId,
      student_id: targetStudentId,
      student_name: finalStudentName,
      student_email: finalStudentEmail,
      student_avatar: finalStudentAvatar,
      student_college: finalStudentCollege,
      student_major: finalStudentMajor,
      student_gpa: finalStudentGpa,
      student_skills: finalStudentSkills,
      alumni_id: targetAlumniId,
      mentor_name: finalMentorName,
      mentor_company: finalMentorCompany,
      mentor_avatar: finalMentorAvatar,
      goal: finalGoal,
      note: finalNote,
      notes: finalNote,
      status: 'PENDING',
      ai_match_score: ai_match_score || 88.0,
      meeting_link: 'https://meet.google.com/bridgeup-mentorship',
      created_at: new Date().toISOString()
    };

    if (dbStore.createMentorshipRequest) dbStore.createMentorshipRequest(newReq);
    if (!dbStore.mentorships) dbStore.mentorships = [];
    dbStore.mentorships.unshift(newReq);

    // Save to Supabase
    try {
      await supabase.from('mentorships').insert([{
        id: newReq.id,
        mentorship_id: newReq.mentorship_id,
        student_id: newReq.student_id,
        alumni_id: newReq.alumni_id,
        goal: newReq.goal,
        notes: newReq.note,
        status: 'PENDING',
        ai_match_score: newReq.ai_match_score,
        meeting_link: newReq.meeting_link,
        created_at: newReq.created_at
      }]);
    } catch (supaErr) {
      console.warn('Supabase mentorship insert note:', supaErr.message);
    }

    // Create Notification for the Alumni
    const notifObj = {
      id: `notif-${Date.now()}`,
      user_id: targetAlumniId,
      type: 'MENTOR_REQUEST',
      title: `New Mentorship Request from ${finalStudentName}`,
      message: `${finalStudentName} (${finalStudentMajor}) has requested mentorship with you: "${finalNote.slice(0, 60)}..."`,
      link: '/alumni-dashboard',
      created_at: new Date().toISOString()
    };
    dbStore.createNotification(notifObj);
    try {
      await supabase.from('notifications').insert([notifObj]);
    } catch (e) {}

    await logUserActivity({
      userId: targetStudentId,
      action: 'REQUEST_MENTOR',
      details: { alumniId: targetAlumniId, mentorName: finalMentorName, goal: finalGoal },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Mentorship request sent to ${finalMentorName}!`,
      request: newReq
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Get Mentorship Requests for Student or Alumni
router.get('/requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userAliases = await resolveUserIdentifiers(userId);

    // Fetch from Supabase
    let supaReqs = [];
    try {
      const { data, error } = await supabase
        .from('mentorships')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        supaReqs = data.filter(r => 
          userAliases.some(alias => 
            String(r.student_id).toLowerCase() === alias.toLowerCase() ||
            String(r.alumni_id).toLowerCase() === alias.toLowerCase() ||
            (r.id && String(r.id).toLowerCase() === alias.toLowerCase())
          )
        );
      }
    } catch (e) {
      console.warn('Supabase mentorships query notice:', e.message);
    }

    // Merge with in-memory requests
    const memoryReqs = (dbStore.mentorships || []).filter(r =>
      userAliases.some(alias =>
        String(r.student_id).toLowerCase() === alias.toLowerCase() ||
        String(r.alumni_id).toLowerCase() === alias.toLowerCase()
      )
    );

    const mergedMap = new Map();
    [...supaReqs, ...memoryReqs].forEach(r => {
      const key = r.id || r.mentorship_id;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, r);
      }
    });

    const combinedList = Array.from(mergedMap.values());

    const enriched = combinedList.map(r => {
      const student = dbStore.students ? dbStore.students.find(s => String(s.id) === String(r.student_id) || String(s.student_id) === String(r.student_id) || String(s.user_id) === String(r.student_id) || s.email?.toLowerCase() === String(r.student_id).toLowerCase()) : null;
      const alumni = dbStore.alumni ? dbStore.alumni.find(a => String(a.id) === String(r.alumni_id) || String(a.alumni_id) === String(r.alumni_id) || String(a.user_id) === String(r.alumni_id) || a.email?.toLowerCase() === String(r.alumni_id).toLowerCase()) : null;
      
      const normalizedStatus = (r.status || 'PENDING').toUpperCase() === 'REQUESTED' ? 'PENDING' : (r.status || 'PENDING').toUpperCase();

      return {
        ...r,
        id: r.id || `msh-${r.mentorship_id}`,
        mentorship_id: r.mentorship_id || r.id,
        student_id: r.student_id,
        student_name: r.student_name || student?.name || student?.full_name || 'Alex Rivera',
        student_email: r.student_email || student?.email || 'alex.rivera@stanford.edu',
        student_avatar: r.student_avatar || student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.student_name || 'student')}`,
        student_college: r.student_college || student?.college_name || 'Stanford University',
        student_major: r.student_major || student?.major || student?.department || 'Computer Science',
        student_gpa: r.student_gpa || student?.gpa || student?.cgpa || '3.85',
        student_skills: r.student_skills || student?.skills || ['React', 'Python', 'Algorithms'],
        alumni_id: r.alumni_id,
        mentor_name: r.mentor_name || alumni?.name || alumni?.full_name || 'Sarah Jenkins',
        mentor_company: r.mentor_company || alumni?.company || 'Google',
        mentor_avatar: r.mentor_avatar || alumni?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.mentor_name || 'mentor')}`,
        status: normalizedStatus,
        notes: r.notes || r.note || r.goal || 'Career mentorship and interview preparation',
        meeting_link: r.meeting_link || 'https://meet.google.com/bridgeup-mentorship'
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
    const { id } = req.params;
    const { status, feedback, meetingLink } = req.body;

    const normalizedStatus = (status || 'ACCEPTED').toUpperCase();
    const finalMeetingLink = meetingLink || 'https://meet.google.com/bridgeup-mentorship';

    let reqObj = dbStore.mentorships?.find(r => String(r.id) === String(id) || String(r.mentorship_id) === String(id));
    if (reqObj) {
      reqObj.status = normalizedStatus;
      reqObj.meeting_link = finalMeetingLink;
      if (feedback) reqObj.feedback = feedback;
    }

    // Write update to Supabase
    try {
      await supabase
        .from('mentorships')
        .update({
          status: normalizedStatus,
          meeting_link: finalMeetingLink,
          feedback: feedback || null,
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${id},mentorship_id.eq.${Number(id) || 0}`);
    } catch (e) {
      console.warn('Supabase mentorship status update note:', e.message);
    }

    // If accepted, auto-create a Conversation thread between student and mentor so they can chat!
    if (normalizedStatus === 'ACCEPTED' && reqObj) {
      const convId = `conv-mentor-${reqObj.student_id}-${reqObj.alumni_id}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      const studentName = reqObj.student_name || 'Student Mentee';
      const mentorName = reqObj.mentor_name || 'Alumni Mentor';

      const initialMessageText = `Hi ${studentName}! I have accepted your mentorship request. You can discuss meeting schedules or ask any questions here. Google Meet Link: ${finalMeetingLink}`;

      const conversationRecord = {
        id: convId,
        participant_ids: [String(reqObj.student_id), String(reqObj.alumni_id)],
        student_id: String(reqObj.student_id),
        alumni_id: String(reqObj.alumni_id),
        peer_id: String(reqObj.student_id),
        peer_name: studentName,
        peer_avatar: reqObj.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`,
        last_message: initialMessageText,
        updated_at: new Date().toISOString()
      };

      // Store in dbStore memory
      if (!dbStore.conversations) dbStore.conversations = [];
      const existingConvIdx = dbStore.conversations.findIndex(c => c.id === convId);
      if (existingConvIdx !== -1) {
        dbStore.conversations[existingConvIdx] = { ...dbStore.conversations[existingConvIdx], ...conversationRecord };
      } else {
        dbStore.conversations.unshift(conversationRecord);
      }

      if (!dbStore.messages) dbStore.messages = [];
      dbStore.messages.push({
        id: `msg-${Date.now()}`,
        conversation_id: convId,
        sender_id: String(reqObj.alumni_id),
        sender_type: 'alumni',
        text: initialMessageText,
        created_at: new Date().toISOString()
      });

      try {
        await supabase.from('conversations').upsert([conversationRecord], { onConflict: 'id' });
        await supabase.from('messages').insert([{
          id: `msg-${Date.now()}`,
          conversation_id: convId,
          sender_id: String(reqObj.alumni_id),
          sender_type: 'alumni',
          text: initialMessageText,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {}

      // Notify the student
      const studentNotif = {
        id: `notif-${Date.now()}`,
        user_id: String(reqObj.student_id),
        type: 'MENTOR_ACCEPTED',
        title: `Mentorship Request Accepted by ${mentorName}!`,
        message: `${mentorName} from ${reqObj.mentor_company || 'Tech Leader'} has accepted your mentorship request. Start chatting now!`,
        link: '/messages',
        created_at: new Date().toISOString()
      };
      dbStore.createNotification(studentNotif);
      try {
        await supabase.from('notifications').insert([studentNotif]);
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: `Mentorship ${normalizedStatus.toLowerCase()}! Chat channel is ready.`,
      request: reqObj
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
