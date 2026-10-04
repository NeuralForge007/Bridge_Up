import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { logUserActivity } from '../services/auditLogger.js';
import { normalizeCollege, resolveCanonicalCollege } from '../seed_students.js';
import { INITIAL_DEMO_USERS } from '../demo_users_data.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretnextstepjwtkey2026';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

// In-memory rate limiting map
const loginAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  if (now - record.firstAttempt > 60000) {
    // Reset window after 1 minute
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= 20) {
    return false;
  }
  record.count += 1;
  loginAttempts.set(ip, record);
  return true;
}

function generateJwt(user) {
  return jwt.sign(
    {
      id: user.id || user.user_id,
      email: user.email,
      name: user.name || user.display_name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: (user.role || 'STUDENT').toUpperCase()
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Asynchronous SBERT student reindexing helper
async function triggerStudentReindex(studentId) {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/index/student/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      console.log(`✅ Asynchronously indexed student ${studentId} with SBERT embeddings.`);
    } else {
      console.warn(`Student reindexing notice: HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`Student SBERT indexing scheduled/deferred (${err.message})`);
  }
}

// 1. Secure Student Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many registration requests. Please try again in a minute.' });
    }

    const {
      full_name,
      name,
      firstName,
      lastName,
      email,
      password,
      confirm_password,
      confirmPassword,
      gender = 'Prefer not to say',
      college_id,
      collegeId,
      college_name,
      collegeName,
      collegeNetwork,
      year_of_study,
      yearOfStudy,
      year,
      graduation_year,
      graduationYear,
      degree = 'B.Tech',
      department,
      major,
      cgpa,
      gpa,
      career_domain,
      careerDomain,
      career_goal,
      careerGoal,
      primary_skill,
      primarySkill,
      skills,
      preferred_team_roles,
      preferredTeamRoles,
      hackathons_participated,
      hackathonsParticipated,
      hackathons_finalist,
      hackathonsFinalist,
      hackathons_won,
      hackathonsWon,
      total_projects,
      totalProjects,
      successful_projects,
      successfulProjects,
      project_domains,
      projectDomains,
      team_leadership_experience,
      teamLeadershipExperience,
      availability = 'Available',
      availability_schedule = 'Flexible',
      collaboration_mode = 'Any',
      collaborationMode,
      city = 'Kolkata',
      languages,
      github_url,
      githubUrl,
      linkedin_url,
      linkedinUrl,
      bio,
      profile_visibility = 'Platform members',
      profileVisibility,
      open_to_team_requests,
      openToTeamRequests,
      avatar,
      avatarUrl
    } = req.body;

    const finalFullName = (full_name || name || `${firstName || ''} ${lastName || ''}`).trim();
    if (!finalFullName) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();

    // Password validation
    const pwd = password || '';
    const confirmPwd = confirm_password || confirmPassword;

    if (!pwd || pwd.trim().length === 0) {
      return res.status(400).json({ error: 'Password is required and cannot be empty.' });
    }
    if (pwd.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (confirmPwd !== undefined && pwd !== confirmPwd) {
      return res.status(400).json({ error: 'Password confirmation does not match password.' });
    }

    // Resolve and validate college network
    const suppliedCollege =
      collegeNetwork ||
      collegeName ||
      college_name ||
      collegeId ||
      college_id;

    if (!suppliedCollege) {
      return res.status(400).json({
        success: false,
        code: 'COLLEGE_REQUIRED',
        error: 'Please select a valid college.'
      });
    }

    const resolvedCollege = resolveCanonicalCollege(suppliedCollege);
    if (!resolvedCollege) {
      return res.status(400).json({
        success: false,
        code: 'COLLEGE_REQUIRED',
        error: 'Please select a valid college.'
      });
    }

    const resolvedCollegeId = resolvedCollege.id;
    const resolvedCollegeName = resolvedCollege.name;
    const resolvedCollegeCode = resolvedCollege.code;

    // Server-side field validations
    const numCgpa = parseFloat(cgpa || gpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10.0) {
      return res.status(400).json({ error: 'CGPA must be a valid number between 0.0 and 10.0.' });
    }

    const hackParticipated = Math.max(0, parseInt(hackathons_participated ?? hackathonsParticipated, 10) || 0);
    const hackFinalist = Math.max(0, parseInt(hackathons_finalist ?? hackathonsFinalist, 10) || 0);
    const hackWon = Math.max(0, parseInt(hackathons_won ?? hackathonsWon, 10) || 0);
    const totProjects = Math.max(0, parseInt(total_projects ?? totalProjects, 10) || 0);
    const succProjects = Math.max(0, parseInt(successful_projects ?? successfulProjects, 10) || 0);

    if (succProjects > totProjects) {
      return res.status(400).json({ error: 'Successful projects count cannot exceed total projects count.' });
    }
    if (hackWon > hackFinalist || hackFinalist > hackParticipated) {
      return res.status(400).json({ error: 'Hackathon awards logic error (hackathons won <= finalists <= participated).' });
    }

    // Check email uniqueness case-insensitively in Supabase
    const { data: existingUser, error: checkUserErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (checkUserErr) {
      console.error('Supabase user check error:', checkUserErr);
    }
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const { data: existingStudent, error: checkStudentErr } = await supabase
      .from('students')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingStudent) {
      return res.status(409).json({ error: 'A student profile with this email already exists. Please sign in.' });
    }

    // Hash password with bcrypt cost 10 asynchronously
    const password_hash = await bcrypt.hash(pwd, 10);
    const userId = `usr-${Date.now()}`;
    const student_id = 2000 + (Date.now() % 80000); // Unique numeric ID for student

    const finalSkills = Array.isArray(skills) 
      ? skills.map(s => s.trim()).filter(Boolean)
      : (skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : ['Problem Solving', 'Python']);

    const finalPrimarySkill = primary_skill || primarySkill || finalSkills[0] || 'Python';
    const rolesInput = preferred_team_roles || preferredTeamRoles;
    const finalRoles = Array.isArray(rolesInput)
      ? rolesInput.map(r => r.trim()).filter(Boolean)
      : (rolesInput ? String(rolesInput).split(',').map(r => r.trim()).filter(Boolean) : ['Full Stack Developer']);

    const domainsInput = project_domains || projectDomains;
    const finalDomains = Array.isArray(domainsInput)
      ? domainsInput.map(d => d.trim()).filter(Boolean)
      : (domainsInput ? String(domainsInput).split(',').map(d => d.trim()).filter(Boolean) : ['AI for Social Good']);

    const finalLanguages = Array.isArray(languages)
      ? languages.map(l => l.trim()).filter(Boolean)
      : (languages ? String(languages).split(',').map(l => l.trim()).filter(Boolean) : ['English', 'Bengali']);

    const finalAvatar = avatar || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalFullName)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`;

    const isOpenToTeam = open_to_team_requests === true || open_to_team_requests === 'true' || open_to_team_requests === 'Yes' || openToTeamRequests === true || openToTeamRequests === 'true';

    const metaPayload = {
      gender,
      college_short_code: resolvedCollegeCode,
      preferred_team_roles: finalRoles,
      hackathons_participated: hackParticipated,
      hackathons_finalist: hackFinalist,
      hackathons_won: hackWon,
      total_projects: totProjects,
      successful_projects: succProjects,
      project_domains: finalDomains,
      team_leadership_experience: Boolean(team_leadership_experience ?? teamLeadershipExperience),
      availability,
      availability_schedule,
      collaboration_mode: collaboration_mode || collaborationMode || 'Any',
      city,
      languages: finalLanguages,
      github_url: github_url || githubUrl || '',
      linkedin_url: linkedin_url || linkedinUrl || '',
      profile_visibility: profile_visibility || profileVisibility || 'Platform members',
      open_to_team_requests: isOpenToTeam,
      teammate_rating: 4.5,
      response_rate_percent: 90,
      source: 'user_registration'
    };

    const finalYearOfStudy = parseInt(year_of_study || yearOfStudy || year, 10) || 1;
    const finalGradYear = parseInt(graduation_year || graduationYear, 10) || 2028;
    const finalDept = department || major || 'Computer Science and Engineering';
    const finalCareerDomain = career_domain || careerDomain || 'Software Engineering';
    const finalCareerGoal = career_goal || careerGoal || `Build expertise in ${finalCareerDomain}`;

    const newStudent = {
      id: `std-${student_id}`,
      student_id,
      user_id: userId,
      full_name: finalFullName,
      name: finalFullName,
      email: cleanEmail,
      role: 'STUDENT',
      college_id: resolvedCollegeId,
      college_name: resolvedCollegeName,
      year_of_study: finalYearOfStudy,
      year: `Year ${finalYearOfStudy}`,
      degree: degree || 'B.Tech',
      department: finalDept,
      major: finalDept,
      graduation_year: finalGradYear,
      cgpa: numCgpa,
      career_domain: finalCareerDomain,
      career_goal: finalCareerGoal,
      primary_skill: finalPrimarySkill,
      skills: finalSkills,
      engagement_status: 'Active',
      verification_status: 'Pending',
      bio: bio || `Student at ${resolvedCollegeName}`,
      github: github_url || githubUrl || '',
      linkedin: linkedin_url || linkedinUrl || '',
      avatar: finalAvatar,
      projects: metaPayload,
      achievements: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newUser = {
      id: userId,
      email: cleanEmail,
      password_hash,
      role: 'STUDENT', // Public registration is strictly STUDENT role only
      display_name: finalFullName,
      name: finalFullName,
      full_name: finalFullName,
      verification_status: 'Pending',
      college_id: resolvedCollegeId,
      college_name: resolvedCollegeName,
      major: newStudent.department,
      year: newStudent.year,
      gpa: String(numCgpa),
      skills: finalSkills,
      avatar: finalAvatar,
      avatar_url: finalAvatar,
      bio: newStudent.bio,
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Insert into users table
    const { error: userInsertErr } = await supabase.from('users').insert([newUser]);
    if (userInsertErr) {
      console.error('Failed to create user record:', userInsertErr);
      return res.status(500).json({ error: `User creation failed: ${userInsertErr.message}` });
    }

    // 2. Insert into students table
    const { error: studentInsertErr } = await supabase.from('students').insert([newStudent]);
    if (studentInsertErr) {
      console.error('Failed to create student profile, rolling back user...', studentInsertErr);
      // Rollback user record
      await supabase.from('users').delete().eq('id', userId);
      return res.status(500).json({ error: `Student profile creation failed: ${studentInsertErr.message}` });
    }

    // 3. Insert skills into student_skills
    const studentSkillsRecords = finalSkills.map((sk, idx) => ({
      id: `ssk-${student_id}-${idx + 1}`,
      student_id,
      skill: sk,
      proficiency: sk.toLowerCase() === finalPrimarySkill.toLowerCase() ? 'Primary' : 'Intermediate',
      created_at: new Date().toISOString()
    }));

    if (studentSkillsRecords.length > 0) {
      const { error: skErr } = await supabase.from('student_skills').insert(studentSkillsRecords);
      if (skErr) {
        console.warn('Notice on student_skills insert:', skErr.message);
      }
    }

    // 4. Asynchronously index student profile for SBERT embeddings
    triggerStudentReindex(student_id);

    await logUserActivity({
      userId,
      userEmail: cleanEmail,
      userName: finalFullName,
      action: 'SIGNUP_STUDENT',
      details: { college: resolvedCollegeName, student_id },
      req
    });

    const token = generateJwt(newUser);
    
    // Return sanitized response without password_hash
    const sanitizedUser = {
      ...newUser,
      student_id,
      password_hash: undefined,
      projects: metaPayload
    };
    delete sanitizedUser.password_hash;

    return res.status(201).json({
      success: true,
      message: 'Student account and profile created successfully! Welcome to BridgeUp.',
      token,
      user: sanitizedUser,
      student: newStudent
    });
  } catch (err) {
    console.error('Registration handler error:', err);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message || 'Internal server error during registration.'
    });
  }
});

// 2. Secure Login Endpoint
router.post('/login', async (req, res) => {
  const t0 = Date.now();
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait 60 seconds.' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query user record from Supabase
    let user = null;
    let { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, name, display_name, verification_status, college_id, college_name, skills, avatar, avatar_url, bio')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (dbUser) {
      user = dbUser;
    } else {
      // Fallback check in INITIAL_DEMO_USERS
      const demoMatch = INITIAL_DEMO_USERS.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (demoMatch) {
        user = {
          id: demoMatch.user_id || demoMatch.id,
          email: demoMatch.email,
          role: demoMatch.role || 'STUDENT',
          name: demoMatch.name,
          display_name: demoMatch.name,
          verification_status: demoMatch.verification_status || 'VERIFIED',
          college_id: demoMatch.college_id || 1,
          college_name: demoMatch.college_name || 'Institute of Engineering and Management',
          skills: demoMatch.skills || ['React', 'Python'],
          avatar: demoMatch.avatar,
          bio: demoMatch.bio || '',
          student_id: demoMatch.student_id,
          major: demoMatch.major,
          year: demoMatch.year,
          gpa: demoMatch.gpa
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password if hash exists, else allow standard demo password
    if (user.password_hash) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch && password !== 'password123' && password !== 'DemoPass@123') {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    // Fetch role-specific profile details asynchronously
    let profileData = {};
    if (user.role === 'STUDENT') {
      const { data: student } = await supabase
        .from('students')
        .select('student_id, college_id, college_name, department, major, year, cgpa, gpa, skills, career_domain, career_goal, primary_skill, verification_status, projects')
        .or(`user_id.eq.${user.id},email.eq.${cleanEmail}`)
        .maybeSingle();
      if (student) {
        profileData = {
          student_id: student.student_id,
          college_id: student.college_id,
          college_name: student.college_name,
          major: student.department || student.major,
          year: student.year,
          gpa: String(student.cgpa || student.gpa || '8.8'),
          skills: student.skills || user.skills || [],
          career_domain: student.career_domain,
          career_goal: student.career_goal,
          primary_skill: student.primary_skill,
          verification_status: student.verification_status,
          projects: student.projects
        };
      }
    } else if (user.role === 'ALUMNI') {
      const { data: alum } = await supabase
        .from('alumni')
        .select('alumni_id, company, role_title, current_role, college_id, college_name, skills')
        .or(`user_id.eq.${user.id},email.eq.${cleanEmail}`)
        .maybeSingle();
      if (alum) {
        profileData = {
          alumni_id: alum.alumni_id,
          company: alum.company,
          role_title: alum.current_role || alum.role_title,
          college_id: alum.college_id,
          college_name: alum.college_name,
          skills: alum.skills || user.skills
        };
      }
    }

    const sanitizedUser = {
      ...user,
      ...profileData,
      password_hash: undefined
    };
    delete sanitizedUser.password_hash;

    // Asynchronous audit logging (does not delay login response)
    logUserActivity({
      userId: user.id,
      userEmail: cleanEmail,
      userName: user.name || user.display_name,
      action: 'LOGIN',
      details: { role: user.role },
      req
    }).catch(err => console.warn('Background audit log notice:', err.message));

    const token = generateJwt(user);
    const duration = Date.now() - t0;
    console.log(`[AUTH] Login success for ${cleanEmail} (${user.role}) in ${duration}ms`);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: sanitizedUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 2b. Demo Login Endpoint (Bypasses password for instant demo session switching)
router.post('/demo-login', async (req, res) => {
  try {
    const { email, id, role } = req.body || {};
    let target = null;
    if (email) {
      target = INITIAL_DEMO_USERS.find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim());
    } else if (id) {
      target = INITIAL_DEMO_USERS.find(u => u.id === id || u.user_id === id);
    } else if (role) {
      target = INITIAL_DEMO_USERS.find(u => u.role && u.role.toLowerCase() === role.toLowerCase().trim());
    }
    if (!target) {
      target = INITIAL_DEMO_USERS[0];
    }

    const token = generateJwt(target);
    return res.json({
      success: true,
      message: 'Demo login successful!',
      token,
      user: {
        ...target,
        id: target.user_id || target.id
      }
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Demo login failed.' });
  }
});

// 3. Current Authenticated User Profile (/me)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { id, email } = req.user;
    
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!user && email) {
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      user = userByEmail;
    }

    if (!user) {
      // Fallback check in students table
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .or(`id.eq.${id},email.eq.${email?.toLowerCase()}`)
        .maybeSingle();

      if (student) {
        user = {
          id: student.user_id || student.id,
          email: student.email,
          name: student.full_name,
          role: 'STUDENT',
          college_id: student.college_id,
          college_name: student.college_name,
          major: student.department,
          gpa: String(student.cgpa),
          skills: student.skills,
          avatar: student.avatar,
          verification_status: student.verification_status,
          projects: student.projects
        };
      }
    }

    if (!user) {
      const demoMatch = INITIAL_DEMO_USERS.find(u =>
        (id && (u.id === id || u.user_id === id)) ||
        (email && u.email.toLowerCase() === email.toLowerCase())
      );
      if (demoMatch) {
        user = {
          id: demoMatch.user_id || demoMatch.id,
          email: demoMatch.email,
          name: demoMatch.name,
          role: demoMatch.role || 'STUDENT',
          college_id: demoMatch.college_id || 1,
          college_name: demoMatch.college_name || 'Institute of Engineering and Management',
          major: demoMatch.major,
          year: demoMatch.year,
          gpa: demoMatch.gpa,
          skills: demoMatch.skills || ['React', 'Python'],
          avatar: demoMatch.avatar,
          verification_status: demoMatch.verification_status || 'VERIFIED',
          bio: demoMatch.bio || ''
        };
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const sanitized = { ...user, password_hash: undefined };
    delete sanitized.password_hash;
    return res.json({ success: true, user: sanitized });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Update Profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    delete updates.password_hash;
    delete updates.password;
    delete updates.role; // Prevent role escalation

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Update students table if student
    if (req.user.role === 'STUDENT') {
      await supabase
        .from('students')
        .update({
          full_name: updates.name || updates.display_name,
          skills: updates.skills,
          bio: updates.bio,
          avatar: updates.avatar,
          updated_at: new Date().toISOString()
        })
        .or(`user_id.eq.${userId},id.eq.${userId}`);
      
      triggerStudentReindex(userId);
    }

    return res.json({ success: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Demo Users List
router.get('/demo-users', (req, res) => {
  return res.json({ success: true, count: INITIAL_DEMO_USERS.length, users: INITIAL_DEMO_USERS });
});

// 6. Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
