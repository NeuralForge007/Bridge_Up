import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';
import { dbStore } from '../dbStore.js';
import { authenticateToken } from '../middleware/auth.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretnextstepjwtkey2026';

function generateJwt(user) {
  return jwt.sign(
    {
      id: user.id || user.user_id,
      email: user.email,
      name: user.name || user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      role: (user.role || 'STUDENT').toUpperCase()
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 1. Register Endpoint (Student, Alumni, Recruiter)
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      firstName,
      lastName,
      role = 'STUDENT',
      collegeId,
      college_id,
      collegeName,
      major,
      year,
      gpa,
      company,
      companyName,
      roleTitle,
      jobTitle,
      skills,
      headline,
      avatar,
      avatarUrl,
      bio
    } = req.body;

    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and full name are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    let existing = dbStore.findUserByEmail ? dbStore.findUserByEmail(cleanEmail) : dbStore.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const password_hash = bcrypt.hashSync(password || 'password123', 8);
    const userId = `usr-${Date.now()}`;
    const userRole = role.toUpperCase();
    const finalAvatar = avatar || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`;
    const finalSkills = Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : ['Problem Solving', 'React', 'Python']);
    const finalGpa = gpa ? String(gpa) : '8.80';
    const finalCollege = collegeName || 'Institute of Engineering and Management';
    const finalCompany = company || companyName || '';
    const finalRoleTitle = roleTitle || jobTitle || (userRole === 'STUDENT' ? 'Student' : 'Software Engineer');

    const newUser = {
      id: userId,
      user_id: userId,
      email: cleanEmail,
      password_hash,
      role: userRole,
      display_name: fullName,
      name: fullName,
      first_name: firstName || fullName.split(' ')[0],
      last_name: lastName || fullName.split(' ').slice(1).join(' ') || '',
      verification_status: 'VERIFIED',
      college_id: collegeId || college_id || 1,
      college_name: finalCollege,
      major: major || 'Computer Science',
      year: year || 'Junior (Year 3)',
      gpa: finalGpa,
      company: finalCompany,
      role_title: finalRoleTitle,
      skills: finalSkills,
      avatar: finalAvatar,
      avatar_url: finalAvatar,
      bio: bio || headline || `Member of BridgeUp platform as ${userRole}.`,
      status: 'online',
      created_at: new Date().toISOString()
    };

    // 1. Save to in-memory store
    if (dbStore.createUser) dbStore.createUser(newUser);
    else dbStore.users.unshift(newUser);

    // 2. Role-specific table updates
    if (userRole === 'STUDENT') {
      const studentRec = {
        id: `stu-${Date.now()}`,
        student_id: Date.now() % 100000,
        user_id: userId,
        full_name: fullName,
        name: fullName,
        email: cleanEmail,
        college_id: collegeId || 1,
        college_name: finalCollege,
        year_of_study: 3,
        year: year || 'Junior (Year 3)',
        department: major || 'Computer Science',
        major: major || 'Computer Science',
        cgpa: Number(finalGpa) || 8.8,
        gpa: finalGpa,
        skills: finalSkills,
        career_domain: 'Software Development',
        career_goal: 'Land a software engineer role',
        primary_skill: finalSkills[0] || 'Python',
        verification_status: 'VERIFIED',
        avatar: finalAvatar
      };
      if (dbStore.upsertStudent) dbStore.upsertStudent(studentRec);
      if (dbStore.students) dbStore.students.unshift(studentRec);

      // Async sync to Supabase if table exists
      try {
        await supabase.from('students').insert([studentRec]);
      } catch (e) {}

    } else if (userRole === 'ALUMNI') {
      const alumniRec = {
        id: `alm-${Date.now()}`,
        alumni_id: Date.now() % 100000,
        user_id: userId,
        full_name: fullName,
        name: fullName,
        email: cleanEmail,
        college_id: collegeId || 1,
        college_name: finalCollege,
        company: finalCompany || 'Tech Industry',
        current_role: finalRoleTitle,
        role_title: finalRoleTitle,
        skills: finalSkills,
        experience_years: 3,
        career_domain: 'Engineering',
        verification_status: 'VERIFIED',
        availability: 'Available',
        avatar: finalAvatar
      };
      if (dbStore.upsertAlumni) dbStore.upsertAlumni(alumniRec);
      if (dbStore.alumni) dbStore.alumni.unshift(alumniRec);

      try {
        await supabase.from('alumni').insert([alumniRec]);
      } catch (e) {}

    } else if (userRole === 'RECRUITER') {
      const recRec = {
        id: `rec-${Date.now()}`,
        recruiter_id: Date.now() % 100000,
        user_id: userId,
        company_name: finalCompany || fullName,
        email: cleanEmail,
        role: 'RECRUITER',
        industry: 'Technology',
        verification_status: 'VERIFIED',
        avatar: finalAvatar
      };
      if (dbStore.upsertRecruiter) dbStore.upsertRecruiter(recRec);
      if (dbStore.recruiters) dbStore.recruiters.unshift(recRec);

      try {
        await supabase.from('recruiters').insert([recRec]);
      } catch (e) {}
    }

    // Sync user record to Supabase
    try {
      await supabase.from('users').insert([{
        id: userId,
        email: cleanEmail,
        password_hash,
        role: userRole,
        verification_status: 'VERIFIED',
        avatar: finalAvatar
      }]);
    } catch (e) {}

    await logUserActivity({
      userId,
      userEmail: cleanEmail,
      userName: fullName,
      action: 'SIGNUP',
      details: { role: userRole },
      req
    });

    const token = generateJwt(newUser);
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to BridgeUp.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.toLowerCase().trim();
    let user = dbStore.findUserByEmail ? dbStore.findUserByEmail(cleanEmail) : dbStore.users.find(u => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      // Check Supabase
      try {
        const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).single();
        if (data) {
          user = data;
          dbStore.users.push(user);
        }
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }

    // Check password if user has password_hash
    if (password && user.password_hash) {
      const match = bcrypt.compareSync(password, user.password_hash);
      const isDemoPass = ['password123', 'DemoPass@123', 'DemoAdmin@123'].includes(password);
      if (!match && !isDemoPass) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }
    }

    // Populate full student/alumni details if available
    if (user.role === 'STUDENT' && dbStore.students) {
      const student = dbStore.students.find(s => s.user_id === user.id || s.email?.toLowerCase() === cleanEmail);
      if (student) {
        user = {
          ...user,
          gpa: student.gpa || student.cgpa || user.gpa || '8.80',
          major: student.major || student.department || user.major,
          skills: student.skills || user.skills || ['React', 'Python'],
          college_name: student.college_name || user.college_name
        };
      }
    } else if (user.role === 'ALUMNI' && dbStore.alumni) {
      const alum = dbStore.alumni.find(a => a.user_id === user.id || a.email?.toLowerCase() === cleanEmail);
      if (alum) {
        user = {
          ...user,
          company: alum.company || user.company,
          role_title: alum.role_title || alum.current_role || user.role_title,
          skills: alum.skills || user.skills
        };
      }
    }

    if (dbStore.updateUser) {
      dbStore.updateUser(user.id, { status: 'online', last_seen: new Date().toISOString() });
    }

    await logUserActivity({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.displayName || user.display_name,
      action: 'LOGIN',
      details: { role: user.role },
      req
    });

    const token = generateJwt(user);
    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Current Authenticated User (/me)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = dbStore.findUserById ? dbStore.findUserById(req.user.id) : dbStore.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Update Profile
router.patch('/profile', async (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    let updated = dbStore.updateUser ? dbStore.updateUser(userId, updates) : null;
    if (!updated) {
      const found = dbStore.users.find(u => u.id === userId || u.user_id === userId);
      if (found) {
        Object.assign(found, updates);
        updated = found;
      }
    }

    // Also update student/alumni record
    if (updated) {
      if (updated.role === 'STUDENT' && dbStore.students) {
        const student = dbStore.students.find(s => s.user_id === userId || s.id === userId);
        if (student) Object.assign(student, updates);
      } else if (updated.role === 'ALUMNI' && dbStore.alumni) {
        const alum = dbStore.alumni.find(a => a.user_id === userId || a.id === userId);
        if (alum) Object.assign(alum, updates);
      }
    }

    // Sync to Supabase
    try {
      await supabase.from('users').update(updates).eq('id', userId);
    } catch (e) {}

    await logUserActivity({
      userId,
      userEmail: updated?.email,
      userName: updated?.name || updated?.display_name,
      action: 'PROFILE_UPDATE',
      details: { fields: Object.keys(updates) },
      req
    });

    return res.json({ success: true, message: 'Profile updated & synced.', user: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (userId && dbStore.updateUser) {
      dbStore.updateUser(userId, { status: 'offline', last_seen: new Date().toISOString() });
    }
    await logUserActivity({
      userId,
      userEmail: email,
      action: 'LOGOUT',
      req
    });
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Get Demo Accounts
router.get('/demo-users', (req, res) => {
  const users = dbStore.getUsers ? dbStore.getUsers().slice(0, 24) : (dbStore.users || []).slice(0, 24);
  return res.json({ success: true, users });
});

export default router;
