/**
 * BRIDGEUP AI Matching Engine
 * Multi-factor deterministic & semantic mentor matching algorithm
 */

export function calculateAIMatchScore(student, mentor, preferences = {}) {
  let score = 0;
  const matchReasons = [];

  // 1. Skills Overlap (35 points)
  const studentSkills = Array.isArray(student.skills) ? student.skills : (student.skills ? student.skills.split(',').map(s => s.trim()) : []);
  const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : (mentor.skills ? mentor.skills.split(',').map(s => s.trim()) : []);
  
  if (student.primary_skill && !studentSkills.includes(student.primary_skill)) {
    studentSkills.push(student.primary_skill);
  }

  const commonSkills = studentSkills.filter(s =>
    mentorSkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase()))
  );

  const skillScore = studentSkills.length > 0 
    ? Math.min(35, (commonSkills.length / Math.max(1, Math.min(studentSkills.length, 3))) * 35)
    : 15;
  score += skillScore;

  if (commonSkills.length > 0) {
    matchReasons.push(`Strong skills alignment in ${commonSkills.slice(0, 3).join(', ')}`);
  }

  // 2. Career Goal Similarity (25 points)
  const studentGoal = (preferences.careerGoal || student.career_goal || '').toLowerCase();
  const mentorRole = (mentor.current_role || '').toLowerCase();
  const mentorBio = (mentor.bio || '').toLowerCase();

  let goalScore = 5;
  if (studentGoal) {
    const goalTokens = studentGoal.split(/\s+/).filter(t => t.length > 3);
    const matchedTokens = goalTokens.filter(t => mentorRole.includes(t) || mentorBio.includes(t));
    if (matchedTokens.length > 0) {
      goalScore = Math.min(25, 12 + (matchedTokens.length * 6.5));
      matchReasons.push(`Direct alignment with your goal: "${student.career_goal || preferences.careerGoal}"`);
    } else {
      goalScore = 12;
    }
  }
  score += goalScore;

  // 3. Career Domain Alignment (15 points)
  const studentDomain = (preferences.careerDomain || student.career_domain || '').toLowerCase();
  const mentorDomain = (mentor.career_domain || '').toLowerCase();
  
  if (studentDomain && mentorDomain && (studentDomain.includes(mentorDomain) || mentorDomain.includes(studentDomain))) {
    score += 15;
    matchReasons.push(`Shares your target domain in ${mentor.career_domain}`);
  } else {
    score += 8;
  }

  // 4. Career Path & Experience (10 points)
  const expYears = Number(mentor.experience_years) || 2;
  const prefExp = Number(preferences.experienceYears) || 0;
  if (prefExp > 0 && expYears >= prefExp) {
    score += 10;
    matchReasons.push(`Has ${expYears}+ years of proven industry experience`);
  } else {
    score += Math.min(10, 4 + expYears * 1.5);
  }

  // 5. College Relationship (10 points)
  if (student.college_id && mentor.college_id && Number(student.college_id) === Number(mentor.college_id)) {
    score += 10;
    matchReasons.push(`Alumni of your college network`);
  } else {
    score += 4;
  }

  // 6. Mentor Availability & Status (5 points)
  if (mentor.availability === 'Available' || mentor.availability === 'Open') {
    score += 5;
  } else {
    score += 2;
  }

  const finalScore = Math.min(99, Math.max(55, Math.round(score)));

  // Synthesize natural language explanation
  let explanation = `Matched (${finalScore}%) because you both share focus in ${commonSkills.length > 0 ? commonSkills.join(', ') : (mentor.career_domain || 'Technology')}`;
  if (mentor.company) {
    explanation += `, and this mentor works at ${mentor.company}`;
  }
  if (matchReasons.length > 1) {
    explanation += `. Key factors: ${matchReasons.slice(0, 2).join('; ')}.`;
  } else {
    explanation += ` with active mentorship availability.`;
  }

  return {
    score: finalScore,
    matchReasons,
    explanation,
    isVerified: mentor.verification_status === 'Verified' || mentor.isVerified
  };
}

export function rankMentorsForStudent(student, mentorsList, filters = {}) {
  // Hard filters first
  let candidates = [...mentorsList];

  if (filters.onlyVerified !== false) {
    candidates = candidates.filter(m => m.verification_status === 'Verified' || m.isVerified || m.verification_status === undefined);
  }
  if (filters.company && filters.company !== 'All') {
    candidates = candidates.filter(m => (m.company || '').toLowerCase() === filters.company.toLowerCase());
  }
  if (filters.college_id) {
    candidates = candidates.filter(m => String(m.college_id) === String(filters.college_id));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    candidates = candidates.filter(m =>
      (m.full_name || m.name || '').toLowerCase().includes(q) ||
      (m.company || '').toLowerCase().includes(q) ||
      (m.current_role || m.jobTitle || '').toLowerCase().includes(q) ||
      (m.skills || []).some(s => s.toLowerCase().includes(q))
    );
  }

  // Score & Rank
  const ranked = candidates.map(mentor => {
    const match = calculateAIMatchScore(student, mentor, filters);
    return {
      ...mentor,
      aiMatchScore: match.score,
      aiExplanation: match.explanation,
      matchReasons: match.matchReasons
    };
  });

  ranked.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
  return ranked;
}
