import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uknypaqumcsseydiyncz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbnlwYXF1bWNzc2V5ZGl5bmN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ3NzI2MSwiZXhwIjoyMTA1MDUzMjYxfQ.j__nXutWxIZ9k3U3kjhEIGU1xEdj0QBAbyrS8pym40k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Initial Seed Data for Mentors
export const SEED_ALUMNI_MENTORS = [
  {
    id: 'alm-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@alumni.university.edu',
    role: 'alumni',
    company: 'Google',
    job_title: 'Senior Software Engineer',
    grad_year: 2021,
    major: 'Computer Science',
    location: 'Mountain View, CA',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    bio: 'Ex-Google intern turned Senior SWE on Cloud Infrastructure. Love helping juniors with system design, code reviews, and tech interview prep.',
    skills: ['System Design', 'Distributed Systems', 'Go', 'Python', 'Interview Prep'],
    courses: ['CS301 Data Structures', 'CS450 Distributed Systems'],
    rating: 4.95,
    sessions_count: 38,
    is_verified: true,
    status: 'online'
  },
  {
    id: 'alm-2',
    name: 'David Chen',
    email: 'david.c@alumni.university.edu',
    role: 'alumni',
    company: 'Meta',
    job_title: 'Lead Data Scientist',
    grad_year: 2020,
    major: 'Data Science & Analytics',
    location: 'Menlo Park, CA',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Leading AI recommendation algorithms at Meta. Excited to guide students in Machine Learning pipelines and data analytics careers.',
    skills: ['PyTorch', 'SQL', 'Data Pipelines', 'A/B Testing', 'Machine Learning'],
    courses: ['DS310 Machine Learning', 'STAT401 Probability Theory'],
    rating: 4.88,
    sessions_count: 27,
    is_verified: true,
    status: 'online'
  },
  {
    id: 'alm-3',
    name: 'Priya Sharma',
    email: 'priya.s@alumni.university.edu',
    role: 'alumni',
    company: 'Microsoft',
    job_title: 'Product Manager II',
    grad_year: 2022,
    major: 'Information Systems',
    location: 'Redmond, WA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'Product manager across Azure AI ecosystem. Specializing in tech product lifecycle, student resume tailoring, and interview frameworks.',
    skills: ['Product Strategy', 'Roadmapping', 'Agile / Scrum', 'User Research', 'Resume Reviews'],
    courses: ['INFO401 Product Management', 'CS201 Object Oriented Design'],
    rating: 4.98,
    sessions_count: 45,
    is_verified: true,
    status: 'online'
  },
  {
    id: 'alm-4',
    name: 'Marcus Brody',
    email: 'marcus.b@alumni.university.edu',
    role: 'alumni',
    company: 'Apple',
    job_title: 'Senior iOS & Systems Engineer',
    grad_year: 2019,
    major: 'Computer Engineering',
    location: 'Cupertino, CA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Core OS engineer at Apple. Mentoring students passionate about low-level performance, Swift, and building scalable mobile apps.',
    skills: ['Swift', 'C++', 'Memory Management', 'iOS Architecture', 'Concurrency'],
    courses: ['CS450 Distributed Systems', 'EE201 Circuits'],
    rating: 4.92,
    sessions_count: 31,
    is_verified: true,
    status: 'online'
  }
];

// Initial Seed Data for Demo Students & Peers
export const SEED_STUDENT_USERS = [
  {
    id: 'demo-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@edu.university.edu',
    role: 'student',
    major: 'Computer Science',
    year: 'Senior (Year 4)',
    gpa: '3.92',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'Passionate about AI, full-stack engineering, and distributed systems. Always looking for coding study partners!',
    skills: ['React', 'Python', 'Machine Learning', 'Algorithms', 'Tailwind'],
    courses: ['CS301 Data Structures', 'CS420 Artificial Intelligence', 'MATH302 Linear Algebra', 'CS450 Distributed Systems'],
    credits: 112,
    streak_days: 14,
    study_hours_week: 28.5,
    status: 'online'
  },
  {
    id: 'demo-2',
    name: 'Sophia Chen',
    email: 'sophia.chen@edu.university.edu',
    role: 'student',
    major: 'Data Science & Analytics',
    year: 'Junior (Year 3)',
    gpa: '3.88',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    bio: 'Data enthusiast exploring deep learning and statistical modeling. Coffee lover & night owl studier ☕ Data viz freak!',
    skills: ['Python', 'SQL', 'PyTorch', 'R', 'Tableau', 'Statistics'],
    courses: ['DS310 Machine Learning', 'STAT401 Probability Theory', 'DS202 Data Visualization', 'CS201 Object Oriented Design'],
    credits: 88,
    streak_days: 9,
    study_hours_week: 24.0,
    status: 'online'
  },
  {
    id: 'demo-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@edu.university.edu',
    role: 'student',
    major: 'Mechanical Engineering',
    year: 'Senior (Year 4)',
    gpa: '3.75',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Building robotics and autonomous vehicles. High energy project builder looking for collaborators for senior capstone.',
    skills: ['CAD / SolidWorks', 'MATLAB', 'Robotics', 'Thermodynamics', 'C++'],
    courses: ['ME401 Mechanical Design', 'ME415 Robotics Engineering', 'ME350 Fluid Dynamics', 'EE201 Circuits'],
    credits: 108,
    streak_days: 21,
    study_hours_week: 31.0,
    status: 'online'
  },
  {
    id: 'demo-4',
    name: 'Emma Watson',
    email: 'emma.watson@edu.university.edu',
    role: 'student',
    major: 'Biomedical Engineering',
    year: 'Sophomore (Year 2)',
    gpa: '3.95',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    bio: 'Pre-med student studying tissue engineering and genomic sequence algorithms. Active in campus STEM tutoring.',
    skills: ['Bioinformatics', 'Organic Chemistry', 'Python', 'Lab Analysis', 'Genetics'],
    courses: ['BME201 Bio-Materials', 'CHEM301 Organic Chemistry II', 'BIOL250 Genetics', 'MATH220 Calculus III'],
    credits: 64,
    streak_days: 7,
    study_hours_week: 22.5,
    status: 'online'
  },
  {
    id: 'peer-1',
    name: 'David Kim',
    email: 'david.kim@university.edu',
    role: 'student',
    major: 'Computer Science',
    year: 'Senior',
    gpa: '3.95',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Competitive programmer & algorithm enthusiast. TA for CS301. Hit me up for LeetCode practice or system design!',
    skills: ['C++', 'Python', 'Algorithms', 'System Design', 'React'],
    courses: ['CS301 Data Structures', 'CS420 Artificial Intelligence'],
    status: 'online'
  },
  {
    id: 'peer-2',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    role: 'student',
    major: 'Data Science',
    year: 'Junior',
    gpa: '3.91',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'NLP research assistant. Passionate about LLMs and Data Mining. Looking for a study buddy for Machine Learning.',
    skills: ['PyTorch', 'Python', 'NLP', 'SQL', 'Data Pipelines'],
    courses: ['DS310 Machine Learning', 'CS420 Artificial Intelligence'],
    status: 'studying'
  }
];

// Initial Study Groups
export const SEED_STUDY_GROUPS = [
  {
    id: 'sg-1',
    name: 'CS301 Algorithm Knights 🛡️',
    course: 'CS301 Data Structures',
    description: 'Weekly problem solving, graph algorithms, dynamic programming & midterm review squad.',
    members_count: 14,
    max_members: 20,
    leader: 'David Kim',
    leader_id: 'peer-1',
    meeting_time: 'Tuesdays & Thursdays @ 6:00 PM',
    location: 'Science Library Room 402 / Discord',
    tags: ['LeetCode', 'Trees & Graphs', 'Midterm Prep']
  },
  {
    id: 'sg-2',
    name: 'AI & Machine Learning Lab 🤖',
    course: 'CS420 Artificial Intelligence',
    description: 'Neural networks paper reading, PyTorch projects, and project collaboration.',
    members_count: 9,
    max_members: 15,
    leader: 'Elena Rostova',
    leader_id: 'peer-2',
    meeting_time: 'Wednesdays @ 5:30 PM',
    location: 'Engineering Hall 204',
    tags: ['PyTorch', 'Deep Learning', 'Paper Discussion']
  },
  {
    id: 'sg-3',
    name: 'Organic Chem Survivors 🧪',
    course: 'CHEM301 Organic Chemistry II',
    description: 'Reaction mechanisms breakdown, flashcard drills, and quiz prep.',
    members_count: 18,
    max_members: 25,
    leader: 'Maya Patel',
    leader_id: 'peer-4',
    meeting_time: 'Mondays @ 7:00 PM',
    location: 'Chemistry Lab B',
    tags: ['Reactions', 'Flashcards', 'Exam Practice']
  }
];

// Automatic Seeding Function
export async function seedSupabaseDatabase() {
  try {
    console.log('🔄 Checking Supabase connection and tables...');
    
    // Check users table
    const { data: existingUsers, error: userCheckErr } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userCheckErr) {
      console.warn('⚠️ Note: Supabase tables might need SQL initialization:', userCheckErr.message);
      return false;
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log('🌱 Seeding initial users and mentors to Supabase...');
      const allUsers = [...SEED_STUDENT_USERS, ...SEED_ALUMNI_MENTORS];
      const { error: seedErr } = await supabase.from('users').upsert(allUsers, { onConflict: 'id' });
      if (seedErr) console.warn('User seed error:', seedErr.message);
      else console.log(`✅ Seeded ${allUsers.length} users/mentors to Supabase.`);

      // Seed study groups
      const { error: groupErr } = await supabase.from('study_groups').upsert(SEED_STUDY_GROUPS, { onConflict: 'id' });
      if (groupErr) console.warn('Group seed error:', groupErr.message);
      else console.log(`✅ Seeded ${SEED_STUDY_GROUPS.length} study groups to Supabase.`);

      // Seed initial connections
      const initialConns = [
        { user_id: 'demo-1', peer_id: 'peer-1', status: 'connected' },
        { user_id: 'demo-1', peer_id: 'peer-2', status: 'connected' }
      ];
      await supabase.from('connections').upsert(initialConns, { onConflict: 'user_id,peer_id' });

      // Seed initial conversation
      await supabase.from('conversations').upsert([
        {
          id: 'conv-1',
          participant_ids: ['demo-1', 'peer-1'],
          peer_id: 'peer-1',
          peer_name: 'David Kim',
          peer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
          last_message: 'Awesome! Are you coming to the CS301 review session tonight?',
          unread_count: 1
        }
      ], { onConflict: 'id' });

      await supabase.from('messages').upsert([
        { id: 'm1', conversation_id: 'conv-1', sender_id: 'peer-1', sender_type: 'peer', text: 'Hey Alex! Did you finish the graph traversal problem for CS301?' },
        { id: 'm2', conversation_id: 'conv-1', sender_id: 'demo-1', sender_type: 'user', text: 'Working on Dijkstra right now! Almost done with the priority queue implementation.' },
        { id: 'm3', conversation_id: 'conv-1', sender_id: 'peer-1', sender_type: 'peer', text: 'Awesome! Are you coming to the CS301 review session tonight?' }
      ], { onConflict: 'id' });
    } else {
      console.log('✅ Supabase database is online with existing data.');
    }

    return true;
  } catch (err) {
    console.warn('⚠️ Supabase seeding notice:', err.message);
    return false;
  }
}
