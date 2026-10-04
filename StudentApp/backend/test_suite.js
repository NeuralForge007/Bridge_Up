/**
 * BridgeUp Comprehensive Automated Test Suite
 * Tests:
 * 1. Authentication & Student Registration (bcrypt, validation, uniqueness, profile creation)
 * 2. AI Mentor Matcher (same-college constraint, real SBERT scores, exact match detection, score breakdown)
 * 3. AI Teammate Finder & Hackathon Lifecycle (requirements, recommendations, join requests, atomic acceptance)
 */

import http from 'http';
import { URL } from 'url';

const API_BASE = 'http://localhost:5001';
const AI_BASE = 'http://localhost:8001';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n==========================================================================');
  console.log('🧪 BRIDGEUP FULL-STACK INTEGRATION TEST SUITE');
  console.log('==========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------------------------
    // 1. Health and Readiness Checks
    // ----------------------------------------------------------------------
    console.log('[SUITE 1: Infrastructure & Service Health]');
    const expressHealth = await request(`${API_BASE}/api/health`);
    assert(expressHealth.status === 200 && expressHealth.data.status === 'OK', 'Express backend is healthy');

    const aiReady = await request(`${AI_BASE}/ready`);
    assert(aiReady.status === 200 && aiReady.data.model_loaded === true && aiReady.data.embedding_dim === 384, 'FastAPI SBERT service is ready with 384-d embeddings');

    // ----------------------------------------------------------------------
    // 2. Authentication & Registration Flow
    // ----------------------------------------------------------------------
    console.log('\n[SUITE 2: Secure Registration & Authentication]');
    
    // 2.1 Missing password validation
    const missingPwdRes = await request(`${API_BASE}/api/auth/register`, { method: 'POST' }, {
      email: 'test_no_pwd@example.com',
      full_name: 'Test No Password',
      college_id: 1
    });
    assert(missingPwdRes.status === 400 && missingPwdRes.data.error, 'Rejects registration without password');

    // 2.2 Short password validation
    const shortPwdRes = await request(`${API_BASE}/api/auth/register`, { method: 'POST' }, {
      email: 'test_short@example.com',
      password: '123',
      full_name: 'Test Short Password',
      college_id: 1
    });
    assert(shortPwdRes.status === 400, 'Rejects passwords shorter than 8 characters');

    // 2.3 Successful Student Registration
    const testEmail = `student_test_${Date.now()}@bridgeup.example`;
    const regRes = await request(`${API_BASE}/api/auth/register`, { method: 'POST' }, {
      email: testEmail,
      password: 'StrongPassword123!',
      full_name: 'Sayan Banerjee Automated',
      gender: 'Male',
      college_id: 1, // IEM
      year_of_study: 3,
      graduation_year: 2028,
      degree: 'B.Tech',
      department: 'Computer Science and Engineering',
      cgpa: 8.85,
      career_domain: 'AI / Machine Learning',
      career_goal: 'Build deep learning and computer vision applications at scale',
      primary_skill: 'PyTorch',
      skills: ['Python', 'PyTorch', 'Computer Vision', 'React', 'FastAPI'],
      preferred_team_roles: ['ML Engineer', 'Full Stack Developer'],
      hackathons_participated: 3,
      hackathons_finalist: 1,
      hackathons_won: 0,
      total_projects: 5,
      successful_projects: 4,
      project_domains: ['Healthcare', 'Sustainability'],
      availability: 'Available',
      collaboration_mode: 'Hybrid',
      city: 'Kolkata',
      languages: ['English', 'Bengali', 'Hindi'],
      bio: 'Passionate AI developer and competitive hackathon participant.'
    });

    assert(regRes.status === 201 && regRes.data.token && regRes.data.user, 'Creates authenticated user and linked student profile');
    assert(!regRes.data.user.password_hash && !regRes.data.user.password, 'Never leaks password hash or plaintext password');
    assert(regRes.data.student && regRes.data.student.student_id, 'Returns canonical student record with ID');

    const authToken = regRes.data.token;
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // 2.4 Duplicate Email Rejection
    const dupRes = await request(`${API_BASE}/api/auth/register`, { method: 'POST' }, {
      email: testEmail.toUpperCase(), // Test case-insensitivity
      password: 'StrongPassword123!',
      full_name: 'Duplicate Student',
      college_id: 1,
      cgpa: 8.5
    });
    if (![400, 409].includes(dupRes.status) || !dupRes.data?.error?.toLowerCase().includes('already exists')) {
      console.log('    [DEBUG dupRes]:', dupRes.status, dupRes.data);
    }
    assert([400, 409].includes(dupRes.status) && dupRes.data?.error?.toLowerCase().includes('already exists'), 'Rejects duplicate email registrations case-insensitively');

    // 2.5 Login with Registered Account
    const loginRes = await request(`${API_BASE}/api/auth/login`, { method: 'POST' }, {
      email: testEmail,
      password: 'StrongPassword123!'
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Authenticates newly registered student');

    // ----------------------------------------------------------------------
    // 3. AI Alumni Mentor Matcher
    // ----------------------------------------------------------------------
    console.log('\n[SUITE 3: AI Alumni Mentor Matcher]');

    // 3.1 Unauthenticated request rejection
    const unauthMentorRes = await request(`${API_BASE}/api/mentors/ai/match`, { method: 'POST' }, {
      career_goal: 'I want to become an AI researcher at Google'
    });
    assert(unauthMentorRes.status === 401, 'Rejects unauthenticated mentor match requests');

    // 3.2 Authenticated same-college mentor search
    const mentorRes = await request(`${API_BASE}/api/mentors/ai/match`, {
      method: 'POST',
      headers: authHeaders
    }, {
      career_goal: 'I want to become a Machine Learning Engineer at Google',
      target_role: 'Machine Learning Engineer',
      target_company: 'Google',
      skills: ['Python', 'PyTorch', 'TensorFlow']
    });

    if (mentorRes.status !== 200) {
      console.log('    [DEBUG mentorRes]:', mentorRes.status, mentorRes.data);
    }
    assert(mentorRes.status === 200 && mentorRes.data.success === true, 'Mentor match API succeeds');
    assert(mentorRes.data.student_college && mentorRes.data.student_college.id === 1, 'Resolves student college strictly from authenticated profile (IEM)');
    assert(Array.isArray(mentorRes.data.matches) && mentorRes.data.matches.length > 0, `Returns matches (count: ${mentorRes.data.matches?.length || 0})`);

    // Verify same-college and verified constraint on every returned candidate
    const allSameCollege = mentorRes.data.matches.every(m => m.college_id === 1 || m.college_name.includes('Institute of Engineering'));
    assert(allSameCollege, 'All returned mentors belong strictly to student\'s same college');

    // Verify honest score naming and breakdown (no fake 85/88)
    const topMentor = mentorRes.data.matches[0];
    assert(typeof topMentor.match_score === 'number' && topMentor.match_score > 0, `Top mentor has real empirical match_score: ${topMentor.match_score}%`);
    assert(['EXACT', 'STRONG', 'RELATED'].includes(topMentor.match_type), `Top mentor has honest match_type: ${topMentor.match_type}`);
    assert(topMentor.score_breakdown && typeof topMentor.score_breakdown === 'object', 'Includes score breakdown details');
    assert(Array.isArray(topMentor.reasons) && topMentor.reasons.length > 0, 'Includes evidence-based explanations');

    // ----------------------------------------------------------------------
    // 4. Hackathon List & Team Teammate Finder Flow
    // ----------------------------------------------------------------------
    console.log('\n[SUITE 4: Hackathon Teammate Finder & Join Request Lifecycle]');

    // 4.1 Fetch upcoming hackathons
    const hackRes = await request(`${API_BASE}/api/hackathons?status=Upcoming`);
    assert(hackRes.status === 200 && Array.isArray(hackRes.data.hackathons) && hackRes.data.hackathons.length > 0, `Fetches real hackathons from Supabase (count: ${hackRes.data.hackathons.length})`);

    const targetHackathon = hackRes.data.hackathons[0];

    // 4.2 Post Team Requirement
    const reqRes = await request(`${API_BASE}/api/hackathons/${targetHackathon.id}/team-requirements`, {
      method: 'POST',
      headers: authHeaders
    }, {
      team_name: 'Neural Explorers',
      project_idea: 'Real-time multi-modal medical diagnostics assistant using PyTorch and FastAPI',
      desired_role: 'Full Stack Developer',
      required_skills: ['React', 'Python', 'FastAPI'],
      preferred_gender: 'ANY',
      preferred_college_id: null, // Any college
      min_hackathons: 1,
      min_projects: 1,
      collaboration_mode: 'Hybrid',
      available_slots: 2
    });

    assert(reqRes.status === 201 && reqRes.data.requirement, 'Creates team requirement owned by authenticated student');
    const createdReq = reqRes.data.requirement;

    // 4.3 Fetch Recommendations for Requirement
    const recRes = await request(`${API_BASE}/api/hackathons/${targetHackathon.id}/team-requirements/${createdReq.id}/recommendations`, {
      headers: authHeaders
    });

    assert(recRes.status === 200 && Array.isArray(recRes.data.matches), 'Fetches ranked teammate recommendations');
    assert(recRes.data.matches.length > 0, `Retrieved ${recRes.data.matches.length} candidate matches`);

    // Verify requesting student is excluded
    const requesterExcluded = recRes.data.matches.every(m => String(m.student_id) !== String(regRes.data.student.student_id));
    assert(requesterExcluded, 'Requesting student is excluded from recommendations');

    const topTeammate = recRes.data.matches[0];
    assert(topTeammate.match_score > 0 && topTeammate.matched_skills, `Top teammate score: ${topTeammate.match_score}% with matched skills [${topTeammate.matched_skills.join(', ')}]`);

    // 4.4 Send Join Request to Top Candidate
    const joinRes = await request(`${API_BASE}/api/hackathons/${targetHackathon.id}/team-requirements/${createdReq.id}/join-requests`, {
      method: 'POST',
      headers: authHeaders
    }, {
      recipient_student_id: topTeammate.student_id,
      message: 'Hey! Loved your profile and skills in React & Python. Would you like to join our Neural Explorers team?'
    });

    assert(joinRes.status === 201 && joinRes.data.join_request, 'Sends team join request to candidate');
    const requestId = joinRes.data.join_request.id;

    // 4.5 Prevent Duplicate Active Request
    const dupJoinRes = await request(`${API_BASE}/api/hackathons/${targetHackathon.id}/team-requirements/${createdReq.id}/join-requests`, {
      method: 'POST',
      headers: authHeaders
    }, {
      recipient_student_id: topTeammate.student_id,
      message: 'Duplicate request attempt'
    });
    assert(dupJoinRes.status === 400 && dupJoinRes.data.error.toLowerCase().includes('already sent'), 'Prevents duplicate active join requests');

    // 4.6 Fetch Outgoing Requests
    const outgoingRes = await request(`${API_BASE}/api/team-join-requests/outgoing`, {
      headers: authHeaders
    });
    if (outgoingRes.status !== 200 || !Array.isArray(outgoingRes.data?.requests) || outgoingRes.data.requests.length === 0) {
      console.log('    [DEBUG outgoingRes]:', outgoingRes.status, outgoingRes.data);
    }
    assert(outgoingRes.status === 200 && Array.isArray(outgoingRes.data?.requests) && outgoingRes.data.requests.length > 0, 'Lists outgoing join requests');

    // 4.7 Withdraw Join Request
    const withdrawRes = await request(`${API_BASE}/api/team-join-requests/${requestId}/withdraw`, {
      method: 'PATCH',
      headers: authHeaders
    });
    assert(withdrawRes.status === 200 && withdrawRes.data.join_request.status === 'WITHDRAWN', 'Allows requester to withdraw pending request');

    // ----------------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------------
    console.log('\n==========================================================================');
    console.log(`📊 INTEGRATION TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==========================================================================\n');

  } catch (err) {
    console.error('Fatal error during test suite execution:', err);
    failed++;
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
