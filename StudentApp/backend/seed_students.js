import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qcgekkenmgycmnhraxia.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Canonical college mapping
export const COLLEGE_MAP = {
  'iem': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  'institute of engineering and management': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  'institute of engineering & management': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  'iem kolkata': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  'institute of engineering and management (iem)': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },
  '1': { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' },

  'ju': { id: 2, name: 'Jadavpur University', code: 'JU' },
  'jadavpur university': { id: 2, name: 'Jadavpur University', code: 'JU' },
  'jadavpur': { id: 2, name: 'Jadavpur University', code: 'JU' },
  'jadavpur university (ju)': { id: 2, name: 'Jadavpur University', code: 'JU' },
  '2': { id: 2, name: 'Jadavpur University', code: 'JU' },

  'cu': { id: 3, name: 'University of Calcutta', code: 'CU' },
  'calcutta university': { id: 3, name: 'University of Calcutta', code: 'CU' },
  'university of calcutta': { id: 3, name: 'University of Calcutta', code: 'CU' },
  'university of calcutta (cu)': { id: 3, name: 'University of Calcutta', code: 'CU' },
  '3': { id: 3, name: 'University of Calcutta', code: 'CU' },

  'iitkgp': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  'iit kgp': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  'iit kharagpur': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  'indian institute of technology kharagpur': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  'iit kharagpur (iitkgp)': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },
  '4': { id: 4, name: 'IIT Kharagpur', code: 'IITKGP' },

  'nitdgp': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
  'nit dgp': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
  'nit durgapur': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
  'national institute of technology durgapur': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
  'nit durgapur (nitdgp)': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
  '5': { id: 5, name: 'NIT Durgapur', code: 'NITDGP' },
};

export function resolveCanonicalCollege(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const key = String(raw).trim().toLowerCase();
  if (!key) return null;
  if (COLLEGE_MAP[key]) return COLLEGE_MAP[key];
  const match = Object.values(COLLEGE_MAP).find(c => 
    String(c.id) === key ||
    c.code.toLowerCase() === key ||
    c.name.toLowerCase() === key ||
    key.includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(key)
  );
  return match || null;
}

export function normalizeCollege(raw) {
  return resolveCanonicalCollege(raw) || { id: 1, name: 'Institute of Engineering and Management', code: 'IEM' };
}

export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export async function seedStudents(filePath) {
  const resolvedPath = filePath 
    ? path.resolve(process.cwd(), filePath)
    : path.resolve(__dirname, '../data/bridgeup_student_dataset.csv');

  console.log(`=============================================================`);
  console.log(`🚀 BridgeUp Master Student Seeder`);
  console.log(`📁 Target CSV: ${resolvedPath}`);
  console.log(`🗄️  Supabase URL: ${SUPABASE_URL}`);
  console.log(`=============================================================`);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Student CSV file not found at: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error(`CSV file is empty or has no data rows.`);
  }

  const stats = {
    totalRows: lines.length - 1,
    inserted: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    perCollege: {
      'Institute of Engineering and Management': 0,
      'Jadavpur University': 0,
      'University of Calcutta': 0,
      'IIT Kharagpur': 0,
      'NIT Durgapur': 0
    },
    totalSkillsCount: 0
  };

  const seenEmails = new Set();
  const validStudents = [];
  const validStudentSkills = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 38) {
      stats.invalid++;
      continue;
    }

    // Direct positional unpacking matching the 39-field synthetic dataset
    let student_id, user_id, full_name, email, gender, college_id_raw, college_name_raw, college_short_code;
    let year_of_study, graduation_year, degree, department, cgpa, career_domain, career_goal, primary_skill;
    let skills_raw, preferred_team_roles_raw, hackathons_participated, hackathons_finalist, hackathons_won;
    let total_projects, successful_projects, project_domains_raw, team_leadership_experience;
    let availability, availability_schedule, collaboration_mode, city, languages_raw, github_url, linkedin_url, bio;
    let verification_status, profile_visibility, open_to_team_requests_raw, teammate_rating_raw, response_rate_percent_raw, created_at;

    if (row.length >= 39) {
      student_id = parseInt(row[0], 10);
      user_id = row[1] || `usr-stu-${student_id}`;
      full_name = row[2];
      email = (row[3] || '').toLowerCase().trim();
      gender = row[4] || 'Prefer not to say';
      college_id_raw = row[5];
      college_name_raw = row[6];
      college_short_code = row[7];
      year_of_study = parseInt(row[8], 10) || 1;
      graduation_year = parseInt(row[9], 10) || 2028;
      degree = row[10] || 'B.Tech';
      department = row[11] || 'Computer Science and Engineering';
      cgpa = parseFloat(row[12]) || 8.0;
      career_domain = row[13] || 'Software Engineering';
      career_goal = row[14] || `Build expertise in ${career_domain}`;
      primary_skill = row[15] || 'Python';
      skills_raw = row[16];
      preferred_team_roles_raw = row[17];
      hackathons_participated = Math.max(0, parseInt(row[18], 10) || 0);
      hackathons_finalist = Math.max(0, parseInt(row[19], 10) || 0);
      hackathons_won = Math.max(0, parseInt(row[20], 10) || 0);
      total_projects = Math.max(0, parseInt(row[21], 10) || 0);
      successful_projects = Math.max(0, parseInt(row[22], 10) || 0);
      project_domains_raw = row[23];
      team_leadership_experience = row[24] === 'true' || row[24] === true;
      availability = row[25] || 'Available';
      availability_schedule = row[26] || 'Flexible';
      collaboration_mode = row[27] || 'Any';
      city = row[28] || 'Kolkata';
      languages_raw = row[29];
      github_url = row[30] || '';
      linkedin_url = row[31] || '';
      bio = row[32] || '';
      verification_status = row[33] || 'Verified';
      profile_visibility = row[34] || 'Platform members';
      open_to_team_requests_raw = row[35];
      teammate_rating_raw = row[36];
      response_rate_percent_raw = row[37];
      created_at = row[38] || new Date().toISOString();
    } else {
      // 38 fields fallback
      student_id = parseInt(row[0], 10);
      user_id = row[1] || `usr-stu-${student_id}`;
      full_name = row[2];
      email = (row[3] || '').toLowerCase().trim();
      gender = row[4] || 'Prefer not to say';
      college_id_raw = row[5];
      college_name_raw = row[6];
      college_short_code = row[7];
      year_of_study = parseInt(row[8], 10) || 1;
      graduation_year = parseInt(row[9], 10) || 2028;
      degree = row[10] || 'B.Tech';
      department = row[11] || 'Computer Science and Engineering';
      cgpa = parseFloat(row[12]) || 8.0;
      career_domain = row[13] || 'Software Engineering';
      career_goal = row[14] || `Build expertise in ${career_domain}`;
      primary_skill = row[15] || 'Python';
      skills_raw = row[16];
      preferred_team_roles_raw = row[17];
      hackathons_participated = Math.max(0, parseInt(row[18], 10) || 0);
      hackathons_finalist = Math.max(0, parseInt(row[19], 10) || 0);
      hackathons_won = Math.max(0, parseInt(row[20], 10) || 0);
      total_projects = Math.max(0, parseInt(row[21], 10) || 0);
      successful_projects = Math.max(0, parseInt(row[22], 10) || 0);
      project_domains_raw = row[23];
      team_leadership_experience = row[24] === 'true' || row[24] === true;
      availability = row[25] || 'Available';
      availability_schedule = 'Flexible';
      collaboration_mode = row[26] || 'Any';
      city = row[27] || 'Kolkata';
      languages_raw = row[28];
      github_url = row[29] || '';
      linkedin_url = row[30] || '';
      bio = row[31] || '';
      verification_status = row[32] || 'Verified';
      profile_visibility = row[33] || 'Platform members';
      open_to_team_requests_raw = row[34];
      teammate_rating_raw = row[35];
      response_rate_percent_raw = row[36];
      created_at = row[37] || new Date().toISOString();
    }

    const college = normalizeCollege(college_name_raw || college_short_code || college_id_raw);

    // Validation rules
    if (!student_id || !email || !full_name) {
      stats.invalid++;
      continue;
    }
    if (seenEmails.has(email)) {
      stats.skipped++;
      continue;
    }
    seenEmails.add(email);

    if (cgpa < 0 || cgpa > 10.0) {
      stats.invalid++;
      continue;
    }
    if (successful_projects > total_projects) {
      stats.invalid++;
      continue;
    }
    if (hackathons_won > hackathons_finalist || hackathons_finalist > hackathons_participated) {
      stats.invalid++;
      continue;
    }

    const skills = skills_raw ? skills_raw.split(';').map(s => s.trim()).filter(Boolean) : [primary_skill];
    const preferred_team_roles = preferred_team_roles_raw ? preferred_team_roles_raw.split(';').map(r => r.trim()).filter(Boolean) : ['Full Stack Developer'];
    const project_domains = project_domains_raw ? project_domains_raw.split(';').map(d => d.trim()).filter(Boolean) : [];
    const languages = languages_raw ? languages_raw.split(';').map(l => l.trim()).filter(Boolean) : ['English', 'Hindi', 'Bengali'];
    const open_to_team_requests = open_to_team_requests_raw === 'Yes' || open_to_team_requests_raw === 'true' || open_to_team_requests_raw === true;
    const teammate_rating = teammate_rating_raw ? parseFloat(teammate_rating_raw) : null;
    const response_rate_percent = response_rate_percent_raw ? parseInt(response_rate_percent_raw, 10) : 85;

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}&mouth=smile&eyes=default&clothing=collarAndSweater&backgroundColor=b6e3f4`;

    // Metadata payload stored in projects JSONB
    const metaPayload = {
      gender,
      college_short_code: college.code,
      preferred_team_roles,
      hackathons_participated,
      hackathons_finalist,
      hackathons_won,
      total_projects,
      successful_projects,
      project_domains,
      team_leadership_experience,
      availability,
      availability_schedule,
      collaboration_mode,
      city,
      languages,
      github_url,
      linkedin_url,
      profile_visibility,
      open_to_team_requests,
      teammate_rating,
      response_rate_percent,
      source: 'synthetic_csv_v1'
    };

    const studentRecord = {
      id: `std-${student_id}`,
      student_id,
      user_id,
      full_name,
      name: full_name,
      email,
      role: 'STUDENT',
      college_id: college.id,
      college_name: college.name,
      year_of_study,
      year: `Year ${year_of_study}`,
      degree,
      department,
      major: department,
      graduation_year,
      cgpa,
      career_domain,
      career_goal,
      primary_skill,
      skills,
      engagement_status: 'Active',
      verification_status,
      bio,
      github: github_url,
      linkedin: linkedin_url,
      avatar,
      projects: metaPayload,
      achievements: [],
      created_at,
      updated_at: new Date().toISOString()
    };

    validStudents.push(studentRecord);

    // Skills child rows
    skills.forEach((sk, idx) => {
      validStudentSkills.push({
        id: `ssk-${student_id}-${idx + 1}`,
        student_id,
        skill: sk,
        proficiency: sk.toLowerCase() === primary_skill.toLowerCase() ? 'Primary' : 'Intermediate',
        created_at
      });
    });

    if (stats.perCollege[college.name] !== undefined) {
      stats.perCollege[college.name]++;
    }
  }

  console.log(`Validated ${validStudents.length} student profiles for upsert.`);

  // Batch upsert students into Supabase (in batches of 100)
  const batchSize = 100;
  for (let i = 0; i < validStudents.length; i += batchSize) {
    const batch = validStudents.slice(i, i + batchSize);
    const { error } = await supabase.from('students').upsert(batch, { onConflict: 'student_id' });
    if (error) {
      console.error(`Error inserting student batch ${i / batchSize + 1}:`, error.message);
      throw error;
    }
    stats.inserted += batch.length;
    process.stdout.write(`  Upserted students ${Math.min(i + batchSize, validStudents.length)} / ${validStudents.length}...\r`);
  }
  console.log(`\n✅ All ${validStudents.length} student records successfully synced to Supabase!`);

  // Batch upsert student_skills
  for (let i = 0; i < validStudentSkills.length; i += 200) {
    const batch = validStudentSkills.slice(i, i + 200);
    const { error } = await supabase.from('student_skills').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.warn(`Notice on student_skills batch:`, error.message);
    }
    stats.totalSkillsCount += batch.length;
  }
  console.log(`✅ Synced ${stats.totalSkillsCount} normalized skills to student_skills.`);

  console.log(`\n=============================================================`);
  console.log(`📊 SEED SUMMARY REPORT:`);
  console.log(`   Total CSV Rows:    ${stats.totalRows}`);
  console.log(`   Inserted/Upserted: ${stats.inserted}`);
  console.log(`   Skipped/Duplicate: ${stats.skipped}`);
  console.log(`   Invalid/Rejected:  ${stats.invalid}`);
  console.log(`   Skills Rows:       ${stats.totalSkillsCount}`);
  console.log(`\n🏫 PER-COLLEGE COUNTS:`);
  Object.entries(stats.perCollege).forEach(([cname, cnt]) => {
    console.log(`   - ${cname.padEnd(45)}: ${cnt}`);
  });
  console.log(`=============================================================\n`);

  return stats;
}

// Allow CLI execution: node backend/seed_students.js --file <path>
if (process.argv[1] && process.argv[1].endsWith('seed_students.js')) {
  let customFile = null;
  const fileArgIdx = process.argv.indexOf('--file');
  if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
    customFile = process.argv[fileArgIdx + 1];
  }
  seedStudents(customFile)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}
