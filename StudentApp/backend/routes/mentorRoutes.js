import express from 'express';
import { supabase } from '../supabaseClient.js';
import { dbStore } from '../dbStore.js';
import { authenticateToken } from '../middleware/auth.js';
import { logUserActivity } from '../services/auditLogger.js';
import { INITIAL_DEMO_USERS } from '../demo_users_data.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const AI_REQUEST_TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '15000', 10);
const AI_HEALTH_TIMEOUT_MS = parseInt(process.env.AI_HEALTH_TIMEOUT_MS || '2000', 10);

/**
 * Universal Type-Safe Identity & Alias Resolver
 * Resolves all identifiers (user_id, alumni_id, student_id, email, database PKs)
 * for any given identifier or authenticated user object.
 */
export async function resolveUserIdentifiers(identifier, userObj = null) {
  const aliasSet = new Set();
  const rawTokens = [
    identifier,
    userObj?.id,
    userObj?.user_id,
    userObj?.alumni_id,
    userObj?.student_id,
    userObj?.email
  ].filter(Boolean).map(v => String(v).trim());

  rawTokens.forEach(t => aliasSet.add(t));

  let resolvedAlumni = null;
  let resolvedStudent = null;
  let resolvedUser = null;

  // 1. Check Demo User mappings (static cache)
  const demoMatch = INITIAL_DEMO_USERS.find(du => 
    rawTokens.some(t => 
      String(du.id).toLowerCase() === t.toLowerCase() ||
      String(du.user_id).toLowerCase() === t.toLowerCase() ||
      String(du.email).toLowerCase() === t.toLowerCase() ||
      String(du.alumni_id) === t ||
      String(du.student_id) === t
    )
  );

  if (demoMatch) {
    if (demoMatch.id) aliasSet.add(String(demoMatch.id));
    if (demoMatch.user_id) aliasSet.add(String(demoMatch.user_id));
    if (demoMatch.email) aliasSet.add(String(demoMatch.email).toLowerCase());
    if (demoMatch.alumni_id) {
      aliasSet.add(String(demoMatch.alumni_id));
      aliasSet.add(`alm-${demoMatch.alumni_id}`);
    }
    if (demoMatch.student_id) {
      aliasSet.add(String(demoMatch.student_id));
      aliasSet.add(`std-${demoMatch.student_id}`);
    }

    if (demoMatch.role === 'ALUMNI') resolvedAlumni = demoMatch;
    else if (demoMatch.role === 'STUDENT') resolvedStudent = demoMatch;
    resolvedUser = demoMatch;
  }

  // 2. Query Supabase if not resolved
  const tokens = Array.from(aliasSet);
  const emailToken = tokens.find(t => t.includes('@'))?.toLowerCase();
  const numToken = tokens.find(t => !isNaN(Number(t)) && Number(t) > 0);
  const idToken = tokens.find(t => t.startsWith('usr-') || t.startsWith('std-') || t.startsWith('alm-') || t.startsWith('STUDENT-') || t.startsWith('ALUMNI-')) || tokens[0];

  // Try alumni
  if (!resolvedAlumni) {
    try {
      let q = supabase.from('alumni').select('*');
      if (numToken) q = q.or(`alumni_id.eq.${Number(numToken)},id.eq.${idToken || numToken}`);
      else if (emailToken) q = q.eq('email', emailToken);
      else if (idToken) q = q.or(`id.eq.${idToken},user_id.eq.${idToken}`);

      const { data } = await q.maybeSingle();
      if (data) {
        resolvedAlumni = data;
        if (data.id) aliasSet.add(String(data.id));
        if (data.alumni_id) aliasSet.add(String(data.alumni_id));
        if (data.user_id) aliasSet.add(String(data.user_id));
        if (data.email) aliasSet.add(String(data.email).toLowerCase());
      }
    } catch (e) {}
  }

  // Try students
  if (!resolvedStudent) {
    try {
      let q = supabase.from('students').select('*');
      if (numToken) q = q.or(`student_id.eq.${Number(numToken)},id.eq.${idToken || numToken}`);
      else if (emailToken) q = q.eq('email', emailToken);
      else if (idToken) q = q.or(`id.eq.${idToken},user_id.eq.${idToken}`);

      const { data } = await q.maybeSingle();
      if (data) {
        resolvedStudent = data;
        if (data.id) aliasSet.add(String(data.id));
        if (data.student_id) aliasSet.add(String(data.student_id));
        if (data.user_id) aliasSet.add(String(data.user_id));
        if (data.email) aliasSet.add(String(data.email).toLowerCase());
      }
    } catch (e) {}
  }

  // Try users
  if (!resolvedUser) {
    try {
      let q = supabase.from('users').select('*');
      if (emailToken) q = q.eq('email', emailToken);
      else if (idToken) q = q.or(`id.eq.${idToken},user_id.eq.${idToken}`);

      const { data } = await q.maybeSingle();
      if (data) {
        resolvedUser = data;
        if (data.id) aliasSet.add(String(data.id));
        if (data.user_id) aliasSet.add(String(data.user_id));
        if (data.email) aliasSet.add(String(data.email).toLowerCase());
      }
    } catch (e) {}
  }

  // Fallback to dbStore
  if (!resolvedAlumni) {
    for (const token of Array.from(aliasSet)) {
      const memAlum = dbStore.getAlumniById(token) || dbStore.alumni.find(a => 
        String(a.alumni_id) === token || a.email?.toLowerCase() === token.toLowerCase() || a.id === token || a.user_id === token
      );
      if (memAlum) {
        resolvedAlumni = memAlum;
        break;
      }
    }
  }

  if (!resolvedStudent) {
    for (const token of Array.from(aliasSet)) {
      const memStu = dbStore.students.find(s => 
        String(s.student_id) === token || s.email?.toLowerCase() === token.toLowerCase() || s.id === token || s.user_id === token
      );
      if (memStu) {
        resolvedStudent = memStu;
        break;
      }
    }
  }

  const aliases = Array.from(aliasSet).filter(Boolean);
  const canonicalAlumniId = resolvedAlumni ? String(resolvedAlumni.alumni_id || resolvedAlumni.id) : null;
  const canonicalStudentId = resolvedStudent ? String(resolvedStudent.student_id || resolvedStudent.id) : null;

  return {
    aliases,
    canonicalAlumniId,
    canonicalStudentId,
    alumniRecord: resolvedAlumni,
    studentRecord: resolvedStudent,
    userRecord: resolvedUser,
    role: resolvedAlumni ? 'ALUMNI' : (resolvedStudent ? 'STUDENT' : (resolvedUser?.role || 'STUDENT'))
  };
}

// 1. AI Match Handler
const handleAIMatch = async (req, res) => {
  const reqStart = Date.now();
  try {
    const userId = req.user?.id || req.body.student_id || req.body.studentId;
    const userEmail = req.user?.email || req.body.email;

    const userRes = await resolveUserIdentifiers(userId, req.user);
    const student = userRes.studentRecord || userRes.userRecord;

    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_PROFILE_NOT_FOUND',
        message: 'Authenticated student profile could not be found. Please complete student registration.'
      });
    }

    if (!student.college_id) {
      return res.status(400).json({
        success: false,
        code: 'COLLEGE_NOT_SET',
        message: 'Student profile has no associated college.'
      });
    }

    const targetCollegeId = Number(student.college_id);
    const targetCollegeName = student.college_name || 'Institute of Engineering and Management';

    const {
      goal,
      careerGoal,
      career_goal,
      domain,
      careerDomain,
      career_domain,
      skills,
      limit = 8
    } = req.body;

    const targetGoal = (goal || careerGoal || career_goal || student.career_goal || 'Advance career and master software engineering').trim();
    const targetDomain = (domain || careerDomain || career_domain || student.career_domain || 'Software Engineering').trim();
    
    let targetSkills = [];
    if (skills) {
      targetSkills = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(student.skills) && student.skills.length > 0) {
      targetSkills = student.skills;
    } else if (student.primary_skill) {
      targetSkills = [student.primary_skill];
    } else {
      targetSkills = ['Python', 'JavaScript', 'React'];
    }

    let aiData = null;
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career_goal: targetGoal,
          career_domain: targetDomain,
          skills: targetSkills,
          college_id: targetCollegeId,
          student_id: String(student.student_id || student.id),
          limit
        }),
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS)
      });
      if (aiResponse.ok) {
        aiData = await aiResponse.json();
      } else {
        console.warn(`[AI_SERVICE] Response ${aiResponse.status}, falling back to local heuristic matcher.`);
      }
    } catch (fetchErr) {
      console.warn(`[AI_SERVICE] Microservice notice (${fetchErr.message}), activating local heuristic matching engine.`);
    }

    // Fallback: If AI service is not available, compute local ranked matches
    if (!aiData || !aiData.matches || aiData.matches.length === 0) {
      const { data: dbAlumni } = await supabase
        .from('alumni')
        .select('*')
        .eq('college_id', targetCollegeId);

      const candidateList = (dbAlumni && dbAlumni.length > 0) ? dbAlumni : (dbStore.alumni || []);
      
      const scored = candidateList.map(a => {
        let score = 0.50; // base score for verified college alumni
        const aDomain = (a.career_domain || '').toLowerCase();
        const aRole = (a.current_role || a.role_title || '').toLowerCase();
        const aSkills = Array.isArray(a.skills) ? a.skills : (a.skills ? String(a.skills).split(',').map(s => s.trim()) : []);

        if (targetDomain && aDomain.includes(targetDomain.toLowerCase())) score += 0.25;
        if (targetGoal && (aRole.includes(targetGoal.toLowerCase()) || targetGoal.toLowerCase().includes(aRole))) score += 0.15;
        
        const matchedSkills = targetSkills.filter(ts => aSkills.some(as => as.toLowerCase() === ts.toLowerCase()));
        if (matchedSkills.length > 0) score += Math.min(0.20, matchedSkills.length * 0.05);

        return {
          alumni_id: a.alumni_id,
          id: a.id || `alm-${a.alumni_id}`,
          name: a.full_name || a.name,
          current_role: a.current_role || a.role_title || 'Senior Software Engineer',
          company: a.company || 'Tech Company',
          career_domain: a.career_domain || targetDomain,
          college_id: a.college_id || targetCollegeId,
          college_name: a.college_name || targetCollegeName,
          skills: aSkills,
          avatar: a.avatar,
          match_score: Math.min(0.98, parseFloat(score.toFixed(2))),
          matched_skills: matchedSkills,
          reasons: [
            `Verified Alumni from ${targetCollegeName}`,
            `Works in ${a.career_domain || targetDomain} at ${a.company || 'Tech Org'}`,
            matchedSkills.length > 0 ? `Shared expertise in ${matchedSkills.join(', ')}` : `Specialist in ${a.current_role || 'Engineering'}`
          ]
        };
      });

      scored.sort((a, b) => b.match_score - a.match_score);
      aiData = {
        matches: scored.slice(0, limit),
        total_candidates: scored.length,
        exact_match_found: true,
        query: { target_domain: targetDomain, target_role: targetGoal }
      };
    }

    const formattedMatches = (aiData.matches || []).map(m => {
      if (typeof m.match_score !== 'number') {
        throw new Error(`Invalid match score returned for alumni ${m.alumni_id}`);
      }
      return {
        alumni_id: m.alumni_id,
        id: m.id || `alm-${m.alumni_id}`,
        name: m.name || m.full_name,
        avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.alumni_id}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`,
        current_role: m.current_role || m.role_title || 'Software Engineer',
        company: m.company || 'Tech Organization',
        college_id: m.college_id || targetCollegeId,
        college_name: m.college_name || targetCollegeName,
        career_domain: m.career_domain || targetDomain,
        graduation_year: m.graduation_year,
        experience_years: m.experience_years !== undefined ? m.experience_years : 2,
        availability: m.availability || 'Available',
        mentor_rating: m.mentor_rating !== undefined ? m.mentor_rating : 4.8,
        match_score: m.match_score,
        match_type: m.match_type || 'STRONG',
        semantic_similarity: m.semantic_similarity !== undefined ? m.semantic_similarity : 0.85,
        matched_skills: m.matched_skills || [],
        score_breakdown: m.score_breakdown || {},
        reasons: m.reasons || [
          `Verified Alumni from ${targetCollegeName}`,
          `Works in ${m.career_domain || targetDomain}`,
          `Role: ${m.current_role || 'Engineer'}`
        ]
      };
    });

    // Asynchronous audit logging
    logUserActivity({
      userId: String(student.student_id || student.id),
      userEmail: student.email,
      userName: student.full_name,
      action: 'AI_MENTOR_MATCH',
      details: {
        goal: targetGoal,
        collegeId: targetCollegeId,
        matchesCount: formattedMatches.length,
        exactMatch: aiData.exact_match_found
      },
      req
    }).catch(err => console.warn('Background audit log notice:', err.message));

    const totalDuration = Date.now() - reqStart;
    console.log(`[AI_MATCH] Matched ${formattedMatches.length} alumni in ${totalDuration}ms for ${student.full_name}`);

    return res.json({
      success: true,
      query: {
        career_goal: targetGoal,
        target_role: aiData.query?.target_role,
        target_company: aiData.query?.target_company,
        target_domain: targetDomain
      },
      student_college: {
        id: targetCollegeId,
        name: targetCollegeName
      },
      exact_match_found: Boolean(aiData.exact_match_found),
      total_candidates: aiData.total_candidates || formattedMatches.length,
      matches: formattedMatches
    });
  } catch (err) {
    console.error('Mentor AI Match Error:', err);
    return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: err.message });
  }
};

router.post('/match', authenticateToken, handleAIMatch);
router.post('/ai/match', authenticateToken, handleAIMatch);

// 2. Get All Mentors from Supabase
router.get('/', async (req, res) => {
  try {
    const { company, search, college_id, domain } = req.query;

    let query = supabase.from('alumni').select('*');
    if (company && company !== 'All') {
      query = query.ilike('company', `%${company}%`);
    }
    if (college_id) {
      query = query.eq('college_id', Number(college_id));
    }
    if (domain) {
      query = query.ilike('career_domain', `%${domain}%`);
    }

    const { data: alumniList, error } = await query.order('alumni_id', { ascending: true });
    if (error) throw error;

    let mentors = (alumniList || []).map(m => ({
      ...m,
      id: m.id || `alm-${m.alumni_id}`,
      name: m.full_name || m.name,
      avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.alumni_id}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`,
      current_role: m.current_role || m.role_title || 'Software Engineer',
      company: m.company || 'Tech Company'
    }));

    if (search) {
      const q = search.toLowerCase();
      mentors = mentors.filter(m =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.current_role && m.current_role.toLowerCase().includes(q)) ||
        (m.skills && Array.isArray(m.skills) && m.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: mentors.length, mentors });
  } catch (err) {
    console.error('Error fetching alumni mentors:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Mentor by ID from Supabase
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (['requests', 'request', 'ai', 'match'].includes(id)) {
      return next();
    }

    const isNum = !isNaN(Number(id));
    let query = supabase.from('alumni').select('*');
    if (isNum) {
      query = query.or(`alumni_id.eq.${Number(id)},id.eq.${id}`);
    } else {
      query = query.eq('id', id);
    }

    const { data: mentor, error } = await query.maybeSingle();
    if (error) throw error;
    if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found' });

    return res.json({
      success: true,
      mentor: {
        ...mentor,
        id: mentor.id || `alm-${mentor.alumni_id}`,
        name: mentor.full_name || mentor.name,
        avatar: mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.alumni_id}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Send Mentorship Request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const {
      alumni_id,
      alumniId,
      mentor_id,
      mentorId,
      goal,
      note,
      notes,
      ai_match_score
    } = req.body;

    const rawTargetAlumni = alumni_id || alumniId || mentor_id || mentorId;
    if (!rawTargetAlumni) {
      return res.status(400).json({ success: false, error: 'Target alumni ID is required.' });
    }

    // 1. Resolve Target Alumnus Identity
    const targetResolution = await resolveUserIdentifiers(rawTargetAlumni);
    const targetAlumni = targetResolution.alumniRecord;

    if (!targetAlumni) {
      return res.status(404).json({
        success: false,
        error: 'ALUMNI_NOT_FOUND',
        message: `Target alumni mentor '${rawTargetAlumni}' could not be resolved in the database.`
      });
    }

    const canonicalAlumniId = String(targetAlumni.alumni_id || targetAlumni.id);

    // 2. Resolve Sending Student Identity
    const studentResolution = await resolveUserIdentifiers(req.user?.id, req.user);
    const student = studentResolution.studentRecord || studentResolution.userRecord || req.user;
    const canonicalStudentId = String(student.student_id || student.id || req.user.id);
    const studentName = student.full_name || student.name || req.user.name || 'Student Mentee';

    // 3. Check for Existing Active/Pending Request
    const { data: existingPending } = await supabase
      .from('mentorships')
      .select('id, status')
      .in('alumni_id', targetResolution.aliases)
      .in('student_id', studentResolution.aliases)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_REQUEST',
        message: 'A pending mentorship request has already been sent to this alumni mentor.'
      });
    }

    const finalGoal = (goal || note || notes || 'Career Guidance & Technical Mentorship').trim();
    const finalNote = (note || notes || 'Looking for technical interview preparation and career mentorship.').trim();

    const newReqId = `msh-${Date.now()}`;
    const mentorshipRec = {
      id: newReqId,
      mentorship_id: Date.now() % 100000,
      student_id: canonicalStudentId,
      alumni_id: canonicalAlumniId,
      goal: finalGoal,
      notes: finalNote,
      status: 'PENDING',
      source: 'Student Request',
      ai_match_score: ai_match_score ? parseFloat(ai_match_score) : 90.0,
      meeting_link: 'https://meet.google.com/bridgeup-mentorship',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Persistence to Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from('mentorships')
      .insert([mentorshipRec])
      .select()
      .single();

    if (insertErr) {
      console.error('Supabase mentorship insert failure:', insertErr.message);
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: `Failed to persist mentorship request: ${insertErr.message}`
      });
    }

    // Sync to in-memory dbStore
    dbStore.upsertMentorship(inserted || mentorshipRec);

    // 5. Create notifications for all target alumni aliases
    try {
      const notifRecords = targetResolution.aliases.slice(0, 3).map((alias, idx) => ({
        id: `notif-${Date.now()}-${idx}`,
        user_id: alias,
        type: 'MENTOR_REQUEST',
        title: `New Mentorship Request from ${studentName}`,
        message: `${studentName} has requested mentorship: "${finalNote.slice(0, 80)}"`,
        is_read: false,
        created_at: new Date().toISOString()
      }));
      await supabase.from('notifications').insert(notifRecords);
    } catch (e) {}

    await logUserActivity({
      userId: canonicalStudentId,
      userEmail: student.email,
      userName: studentName,
      action: 'REQUEST_MENTOR',
      details: { alumniId: canonicalAlumniId, goal: finalGoal },
      req
    });

    const responsePayload = {
      id: (inserted || mentorshipRec).id,
      mentorship_id: (inserted || mentorshipRec).mentorship_id,
      student_id: canonicalStudentId,
      alumni_id: canonicalAlumniId,
      student_name: studentName,
      student_email: student.email || '',
      student_avatar: student.avatar_url || student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`,
      student_college: student.college_name || 'Institute of Engineering and Management',
      student_major: student.department || student.major || 'Computer Science',
      student_gpa: student.cgpa ? String(student.cgpa) : (student.gpa || '8.8'),
      student_skills: student.skills || [],
      mentor_name: targetAlumni.full_name || targetAlumni.name,
      mentor_company: targetAlumni.company,
      goal: finalGoal,
      notes: finalNote,
      status: 'PENDING',
      ai_match_score: mentorshipRec.ai_match_score,
      meeting_link: mentorshipRec.meeting_link,
      created_at: (inserted || mentorshipRec).created_at
    };

    return res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully!',
      request: responsePayload
    });
  } catch (err) {
    console.error('Send mentorship request error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to fetch and enrich mentorship requests
async function getEnrichedMentorshipRequests(userIdParam, authUser) {
  const targetUserToken = (!userIdParam || userIdParam === 'me') ? authUser?.id : userIdParam;
  const userResolution = await resolveUserIdentifiers(targetUserToken, authUser);
  const aliases = userResolution.aliases;

  if (aliases.length === 0) {
    return [];
  }

  // 1. Fetch mentorship records matching ANY resolved alias for student or alumni
  const orConditions = aliases.map(a => `alumni_id.eq.${a},student_id.eq.${a}`).join(',');
  const { data: rawReqs, error } = await supabase
    .from('mentorships')
    .select('*')
    .or(orConditions)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch mentorships error:', error.message);
    throw error;
  }

  const filteredReqs = (rawReqs || []).filter(r => r.source !== 'team_join_request');
  if (filteredReqs.length === 0) {
    return [];
  }

  // 2. Batch Collect Student & Alumni IDs for Enrichment
  const studentIdSet = new Set();
  const alumniIdSet = new Set();

  filteredReqs.forEach(r => {
    if (r.student_id) studentIdSet.add(String(r.student_id));
    if (r.alumni_id) alumniIdSet.add(String(r.alumni_id));
  });

  const studentsMap = new Map();
  const alumniMap = new Map();

  // Populate known resolved records first
  if (userResolution.studentRecord) {
    userResolution.aliases.forEach(a => studentsMap.set(a, userResolution.studentRecord));
  }
  if (userResolution.alumniRecord) {
    userResolution.aliases.forEach(a => alumniMap.set(a, userResolution.alumniRecord));
  }

  // Fetch missing student records from Supabase
  const missingStudentIds = Array.from(studentIdSet).filter(sid => !studentsMap.has(sid));
  if (missingStudentIds.length > 0) {
    const numStudentIds = missingStudentIds.filter(id => !isNaN(Number(id))).map(Number);
    const textStudentIds = missingStudentIds.filter(id => isNaN(Number(id)));

    let sQueries = [];
    if (numStudentIds.length > 0) {
      sQueries.push(supabase.from('students').select('*').in('student_id', numStudentIds));
    }
    if (textStudentIds.length > 0) {
      sQueries.push(supabase.from('students').select('*').in('id', textStudentIds));
      sQueries.push(supabase.from('students').select('*').in('user_id', textStudentIds));
    }

    const sResults = await Promise.all(sQueries);
    sResults.forEach(res => {
      (res.data || []).forEach(s => {
        if (s.id) studentsMap.set(String(s.id), s);
        if (s.student_id) studentsMap.set(String(s.student_id), s);
        if (s.user_id) studentsMap.set(String(s.user_id), s);
        if (s.email) studentsMap.set(String(s.email).toLowerCase(), s);
      });
    });
  }

  // Fetch missing alumni records from Supabase
  const missingAlumniIds = Array.from(alumniIdSet).filter(aid => !alumniMap.has(aid));
  if (missingAlumniIds.length > 0) {
    const numAlumniIds = missingAlumniIds.filter(id => !isNaN(Number(id))).map(Number);
    const textAlumniIds = missingAlumniIds.filter(id => isNaN(Number(id)));

    let aQueries = [];
    if (numAlumniIds.length > 0) {
      aQueries.push(supabase.from('alumni').select('*').in('alumni_id', numAlumniIds));
    }
    if (textAlumniIds.length > 0) {
      aQueries.push(supabase.from('alumni').select('*').in('id', textAlumniIds));
      aQueries.push(supabase.from('alumni').select('*').in('user_id', textAlumniIds));
    }

    const aResults = await Promise.all(aQueries);
    aResults.forEach(res => {
      (res.data || []).forEach(a => {
        if (a.id) alumniMap.set(String(a.id), a);
        if (a.alumni_id) alumniMap.set(String(a.alumni_id), a);
        if (a.user_id) alumniMap.set(String(a.user_id), a);
        if (a.email) alumniMap.set(String(a.email).toLowerCase(), a);
      });
    });
  }

  // 3. Format into Canonical Response Schema
  return filteredReqs.map(r => {
    const s = studentsMap.get(String(r.student_id)) || {};
    const a = alumniMap.get(String(r.alumni_id)) || {};

    const rawStatus = (r.status || 'PENDING').trim();
    const normStatus = ['REQUESTED', 'pending', 'requested'].includes(rawStatus) ? 'PENDING' : rawStatus.toUpperCase();

    const studentName = s.full_name || s.name || (r.notes && r.notes.includes('from ') ? r.notes.split('from ')[1]?.split('.')[0] : 'Student Mentee');
    const mentorName = a.full_name || a.name || 'Alumni Mentor';

    return {
      id: r.id,
      mentorship_id: r.mentorship_id || r.id,
      student_id: r.student_id,
      alumni_id: r.alumni_id,
      student_name: studentName,
      student_email: s.email || '',
      student_avatar: s.avatar_url || s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`,
      student_college: s.college_name || 'Institute of Engineering and Management',
      student_major: s.department || s.degree || s.major || 'Computer Science',
      student_gpa: s.cgpa ? String(s.cgpa) : (s.gpa || '8.8'),
      student_skills: s.skills || ['React', 'Python'],
      mentor_name: mentorName,
      mentor_company: a.company || 'Flipkart',
      mentor_avatar: a.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentorName)}`,
      goal: r.goal || 'Career Guidance & Mentorship',
      notes: r.notes || r.note || r.goal || 'Looking for technical guidance and interview prep.',
      status: normStatus,
      ai_match_score: r.ai_match_score ? parseFloat(r.ai_match_score) : 90.0,
      meeting_link: r.meeting_link || 'https://meet.google.com/bridgeup-mentorship',
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  });
}

// 5. GET /api/mentors/requests/me & /api/mentors/requests/:userId
router.get('/requests/me', authenticateToken, async (req, res) => {
  try {
    const requests = await getEnrichedMentorshipRequests('me', req.user);
    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/requests/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getEnrichedMentorshipRequests(userId, req.user);
    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Accept / Reject / Update Mentorship Request Status
router.patch('/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, meetingLink, meeting_link } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const normStatus = newStatus.trim().toUpperCase();
    if (!['ACCEPTED', 'DECLINED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(normStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid status update.' });
    }

    // 1. Fetch current mentorship request
    const { data: request, error: fetchErr } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !request) {
      return res.status(404).json({ success: false, error: 'Mentorship request not found.' });
    }

    // 2. Verify Authorization
    const userRes = await resolveUserIdentifiers(req.user?.id, req.user);
    const isAlumniRecipient = userRes.aliases.includes(String(request.alumni_id));
    const isStudentSender = userRes.aliases.includes(String(request.student_id));

    if (!isAlumniRecipient && !isStudentSender && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this mentorship request.' });
    }

    const finalMeetingLink = meetingLink || meeting_link || request.meeting_link || 'https://meet.google.com/bridgeup-mentorship';

    // 3. Update in Supabase
    const { data: updated, error: updateErr } = await supabase
      .from('mentorships')
      .update({
        status: normStatus,
        meeting_link: finalMeetingLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Supabase update mentorship error:', updateErr.message);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    // Sync in-memory store
    dbStore.updateMentorshipStatus(id, normStatus);

    // 4. If ACCEPTED, notify student & initialize direct communication
    if (normStatus === 'ACCEPTED') {
      try {
        await supabase.from('notifications').insert([{
          id: `notif-${Date.now()}`,
          user_id: String(request.student_id),
          type: 'MENTOR_ACCEPTED',
          title: 'Mentorship Request Accepted! 🎉',
          message: `Your mentorship request has been accepted! Meeting link: ${finalMeetingLink}`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: `Mentorship request status updated to ${normStatus}`,
      request: updated
    });
  } catch (err) {
    console.error('Update mentorship status error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
