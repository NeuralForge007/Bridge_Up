async function test() {
  console.log('--- 1. Testing GET /api/mentors (Directory of 300 Alumni) ---');
  const dirRes = await fetch('http://localhost:5001/api/mentors');
  const dirData = await dirRes.json();
  console.log('Total Mentors in Directory:', dirData.count, 'First mentor:', dirData.mentors?.[0]?.name, '@', dirData.mentors?.[0]?.company);

  console.log('\n--- 2. Testing AI Recommendation for: "I want to become an AI Researcher at Google." ---');
  const matchRes = await fetch('http://localhost:5001/api/mentors/ai/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      career_goal: 'I want to become an AI Researcher at Google.',
      domain: 'AI/ML',
      skills: ['Python', 'PyTorch', 'Deep Learning', 'Transformers']
    })
  });
  const matchData = await matchRes.json();
  console.log('Match Success:', matchData.success, 'isSBERT:', matchData.isSBERT, 'Exact Match Found:', matchData.exact_match_found);
  console.log('Top Match:', matchData.matches?.[0]?.name, '| Role:', matchData.matches?.[0]?.current_role, '| Company:', matchData.matches?.[0]?.company, '| Score:', matchData.matches?.[0]?.matchScore, '%', '| Type:', matchData.matches?.[0]?.matchType);
  console.log('Top Match Reasons:', matchData.matches?.[0]?.reasons);
  console.log('Score Breakdown:', matchData.matches?.[0]?.scoreBreakdown);

  console.log('\n--- 3. Testing AI Recommendation for: "I want to join DRDO as a cybersecurity analyst." ---');
  const matchRes2 = await fetch('http://localhost:5001/api/mentors/ai/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      career_goal: 'I want to join DRDO as a cybersecurity analyst.',
      domain: 'Cybersecurity',
      skills: ['SIEM', 'Linux', 'Network Security', 'Cryptography']
    })
  });
  const matchData2 = await matchRes2.json();
  console.log('Top Match 2:', matchData2.matches?.[0]?.name, '| Role:', matchData2.matches?.[0]?.current_role, '| Company:', matchData2.matches?.[0]?.company, '| Score:', matchData2.matches?.[0]?.matchScore, '%', '| Type:', matchData2.matches?.[0]?.matchType);
  console.log('Top Match 2 Reasons:', matchData2.matches?.[0]?.reasons);
}
test();
