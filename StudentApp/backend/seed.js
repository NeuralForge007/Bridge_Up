import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import { dbStore } from './dbStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATASET_PATH = path.resolve(__dirname, '../NextStep_Test_Dataset.xlsx');

export async function runSeeder() {
  console.log('====================================================');
  console.log('🌱 BRIDGEUP: Ingesting NextStep_Test_Dataset.xlsx');
  console.log('====================================================');

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`❌ Dataset file not found at: ${DATASET_PATH}`);
    return;
  }

  const fileBuffer = fs.readFileSync(DATASET_PATH);
  const workbook = XLSX.read(fileBuffer);
  console.log(`📋 Found ${workbook.SheetNames.length} sheets in workbook:`, workbook.SheetNames);

  const getSheetData = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet);
  };

  // 1. Seed Colleges
  const rawColleges = getSheetData('Colleges');
  console.log(`\n🏫 Seeding ${rawColleges.length} Colleges...`);
  const collegesList = rawColleges.map(c => ({
    college_id: Number(c.college_id),
    college_name: c.college_name,
    city: c.city || '',
    state: c.state || '',
    country: c.country || 'India',
    short_code: c.short_code || '',
    website_domain: c.website_domain || '',
    admin_demo_email: c.admin_demo_email || '',
    status: 'Verified'
  }));

  try {
    const { error } = await supabase.from('colleges').upsert(collegesList, { onConflict: 'college_id' });
    if (error) console.warn('Supabase Colleges notice:', error.message);
    else console.log('✅ Colleges seeded to Supabase.');
  } catch (e) {
    console.warn('Colleges fallback:', e.message);
  }
  collegesList.forEach(c => dbStore.upsertCollege(c));

  // 2. Seed Demo Users & Passwords (bcrypt hashed)
  const rawUsers = getSheetData('Users_Auth_Demo');
  console.log(`\n👥 Seeding ${rawUsers.length} Demo & Core Users...`);
  const defaultHash = bcrypt.hashSync('password123', 8);

  const usersList = [];
  for (const u of rawUsers) {
    const pass = u.demo_password || 'DemoPass@123';
    const password_hash = bcrypt.hashSync(pass, 8);
    usersList.push({
      id: String(u.user_id),
      email: String(u.email).toLowerCase().trim(),
      password_hash,
      role: u.role || 'STUDENT',
      display_name: u.display_name || u.email.split('@')[0],
      verification_status: u.verification_status || 'Verified',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.display_name || u.email)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`
    });
  }

  try {
    const { error } = await supabase.from('users').upsert(usersList, { onConflict: 'email' });
    if (error) console.warn('Supabase Users notice:', error.message);
    else console.log('✅ Users seeded to Supabase.');
  } catch (e) {
    console.warn('Users fallback:', e.message);
  }
  usersList.forEach(u => dbStore.createUser(u));

  // 3. Seed Students
  const rawStudents = getSheetData('Students');
  console.log(`\n🎓 Seeding ${rawStudents.length} Students...`);
  const studentsList = rawStudents.map(s => ({
    student_id: Number(s.student_id),
    user_id: `STUDENT-${s.student_id}`,
    full_name: s.full_name,
    email: String(s.email).toLowerCase().trim(),
    role: 'STUDENT',
    college_id: Number(s.college_id),
    year_of_study: Number(s.year_of_study) || 2,
    degree: s.degree || 'B.Tech',
    department: s.department || 'Computer Science & Engineering',
    graduation_year: Number(s.graduation_year) || 2027,
    cgpa: Number(s.cgpa) || 8.5,
    career_domain: s.career_domain || 'Software Development',
    career_goal: s.career_goal || 'Become a full-stack engineer',
    primary_skill: s.primary_skill || 'Python',
    engagement_status: s.engagement_status || 'Active',
    verification_status: s.verification_status || 'Pending',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.full_name)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`
  }));

  try {
    const { error } = await supabase.from('students').upsert(studentsList, { onConflict: 'student_id' });
    if (error) console.warn('Supabase Students notice:', error.message);
    else console.log('✅ Students seeded to Supabase.');
  } catch (e) {
    console.warn('Students fallback:', e.message);
  }
  studentsList.forEach(s => dbStore.upsertStudent(s));

  // 4. Seed Alumni Mentors
  const rawAlumni = getSheetData('Alumni');
  console.log(`\n💼 Seeding ${rawAlumni.length} Alumni Mentors...`);
  const alumniList = rawAlumni.map(a => ({
    alumni_id: Number(a.alumni_id),
    user_id: `ALUMNI-${a.alumni_id}`,
    full_name: a.full_name,
    email: String(a.email).toLowerCase().trim(),
    role: 'ALUMNI',
    college_id: Number(a.college_id),
    graduation_year: Number(a.graduation_year) || 2020,
    current_role: a.current_role || 'Software Engineer',
    company: a.company || 'Tech Innovations',
    experience_years: Number(a.experience_years) || 3,
    career_domain: a.career_domain || 'Engineering',
    availability: a.availability || 'Available',
    verification_status: a.verification_status || 'Verified',
    mentor_status: a.mentor_status || 'Mentor',
    referral_status: a.referral_status || 'Open for Referrals',
    mentor_rating: Number(a.mentor_rating) || 4.8,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(a.full_name)}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`
  }));

  try {
    const { error } = await supabase.from('alumni').upsert(alumniList, { onConflict: 'alumni_id' });
    if (error) console.warn('Supabase Alumni notice:', error.message);
    else console.log('✅ Alumni seeded to Supabase.');
  } catch (e) {
    console.warn('Alumni fallback:', e.message);
  }
  alumniList.forEach(a => dbStore.upsertAlumni(a));

  // 5. Seed Recruiters
  const rawRecruiters = getSheetData('Recruiters');
  console.log(`\n🏢 Seeding ${rawRecruiters.length} Recruiters...`);
  const recruitersList = rawRecruiters.map(r => ({
    recruiter_id: Number(r.recruiter_id),
    user_id: `REC-${r.recruiter_id}`,
    company_name: r.company_name,
    email: String(r.email).toLowerCase().trim(),
    role: 'Recruiter',
    industry: r.industry || 'Technology',
    verification_status: r.verification_status || 'Verified',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.company_name)}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=ffd5dc`
  }));

  try {
    const { error } = await supabase.from('recruiters').upsert(recruitersList, { onConflict: 'recruiter_id' });
    if (error) console.warn('Supabase Recruiters notice:', error.message);
    else console.log('✅ Recruiters seeded to Supabase.');
  } catch (e) {
    console.warn('Recruiters fallback:', e.message);
  }
  recruitersList.forEach(r => dbStore.upsertRecruiter(r));

  // 6. Seed Student Skills & Alumni Skills
  const rawStudentSkills = getSheetData('Student_Skills');
  const rawAlumniSkills = getSheetData('Alumni_Skills');
  console.log(`\n⚡ Seeding ${rawStudentSkills.length} Student Skills & ${rawAlumniSkills.length} Alumni Skills...`);
  
  dbStore.studentSkills = rawStudentSkills.map(sk => ({
    student_id: Number(sk.student_id),
    skill: sk.skill,
    proficiency: sk.proficiency || 'Intermediate'
  }));

  dbStore.alumniSkills = rawAlumniSkills.map(ak => ({
    alumni_id: Number(ak.alumni_id),
    skill: ak.skill,
    proficiency: ak.proficiency || 'Advanced'
  }));

  // 7. Seed Jobs & Internships
  const rawJobs = getSheetData('Jobs_Internships');
  console.log(`\n💼 Seeding ${rawJobs.length} Jobs & Internships...`);
  const jobsList = rawJobs.map(j => ({
    job_id: Number(j.job_id),
    company_name: j.company_name,
    role_title: j.role_title,
    preferred_college_city: j.preferred_college_city || '',
    country: j.country || 'India',
    employment_type: j.employment_type || 'Full-time',
    required_skills: j.required_skills || 'Problem Solving',
    status: j.status || 'Active',
    application_deadline: j.application_deadline || '2026-12-31',
    recruiter_id: Number(j.recruiter_id) || 3001,
    location: j.preferred_college_city || 'Remote',
    description: `Exciting opportunity at ${j.company_name} for high-performing graduates and interns.`
  }));

  try {
    const { error } = await supabase.from('jobs').upsert(jobsList, { onConflict: 'job_id' });
    if (error) console.warn('Supabase Jobs notice:', error.message);
    else console.log('✅ Jobs seeded to Supabase.');
  } catch (e) {
    console.warn('Jobs fallback:', e.message);
  }
  jobsList.forEach(j => dbStore.upsertJob(j));

  // 8. Seed Mentorships
  const rawMentorships = getSheetData('Mentorships');
  console.log(`\n🤝 Seeding ${rawMentorships.length} Mentorship Records...`);
  const mentorshipsList = rawMentorships.map(m => ({
    mentorship_id: Number(m.mentorship_id),
    student_id: Number(m.student_id),
    alumni_id: Number(m.alumni_id),
    goal: m.goal || 'Career Guidance & Skill Building',
    status: String(m.status || 'REQUESTED').toUpperCase(),
    start_date: m.start_date || '2026-08-01',
    end_date: m.end_date || '2026-10-31',
    source: m.source || 'AI match',
    ai_match_score: Number(m.ai_match_score) ? (Number(m.ai_match_score) <= 1 ? Math.round(Number(m.ai_match_score) * 100) : Number(m.ai_match_score)) : 88.0
  }));

  try {
    const { error } = await supabase.from('mentorships').upsert(mentorshipsList, { onConflict: 'mentorship_id' });
    if (error) console.warn('Supabase Mentorships notice:', error.message);
    else console.log('✅ Mentorships seeded to Supabase.');
  } catch (e) {
    console.warn('Mentorships fallback:', e.message);
  }
  mentorshipsList.forEach(m => dbStore.upsertMentorship(m));

  // 9. Seed Hackathons, Participants & Partner Requests
  const rawHackathons = getSheetData('Hackathons');
  const rawParticipants = getSheetData('Hackathon_Participants');
  const rawPartnerReqs = getSheetData('Hackathon_Partner_Requests');
  console.log(`\n🏆 Seeding ${rawHackathons.length} Hackathons, ${rawParticipants.length} Participants, ${rawPartnerReqs.length} Partner Requests...`);

  const hackathonsList = rawHackathons.map(h => ({
    hackathon_id: Number(h.hackathon_id),
    name: h.name,
    short_code: h.short_code || '',
    description: 'Premier national university hackathon event for building impactful tech solutions.',
    date: '2026-10-15',
    status: 'Upcoming'
  }));

  try {
    await supabase.from('hackathons').upsert(hackathonsList, { onConflict: 'hackathon_id' });
  } catch (e) {}
  hackathonsList.forEach(h => dbStore.upsertHackathon(h));

  dbStore.hackathonParticipants = rawParticipants.map(p => ({
    participant_record_id: Number(p.participant_record_id),
    hackathon_id: Number(p.hackathon_id),
    person_type: p.person_type || 'STUDENT',
    person_id: Number(p.person_id),
    hackathon_name: p.hackathon_name,
    result: p.result || 'Winner',
    primary_skill: p.primary_skill || 'Full Stack'
  }));

  dbStore.hackathonPartnerRequests = rawPartnerReqs.map(pr => ({
    request_id: Number(pr.request_id),
    student_id: Number(pr.student_id),
    hackathon_id: Number(pr.hackathon_id),
    required_skill_1: pr.required_skill_1,
    required_skill_2: pr.required_skill_2,
    preferred_location: pr.preferred_location || 'All India',
    status: pr.status || 'Open'
  }));

  // 10. Seed Referrals
  const rawReferrals = getSheetData('Referrals');
  console.log(`\n🎯 Seeding ${rawReferrals.length} Referrals...`);
  const referralsList = rawReferrals.map(r => ({
    referral_id: Number(r.referral_id),
    alumni_id: Number(r.alumni_id),
    student_id: Number(r.student_id),
    job_id: Number(r.job_id),
    status: r.status || 'SUBMITTED',
    recommendation_reason: r.recommendation_reason || 'Strong academic and technical track record'
  }));

  try {
    await supabase.from('referrals').upsert(referralsList, { onConflict: 'referral_id' });
  } catch (e) {}
  referralsList.forEach(r => dbStore.upsertReferral(r));

  // 11. Seed Events
  const rawEvents = getSheetData('Events');
  console.log(`\n📅 Seeding ${rawEvents.length} Events & Workshops...`);
  const eventsList = rawEvents.map(e => ({
    event_id: Number(e.event_id),
    college_id: Number(e.college_id),
    title: e.title,
    event_date: e.event_date || '2026-09-30',
    start_time: e.start_time || '18:00',
    location: e.location || 'Online Webinar',
    capacity: Number(e.capacity) || 100,
    registered_count: Math.floor(Math.random() * 20) + 15,
    status: e.status || 'Published',
    organizer: 'BridgeUp Alumni Network',
    description: 'Interactive career masterclass with industry leaders and alumni mentors.'
  }));

  try {
    await supabase.from('events').upsert(eventsList, { onConflict: 'event_id' });
  } catch (e) {}
  eventsList.forEach(ev => dbStore.upsertEvent(ev));

  console.log('\n====================================================');
  console.log('✨ BRIDGEUP Dataset Ingestion & Seeding Complete!');
  console.log('====================================================\n');
}

// Run directly if executed as script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeder().then(() => process.exit(0));
}
