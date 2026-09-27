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

  // 1. Seed Canonical Kolkata Colleges
  const CANONICAL_COLLEGES = [
    {
      college_id: 1,
      college_name: 'Institute of Engineering and Management',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      short_code: 'IEM',
      website_domain: 'iem.edu.in',
      admin_demo_email: 'admin@iem.edu.in',
      status: 'Verified'
    },
    {
      college_id: 2,
      college_name: 'Jadavpur University',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      short_code: 'JU',
      website_domain: 'jadavpuruniversity.in',
      admin_demo_email: 'admin@jadavpuruniversity.in',
      status: 'Verified'
    },
    {
      college_id: 3,
      college_name: 'University of Calcutta',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      short_code: 'CU',
      website_domain: 'caluniv.ac.in',
      admin_demo_email: 'admin@caluniv.ac.in',
      status: 'Verified'
    },
    {
      college_id: 4,
      college_name: 'IIT Kharagpur',
      city: 'Kharagpur',
      state: 'West Bengal',
      country: 'India',
      short_code: 'IIT KGP',
      website_domain: 'iitkgp.ac.in',
      admin_demo_email: 'admin@iitkgp.ac.in',
      status: 'Verified'
    },
    {
      college_id: 5,
      college_name: 'NIT Durgapur',
      city: 'Durgapur',
      state: 'West Bengal',
      country: 'India',
      short_code: 'NIT DGP',
      website_domain: 'nitdgp.ac.in',
      admin_demo_email: 'admin@nitdgp.ac.in',
      status: 'Verified'
    }
  ];

  console.log(`\n🏫 Seeding ${CANONICAL_COLLEGES.length} Canonical Colleges...`);
  try {
    const { error } = await supabase.from('colleges').upsert(CANONICAL_COLLEGES, { onConflict: 'college_id' });
    if (error) console.warn('Supabase Colleges notice:', error.message);
    else console.log('✅ Canonical Colleges seeded to Supabase.');
  } catch (e) {
    console.warn('Colleges fallback:', e.message);
  }
  CANONICAL_COLLEGES.forEach(c => dbStore.upsertCollege(c));

  // 2. Seed Demo Users & Passwords (bcrypt hashed)
  const rawUsers = getSheetData('Users_Auth_Demo');
  console.log(`\n👥 Seeding ${rawUsers.length} Demo & Core Users...`);

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
  const collegeNamesMap = {
    1: 'Institute of Engineering and Management',
    2: 'Jadavpur University',
    3: 'University of Calcutta',
    4: 'IIT Kharagpur',
    5: 'NIT Durgapur'
  };

  const studentsList = rawStudents.map(s => {
    const cid = (Number(s.college_id) >= 1 && Number(s.college_id) <= 5) ? Number(s.college_id) : 1;
    return {
      student_id: Number(s.student_id),
      user_id: `STUDENT-${s.student_id}`,
      full_name: s.full_name,
      email: String(s.email).toLowerCase().trim(),
      role: 'STUDENT',
      college_id: cid,
      college_name: collegeNamesMap[cid] || 'Institute of Engineering and Management',
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
    };
  });

  try {
    const { error } = await supabase.from('students').upsert(studentsList, { onConflict: 'student_id' });
    if (error) console.warn('Supabase Students notice:', error.message);
    else console.log('✅ Students seeded to Supabase.');
  } catch (e) {
    console.warn('Students fallback:', e.message);
  }
  studentsList.forEach(s => dbStore.upsertStudent(s));

  // 4. Seed Alumni Mentors (from NEW MASTER CSV: bridgeup_kolkata_alumni_dataset.csv)
  const CSV_ALUMNI_PATH = path.resolve(__dirname, 'bridgeup_kolkata_alumni_dataset.csv');
  let alumniList = [];
  let parsedAlumniSkills = [];

  if (fs.existsSync(CSV_ALUMNI_PATH)) {
    console.log(`\n💼 Ingesting 300 Alumni from Master CSV: ${path.basename(CSV_ALUMNI_PATH)}...`);
    const csvContent = fs.readFileSync(CSV_ALUMNI_PATH, 'utf8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // Custom CSV parser handling quoted bio and career path
    function parseCSVLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 8) continue;

      // alumni_id,name,college_id,college_name,current_role,company,career_domain,skills,experience_years,graduation_year,availability,verified,mentor_rating,bio,career_path
      const alumni_id = Number(cols[0]);
      const name = cols[1];
      const college_id = Number(cols[2]) || 1;
      const college_name = cols[3] || collegeNamesMap[college_id] || 'Institute of Engineering and Management';
      const current_role = cols[4] || 'Software Engineer';
      const company = cols[5] || 'Tech Organization';
      const career_domain = cols[6] || 'Software Engineering';
      const rawSkills = cols[7] || '';
      const experience_years = Number(cols[8]) || 0;
      const graduation_year = Number(cols[9]) || 2020;
      const availability = cols[10] || 'Available';
      const verified = (cols[11] || '').toLowerCase() === 'yes' ? 'Verified' : 'Verified';
      const mentor_rating = Number(cols[12]) || 4.8;
      const bio = cols[13] ? cols[13].replace(/^"|"$/g, '').trim() : '';
      const career_path = cols[14] ? cols[14].replace(/^"|"$/g, '').trim() : `${college_name} → ${current_role} @ ${company}`;

      const skillsArray = rawSkills.split(';').map(s => s.trim()).filter(Boolean);

      skillsArray.forEach(sk => {
        parsedAlumniSkills.push({
          alumni_id,
          skill: sk.toLowerCase(),
          proficiency: 'Advanced'
        });
      });

      const cleanComp = company.toLowerCase().replace(/[^a-z0-9]/g, '') || 'alumni';
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const email = `${cleanName}.${alumni_id}@${cleanComp}.com`;

      alumniList.push({
        id: `alm-${alumni_id}`,
        alumni_id,
        user_id: `ALUMNI-${alumni_id}`,
        full_name: name,
        name,
        email,
        role: 'ALUMNI',
        college_id,
        college_name,
        graduation_year,
        current_role,
        role_title: current_role,
        company,
        experience_years,
        career_domain,
        availability,
        verification_status: verified,
        mentor_status: 'Mentor',
        referral_status: 'Open for Referrals',
        mentor_rating,
        bio,
        career_path,
        skills: skillsArray,
        topics: ['Career Guidance', 'Technical Mentorship', 'Interview Preparation'],
        sessions_count: Math.floor(Math.random() * 25) + 5,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${alumni_id}&mouth=smile&eyes=default&clothing=blazerAndShirt&backgroundColor=c0aede`
      });
    }
  } else {
    console.warn('⚠️ Master alumni CSV not found, fallback to default.');
  }

  console.log(`✅ Loaded ${alumniList.length} Alumni from Master Kolkata CSV dataset.`);

  // Clean old alumni (e.g. old demo IDs outside 1001-1300)
  try {
    await supabase.from('alumni').delete().lt('alumni_id', 1001);
    await supabase.from('alumni').delete().gt('alumni_id', 1300);
    await supabase.from('alumni_skills').delete().lt('alumni_id', 1001);
    await supabase.from('alumni_skills').delete().gt('alumni_id', 1300);
  } catch (delErr) {}

  try {
    // Sanitize columns for base Supabase schema table and insert in batches
    const supaAlumniPayload = alumniList.map(a => {
      const copy = { ...a };
      delete copy.career_path; // in case column has not been added via SQL editor yet
      return copy;
    });

    for (let i = 0; i < supaAlumniPayload.length; i += 50) {
      const batch = supaAlumniPayload.slice(i, i + 50);
      const { error } = await supabase.from('alumni').upsert(batch, { onConflict: 'alumni_id' });
      if (error) console.warn(`Supabase Alumni batch ${i} notice:`, error.message);
    }
    console.log(`✅ Successfully seeded ${alumniList.length} Alumni to Supabase.`);
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
  console.log(`\n⚡ Seeding ${rawStudentSkills.length} Student Skills & ${parsedAlumniSkills.length} Alumni Skills...`);
  
  dbStore.studentSkills = rawStudentSkills.map(sk => ({
    student_id: Number(sk.student_id),
    skill: sk.skill,
    proficiency: sk.proficiency || 'Intermediate'
  }));

  dbStore.alumniSkills = parsedAlumniSkills;

  try {
    // Upsert parsed alumni skills to Supabase
    if (parsedAlumniSkills.length > 0) {
      await supabase.from('alumni_skills').upsert(parsedAlumniSkills.slice(0, 1000));
    }
  } catch (e) {}

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
  const mentorshipsList = rawMentorships.map(m => {
    const rawAlmId = Number(m.alumni_id) || 1;
    const mappedAlmId = rawAlmId >= 1001 && rawAlmId <= 1300 ? rawAlmId : ((rawAlmId % 300) + 1001);
    return {
      mentorship_id: Number(m.mentorship_id),
      student_id: Number(m.student_id),
      alumni_id: mappedAlmId,
      goal: m.goal || 'Career Guidance & Skill Building',
      status: String(m.status || 'REQUESTED').toUpperCase(),
      start_date: m.start_date || '2026-08-01',
      end_date: m.end_date || '2026-10-31',
      source: m.source || 'AI match',
      ai_match_score: Number(m.ai_match_score) ? (Number(m.ai_match_score) <= 1 ? Math.round(Number(m.ai_match_score) * 100) : Number(m.ai_match_score)) : 88.0
    };
  });

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
  try {
    await supabase.from('hackathon_participants').upsert(dbStore.hackathonParticipants, { onConflict: 'participant_record_id' });
  } catch (e) {}

  dbStore.hackathonPartnerRequests = rawPartnerReqs.map(pr => ({
    request_id: Number(pr.request_id),
    student_id: Number(pr.student_id),
    hackathon_id: Number(pr.hackathon_id),
    required_skill_1: pr.required_skill_1,
    required_skill_2: pr.required_skill_2,
    preferred_location: pr.preferred_location || 'All India',
    status: pr.status || 'Open'
  }));
  try {
    await supabase.from('hackathon_partner_requests').upsert(dbStore.hackathonPartnerRequests, { onConflict: 'request_id' });
  } catch (e) {}

  // 10. Seed Referrals
  const rawReferrals = getSheetData('Referrals');
  console.log(`\n🎯 Seeding ${rawReferrals.length} Referrals...`);
  const referralsList = rawReferrals.map(r => {
    const rawAlmId = Number(r.alumni_id) || 1;
    const mappedAlmId = rawAlmId >= 1001 && rawAlmId <= 1300 ? rawAlmId : ((rawAlmId % 300) + 1001);
    return {
      referral_id: Number(r.referral_id),
      alumni_id: mappedAlmId,
      student_id: Number(r.student_id),
      job_id: Number(r.job_id),
      status: r.status || 'SUBMITTED',
      recommendation_reason: r.recommendation_reason || 'Strong academic and technical track record'
    };
  });

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
