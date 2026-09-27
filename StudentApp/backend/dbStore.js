import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretnextstepjwtkey2026';

class DBStore {
  constructor() {
    this.colleges = [];
    this.users = [];
    this.students = [];
    this.alumni = [];
    this.recruiters = [];
    this.studentSkills = [];
    this.alumniSkills = [];
    this.jobs = [];
    this.mentorships = [];
    this.hackathons = [];
    this.hackathonParticipants = [];
    this.hackathonPartnerRequests = [];
    this.referrals = [];
    this.events = [];
    this.eventRegistrations = [];
    this.notifications = [];
    this.conversations = [];
    this.messages = [];
    this.auditLogs = [];
  }

  // --- Colleges ---
  upsertCollege(c) {
    const idx = this.colleges.findIndex(item => item.college_id === c.college_id);
    if (idx !== -1) this.colleges[idx] = { ...this.colleges[idx], ...c };
    else this.colleges.push({ id: `col-${c.college_id}`, ...c });
    return c;
  }
  getColleges() { return this.colleges; }
  getCollegeById(id) { return this.colleges.find(c => c.college_id === Number(id) || c.id === id); }

  // --- Users ---
  createUser(userData) {
    const cleanEmail = (userData.email || '').toLowerCase().trim();
    const idx = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    const userObj = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      email: cleanEmail,
      role: (userData.role || 'STUDENT').toUpperCase(),
      displayName: userData.displayName || userData.display_name || userData.name || cleanEmail.split('@')[0],
      name: userData.name || userData.display_name || cleanEmail.split('@')[0],
      verificationStatus: userData.verificationStatus || userData.verification_status || 'Verified',
      status: 'online',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`,
      createdAt: new Date().toISOString(),
      ...userData
    };
    if (idx !== -1) this.users[idx] = { ...this.users[idx], ...userObj };
    else this.users.push(userObj);
    return userObj;
  }
  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }
  findUserById(id) {
    return this.users.find(u => String(u.id) === String(id) || String(u.user_id) === String(id));
  }
  updateUser(id, updates) {
    const idx = this.users.findIndex(u => String(u.id) === String(id) || String(u.user_id) === String(id));
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date().toISOString() };
      return this.users[idx];
    }
    return null;
  }
  getUsers(filters = {}) {
    let list = this.users;
    if (filters.role) list = list.filter(u => u.role === filters.role.toUpperCase());
    if (filters.status) list = list.filter(u => u.verificationStatus === filters.status);
    return list;
  }

  // --- Students ---
  upsertStudent(s) {
    const idx = this.students.findIndex(item => item.student_id === s.student_id || item.email === s.email);
    const studentObj = {
      id: `std-${s.student_id}`,
      ...s,
      skills: this.getSkillsForStudent(s.student_id)
    };
    if (idx !== -1) this.students[idx] = { ...this.students[idx], ...studentObj };
    else this.students.push(studentObj);
    return studentObj;
  }
  getStudents(filters = {}) {
    let list = this.students.map(s => ({
      ...s,
      skills: this.getSkillsForStudent(s.student_id)
    }));
    if (filters.college_id) list = list.filter(s => String(s.college_id) === String(filters.college_id));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.primary_skill?.toLowerCase().includes(q) ||
        s.skills?.some(sk => sk.toLowerCase().includes(q))
      );
    }
    if (filters.minCgpa) list = list.filter(s => Number(s.cgpa) >= Number(filters.minCgpa));
    if (filters.verification_status) list = list.filter(s => s.verification_status === filters.verification_status);
    return list;
  }
  getStudentById(id) {
    return this.students.find(s => String(s.student_id) === String(id) || s.id === id || s.user_id === id);
  }
  getSkillsForStudent(studentId) {
    return this.studentSkills.filter(sk => Number(sk.student_id) === Number(studentId)).map(sk => sk.skill);
  }
  getStudentPeers(excludeId, excludeEmail) {
    let list = this.students.map(s => {
      const skills = this.getSkillsForStudent(s.student_id);
      return {
        id: s.id || `std-${s.student_id}`,
        name: s.full_name || s.name || 'Student Peer',
        email: s.email,
        major: s.major || s.branch || 'Computer Science',
        skills: (skills && skills.length > 0) ? skills : (s.skills || ['JavaScript', 'React']),
        collegeId: s.college_id,
        cgpa: s.cgpa || 8.5,
        graduationYear: s.graduation_year || 2026,
        jobTitle: s.job_title || 'Student',
        streakDays: s.streak_days || 3,
        studyHoursWeek: s.study_hours_week || 14.5,
        verificationStatus: s.verification_status || 'Verified',
        avatar: s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.email || 'student')}`
      };
    });
    if (excludeId) list = list.filter(p => String(p.id) !== String(excludeId) && String(p.student_id) !== String(excludeId));
    if (excludeEmail) list = list.filter(p => (p.email || '').toLowerCase() !== (excludeEmail || '').toLowerCase());
    return list;
  }

  // --- Alumni ---
  upsertAlumni(a) {
    const idx = this.alumni.findIndex(item => item.alumni_id === a.alumni_id || item.email === a.email);
    const alumniObj = {
      id: `alm-${a.alumni_id}`,
      ...a,
      skills: this.getSkillsForAlumni(a.alumni_id),
      topics: a.topics || ['Career Guidance', 'System Design Review', 'Mock Technical Interviews']
    };
    if (idx !== -1) this.alumni[idx] = { ...this.alumni[idx], ...alumniObj };
    else this.alumni.push(alumniObj);
    return alumniObj;
  }
  getAlumni(filters = {}) {
    let list = this.alumni.map(a => ({
      ...a,
      skills: this.getSkillsForAlumni(a.alumni_id)
    }));
    if (filters.company && filters.company !== 'All') list = list.filter(a => a.company?.toLowerCase() === filters.company.toLowerCase());
    if (filters.college_id) list = list.filter(a => String(a.college_id) === String(filters.college_id));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a =>
        a.full_name?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.current_role?.toLowerCase().includes(q) ||
        a.skills?.some(sk => sk.toLowerCase().includes(q))
      );
    }
    if (filters.verification_status) list = list.filter(a => a.verification_status === filters.verification_status);
    return list;
  }
  getAlumniById(id) {
    return this.alumni.find(a => String(a.alumni_id) === String(id) || a.id === id || a.user_id === id);
  }
  getSkillsForAlumni(alumniId) {
    return this.alumniSkills.filter(ak => Number(ak.alumni_id) === Number(alumniId)).map(ak => ak.skill);
  }

  // --- Recruiters ---
  upsertRecruiter(r) {
    const idx = this.recruiters.findIndex(item => item.recruiter_id === r.recruiter_id || item.email === r.email);
    if (idx !== -1) this.recruiters[idx] = { ...this.recruiters[idx], ...r };
    else this.recruiters.push({ id: `rec-${r.recruiter_id}`, ...r });
    return r;
  }
  getRecruiters() { return this.recruiters; }

  // --- Jobs ---
  upsertJob(j) {
    const idx = this.jobs.findIndex(item => item.job_id === j.job_id);
    if (idx !== -1) this.jobs[idx] = { ...this.jobs[idx], ...j };
    else this.jobs.push({ id: `job-${j.job_id}`, ...j });
    return j;
  }
  getJobs(filters = {}) {
    let list = this.jobs;
    if (filters.type && filters.type !== 'All') list = list.filter(j => j.employment_type?.toLowerCase() === filters.type.toLowerCase());
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(j =>
        j.role_title?.toLowerCase().includes(q) ||
        j.company_name?.toLowerCase().includes(q) ||
        j.required_skills?.toLowerCase().includes(q)
      );
    }
    if (filters.status) list = list.filter(j => j.status?.toLowerCase() === filters.status.toLowerCase());
    return list;
  }
  getJobById(id) {
    return this.jobs.find(j => j.job_id === Number(id) || String(j.job_id) === String(id) || j.id === id);
  }

  // --- Mentorships ---
  upsertMentorship(m) {
    const idx = this.mentorships.findIndex(item => item.mentorship_id === m.mentorship_id);
    if (idx !== -1) this.mentorships[idx] = { ...this.mentorships[idx], ...m };
    else this.mentorships.push({ id: `msh-${m.mentorship_id || Date.now()}`, ...m });
    return m;
  }
  getMentorships(filters = {}) {
    let list = this.mentorships;
    if (filters.student_id) list = list.filter(m => Number(m.student_id) === Number(filters.student_id));
    if (filters.alumni_id) list = list.filter(m => Number(m.alumni_id) === Number(filters.alumni_id));
    if (filters.status) list = list.filter(m => m.status === filters.status.toUpperCase());
    return list;
  }
  createMentorshipRequest(data) {
    const newReq = {
      id: `msh-${Date.now()}`,
      mentorship_id: Date.now() % 100000,
      student_id: Number(data.student_id),
      alumni_id: Number(data.alumni_id),
      goal: data.goal || 'Career Mentorship',
      status: 'REQUESTED',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      source: 'Student Request',
      ai_match_score: data.ai_match_score || 88.0,
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    this.mentorships.unshift(newReq);
    return newReq;
  }
  updateMentorshipStatus(mentorshipId, status, feedback = '') {
    const found = this.mentorships.find(m => String(m.mentorship_id) === String(mentorshipId) || m.id === mentorshipId);
    if (found) {
      found.status = status.toUpperCase();
      if (feedback) found.feedback = feedback;
      found.updated_at = new Date().toISOString();
      return found;
    }
    return null;
  }

  // --- Referrals ---
  upsertReferral(r) {
    const idx = this.referrals.findIndex(item => item.referral_id === r.referral_id);
    if (idx !== -1) this.referrals[idx] = { ...this.referrals[idx], ...r };
    else this.referrals.push({ id: `ref-${r.referral_id || Date.now()}`, ...r });
    return r;
  }
  getReferrals(filters = {}) {
    let list = this.referrals;
    if (filters.alumni_id) list = list.filter(r => Number(r.alumni_id) === Number(filters.alumni_id));
    if (filters.student_id) list = list.filter(r => Number(r.student_id) === Number(filters.student_id));
    if (filters.job_id) list = list.filter(r => Number(r.job_id) === Number(filters.job_id));
    return list;
  }
  createReferral(data) {
    const newRef = {
      id: `ref-${Date.now()}`,
      referral_id: Date.now() % 100000,
      alumni_id: Number(data.alumni_id),
      student_id: Number(data.student_id),
      job_id: Number(data.job_id),
      status: 'SUBMITTED',
      recommendation_reason: data.recommendation_reason || 'Highly recommended based on technical evaluations and projects.',
      created_at: new Date().toISOString()
    };
    this.referrals.unshift(newRef);
    return newRef;
  }

  // --- Hackathons ---
  upsertHackathon(h) {
    const idx = this.hackathons.findIndex(item => item.hackathon_id === h.hackathon_id);
    if (idx !== -1) this.hackathons[idx] = { ...this.hackathons[idx], ...h };
    else this.hackathons.push({ id: `hck-${h.hackathon_id}`, ...h });
    return h;
  }
  getHackathons() { return this.hackathons; }
  getHackathonParticipants(hackathonId) {
    if (!hackathonId) return this.hackathonParticipants;
    return this.hackathonParticipants.filter(p => Number(p.hackathon_id) === Number(hackathonId));
  }
  getHackathonPartnerRequests(hackathonId) {
    if (!hackathonId) return this.hackathonPartnerRequests;
    return this.hackathonPartnerRequests.filter(pr => Number(pr.hackathon_id) === Number(hackathonId));
  }
  createPartnerRequest(data) {
    const newPr = {
      id: `pr-${Date.now()}`,
      request_id: Date.now() % 100000,
      student_id: Number(data.student_id),
      hackathon_id: Number(data.hackathon_id),
      required_skill_1: data.required_skill_1 || 'Full Stack',
      required_skill_2: data.required_skill_2 || 'AI / ML',
      preferred_location: data.preferred_location || 'All India',
      status: 'Open',
      created_at: new Date().toISOString()
    };
    this.hackathonPartnerRequests.unshift(newPr);
    return newPr;
  }

  // --- Events ---
  upsertEvent(e) {
    const idx = this.events.findIndex(item => item.event_id === e.event_id);
    if (idx !== -1) this.events[idx] = { ...this.events[idx], ...e };
    else this.events.push({ id: `ev-${e.event_id}`, ...e });
    return e;
  }
  getEvents(filters = {}) {
    let list = this.events;
    if (filters.college_id) list = list.filter(e => Number(e.college_id) === Number(filters.college_id));
    return list;
  }
  registerForEvent(eventId, userId, userName, userEmail) {
    const ev = this.events.find(e => Number(e.event_id) === Number(eventId));
    if (ev) {
      ev.registered_count = (ev.registered_count || 0) + 1;
      const reg = {
        id: `reg-${Date.now()}`,
        event_id: Number(eventId),
        user_id: String(userId),
        user_name: userName,
        user_email: userEmail,
        created_at: new Date().toISOString()
      };
      this.eventRegistrations.push(reg);
      return { success: true, event: ev, registration: reg };
    }
    return { success: false, message: 'Event not found' };
  }

  // --- Notifications ---
  createNotification(notif) {
    const item = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: String(notif.user_id),
      type: notif.type || 'SYSTEM',
      title: notif.title,
      message: notif.message,
      link: notif.link || '',
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(item);
    return item;
  }
  getNotifications(userId) {
    return this.notifications.filter(n => String(n.user_id) === String(userId));
  }
  markNotificationRead(notifId) {
    const n = this.notifications.find(item => item.id === notifId);
    if (n) n.is_read = true;
    return n;
  }

  // --- Audit Logs ---
  logActivity(entry) {
    const log = {
      id: `log-${Date.now()}`,
      actor_user_id: entry.actor_user_id || null,
      user_email: entry.user_email || null,
      user_name: entry.user_name || null,
      action: entry.action,
      target_type: entry.target_type || '',
      target_id: entry.target_id || '',
      details: entry.details || {},
      ip_address: entry.ip_address || '127.0.0.1',
      user_agent: entry.user_agent || 'BridgeUp Web App',
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }
  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  // Generate JWT Token
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id || user.user_id,
        email: user.email,
        name: user.name || user.displayName || user.display_name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

export const dbStore = new DBStore();
