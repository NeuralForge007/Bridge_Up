const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('nextstep_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const apiService = {
  // ──────────────── Auth & Demo Users ────────────────
  async getDemoUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/demo-users`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      console.warn('API getDemoUsers error:', err.message);
      return [];
    }
  },

  async register(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (data.token) localStorage.setItem('nextstep_token', data.token);
      return data;
    } catch (err) {
      console.warn('API register error:', err.message);
      throw err;
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.token) localStorage.setItem('nextstep_token', data.token);
      return data;
    } catch (err) {
      console.warn('API login error:', err.message);
      throw err;
    }
  },

  async logout(userId, email) {
    try {
      localStorage.removeItem('nextstep_token');
      localStorage.removeItem('nextstep_user');
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ userId, email })
      });
    } catch (err) {
      console.warn('API logout notice:', err.message);
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders()
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      return null;
    }
  },

  async updateProfile(userId, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ userId, ...updates })
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.warn('API profile update error:', err.message);
      return null;
    }
  },

  // ──────────────── AI Mentor Matcher & Mentorships ────────────────
  async aiMatchMentors(criteria) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/ai/match`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(criteria)
      });
      const data = await res.json();
      return data.matches || [];
    } catch (err) {
      console.warn('API aiMatchMentors error:', err.message);
      return [];
    }
  },

  async getMentors(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.company) params.append('company', filters.company);
      if (filters.search) params.append('search', filters.search);
      if (filters.domain) params.append('domain', filters.domain);

      const res = await fetch(`${API_BASE_URL}/mentors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch mentors');
      const data = await res.json();
      return data.mentors || [];
    } catch (err) {
      console.warn('API getMentors error:', err.message);
      return [];
    }
  },

  async requestMentorship(requestData) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit mentorship request');
      return data.request;
    } catch (err) {
      console.warn('API requestMentorship error:', err.message);
      throw err;
    }
  },

  async getMentorshipRequests(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/requests/${userId || 'me'}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.requests || [];
    } catch (err) {
      return [];
    }
  },

  async updateMentorshipStatus(requestId, status, meetingLink) {
    try {
      const res = await fetch(`${API_BASE_URL}/mentors/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, meetingLink })
      });
      const data = await res.json();
      return data.request || null;
    } catch (err) {
      console.warn('API updateMentorshipStatus error:', err.message);
      return null;
    }
  },

  // ──────────────── Recruiter Portal ────────────────
  async getRecruiterCandidates(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.collegeId) params.append('collegeId', filters.collegeId);
      if (filters.minCgpa) params.append('minCgpa', filters.minCgpa);
      if (filters.verifiedOnly) params.append('verifiedOnly', 'true');
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE_URL}/recruiters/candidates?${params.toString()}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.candidates || [];
    } catch (err) {
      console.warn('API getRecruiterCandidates error:', err.message);
      return [];
    }
  },

  async shortlistCandidate(candidateId, notes) {
    try {
      const res = await fetch(`${API_BASE_URL}/recruiters/shortlist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ candidateId, notes })
      });
      return await res.json();
    } catch (err) {
      console.warn('API shortlistCandidate error:', err.message);
      return null;
    }
  },

  async getRecruiterMetrics() {
    try {
      const res = await fetch(`${API_BASE_URL}/recruiters/metrics`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.metrics || null;
    } catch (err) {
      return null;
    }
  },

  // ──────────────── College Admin Portal ────────────────
  async getCollegeDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/colleges/dashboard`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.dashboard || null;
    } catch (err) {
      return null;
    }
  },

  async getPendingStudents() {
    try {
      const res = await fetch(`${API_BASE_URL}/colleges/verifications/students`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.students || [];
    } catch (err) {
      return [];
    }
  },

  async verifyStudent(studentId, status, rejectionReason) {
    try {
      const res = await fetch(`${API_BASE_URL}/colleges/verifications/students/${studentId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, rejectionReason })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getPendingAlumni() {
    try {
      const res = await fetch(`${API_BASE_URL}/colleges/verifications/alumni`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.alumni || [];
    } catch (err) {
      return [];
    }
  },

  async verifyAlumni(alumniId, status, rejectionReason) {
    try {
      const res = await fetch(`${API_BASE_URL}/colleges/verifications/alumni/${alumniId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, rejectionReason })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Super Admin Portal ────────────────
  async getSuperAdminAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.analytics || null;
    } catch (err) {
      return null;
    }
  },

  async getColleges() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/colleges`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.colleges || [];
    } catch (err) {
      return [];
    }
  },

  async createCollege(collegeData) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/colleges`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(collegeData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getAllUsers(role) {
    try {
      const url = role ? `${API_BASE_URL}/admin/users?role=${role}` : `${API_BASE_URL}/admin/users`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      return [];
    }
  },

  async updateUserStatus(userId, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.logs || [];
    } catch (err) {
      return [];
    }
  },

  // ──────────────── Jobs & Internships ────────────────
  async getJobs(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.role) params.append('role', filters.role);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`);
      const data = await res.json();
      return data.jobs || [];
    } catch (err) {
      return [];
    }
  },

  async applyToJob(jobId, applicationData) {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(applicationData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createJob(jobData) {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jobData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Referrals Pipeline ────────────────
  async getReferrals(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.alumniId) params.append('alumniId', filters.alumniId);

      const res = await fetch(`${API_BASE_URL}/referrals?${params.toString()}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.referrals || [];
    } catch (err) {
      return [];
    }
  },

  async submitReferral(referralData) {
    try {
      const res = await fetch(`${API_BASE_URL}/referrals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(referralData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateReferralStatus(referralId, status, feedback) {
    try {
      const res = await fetch(`${API_BASE_URL}/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, feedback })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Hackathons & Partner Matching ────────────────
  async getHackathons(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.domain) params.append('domain', filters.domain);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE_URL}/hackathons?${params.toString()}`);
      const data = await res.json();
      return data.hackathons || [];
    } catch (err) {
      return [];
    }
  },

  async getHackathonById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/hackathons/${id}`);
      const data = await res.json();
      return data.hackathon || null;
    } catch (err) {
      return null;
    }
  },

  async registerForHackathon(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/hackathons/${id}/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getHackathonPartners(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/hackathons/${id}/partners`);
      const data = await res.json();
      return data.requests || [];
    } catch (err) {
      return [];
    }
  },

  async postHackathonPartnerRequest(id, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/hackathons/${id}/partners`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Campus & Alumni Events ────────────────
  async getEvents(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE_URL}/events?${params.toString()}`);
      const data = await res.json();
      return data.events || [];
    } catch (err) {
      return [];
    }
  },

  async registerForEvent(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}/register`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createEvent(eventData) {
    try {
      const res = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Notifications ────────────────
  async getNotifications() {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getHeaders()
      });
      const data = await res.json();
      return data.notifications || [];
    } catch (err) {
      return [];
    }
  },

  async markNotificationRead(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async markAllNotificationsRead() {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // ──────────────── Legacy / Peer & Group Methods ────────────────
  async getPeers(excludeId, excludeEmail) {
    try {
      const params = new URLSearchParams();
      if (excludeId) params.append('excludeId', excludeId);
      if (excludeEmail) params.append('excludeEmail', excludeEmail);

      const res = await fetch(`${API_BASE_URL}/peers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch peers');
      const data = await res.json();
      return data.peers || [];
    } catch (err) {
      return [];
    }
  },

  async toggleConnection(userId, peerId) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, peerId })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getConnections(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${userId}`);
      const data = await res.json();
      return data.connections || [];
    } catch (err) {
      return [];
    }
  },

  async getConversations(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/conversations/${userId}`);
      const data = await res.json();
      return data.conversations || [];
    } catch (err) {
      return [];
    }
  },

  async sendMessage(msgData) {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(msgData)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getStudyGroups(userId) {
    try {
      const url = userId ? `${API_BASE_URL}/groups?userId=${userId}` : `${API_BASE_URL}/groups`;
      const res = await fetch(url);
      const data = await res.json();
      return data.groups || [];
    } catch (err) {
      return [];
    }
  },

  async toggleGroupJoin(groupId, userId, userName) {
    try {
      const res = await fetch(`${API_BASE_URL}/groups/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ groupId, userId, userName })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async createStudyGroup(groupData) {
    try {
      const res = await fetch(`${API_BASE_URL}/groups/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(groupData)
      });
      const data = await res.json();
      return data.group;
    } catch (err) {
      return null;
    }
  },

  async getAssignments(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/assignments/${userId || 'demo-1'}`);
      const data = await res.json();
      return data.assignments || [];
    } catch (err) {
      return [];
    }
  },

  async createAssignment(assignmentData) {
    try {
      const res = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assignmentData)
      });
      const data = await res.json();
      return data.assignment;
    } catch (err) {
      return null;
    }
  },

  async updateAssignmentStatus(id, status, userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/assignments/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, userId })
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};
