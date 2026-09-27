-- ==========================================================================
-- BRIDGEUP / NEXTSTEP: Complete PostgreSQL Relational Schema for Supabase
-- Target URL: https://qcgekkenmgycmnhraxia.supabase.co
-- ==========================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY DEFAULT ('col-' || substr(gen_random_uuid()::text, 1, 12)),
    college_id INT UNIQUE,
    college_name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    short_code TEXT,
    website_domain TEXT,
    admin_demo_email TEXT,
    status TEXT DEFAULT 'Verified',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'ALUMNI', 'RECRUITER', 'COLLEGE_ADMIN', 'SUPER_ADMIN'
    display_name TEXT,
    name TEXT,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    verification_status TEXT DEFAULT 'Verified', -- 'Verified', 'Pending', 'Rejected'
    college_id INT,
    college_name TEXT,
    major TEXT,
    year TEXT,
    gpa TEXT,
    company TEXT,
    role_title TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    avatar_url TEXT,
    bio TEXT,
    status TEXT DEFAULT 'online',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT ('std-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT,
    student_id INT UNIQUE,
    full_name TEXT NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    college_id INT,
    college_name TEXT,
    year_of_study INT DEFAULT 1,
    year TEXT,
    degree TEXT DEFAULT 'B.Tech',
    department TEXT,
    major TEXT,
    graduation_year INT,
    cgpa NUMERIC(4, 2) DEFAULT 8.0,
    gpa TEXT,
    career_domain TEXT,
    career_goal TEXT,
    primary_skill TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    engagement_status TEXT DEFAULT 'Active',
    verification_status TEXT DEFAULT 'Pending',
    bio TEXT,
    projects JSONB DEFAULT '[]'::jsonb,
    achievements JSONB DEFAULT '[]'::jsonb,
    github TEXT,
    linkedin TEXT,
    resume_url TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALUMNI TABLE
CREATE TABLE IF NOT EXISTS alumni (
    id TEXT PRIMARY KEY DEFAULT ('alm-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT,
    alumni_id INT UNIQUE,
    full_name TEXT NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'ALUMNI',
    college_id INT,
    college_name TEXT,
    graduation_year INT,
    "current_role" TEXT,
    role_title TEXT,
    company TEXT,
    experience_years INT DEFAULT 0,
    career_domain TEXT,
    availability TEXT DEFAULT 'Available',
    verification_status TEXT DEFAULT 'Verified',
    mentor_status TEXT DEFAULT 'Mentor',
    referral_status TEXT DEFAULT 'Open for Referrals',
    mentor_rating NUMERIC(3, 2) DEFAULT 4.8,
    bio TEXT,
    avatar TEXT,
    linkedin TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    topics JSONB DEFAULT '["Career Guidance", "System Design", "Mock Interviews"]'::jsonb,
    sessions_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECRUITERS TABLE
CREATE TABLE IF NOT EXISTS recruiters (
    id TEXT PRIMARY KEY DEFAULT ('rec-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT,
    recruiter_id INT UNIQUE,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Recruiter',
    industry TEXT,
    verification_status TEXT DEFAULT 'Verified',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SKILLS & ASSOCIATIONS
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY DEFAULT ('skl-' || substr(gen_random_uuid()::text, 1, 12)),
    name TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_skills (
    id TEXT PRIMARY KEY DEFAULT ('ssk-' || substr(gen_random_uuid()::text, 1, 12)),
    student_id INT,
    skill TEXT NOT NULL,
    proficiency TEXT DEFAULT 'Intermediate',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni_skills (
    id TEXT PRIMARY KEY DEFAULT ('ask-' || substr(gen_random_uuid()::text, 1, 12)),
    alumni_id INT,
    skill TEXT NOT NULL,
    proficiency TEXT DEFAULT 'Advanced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. JOBS & INTERNSHIPS
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY DEFAULT ('job-' || substr(gen_random_uuid()::text, 1, 12)),
    job_id INT UNIQUE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    preferred_college_city TEXT,
    country TEXT DEFAULT 'India',
    employment_type TEXT DEFAULT 'Full-time',
    required_skills TEXT,
    status TEXT DEFAULT 'Active',
    application_deadline TEXT,
    recruiter_id INT,
    description TEXT,
    location TEXT,
    salary_range TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MENTORSHIPS
CREATE TABLE IF NOT EXISTS mentorships (
    id TEXT PRIMARY KEY DEFAULT ('msh-' || substr(gen_random_uuid()::text, 1, 12)),
    mentorship_id INT UNIQUE,
    student_id TEXT,
    alumni_id TEXT,
    goal TEXT,
    note TEXT,
    notes TEXT,
    status TEXT DEFAULT 'REQUESTED',
    start_date TEXT,
    end_date TEXT,
    source TEXT DEFAULT 'AI match',
    ai_match_score NUMERIC(5, 2) DEFAULT 85.0,
    meeting_link TEXT,
    rating NUMERIC(3, 2),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. HACKATHONS & PARTICIPANTS
CREATE TABLE IF NOT EXISTS hackathons (
    id TEXT PRIMARY KEY DEFAULT ('hck-' || substr(gen_random_uuid()::text, 1, 12)),
    hackathon_id INT UNIQUE,
    name TEXT NOT NULL,
    title TEXT,
    short_code TEXT,
    description TEXT,
    "date" TEXT,
    status TEXT DEFAULT 'Upcoming',
    organizer TEXT,
    prize_pool TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_participants (
    id TEXT PRIMARY KEY DEFAULT ('hcp-' || substr(gen_random_uuid()::text, 1, 12)),
    participant_record_id INT UNIQUE,
    hackathon_id INT,
    person_type TEXT DEFAULT 'STUDENT',
    person_id INT,
    team_name TEXT,
    project_title TEXT,
    role TEXT,
    hackathon_name TEXT,
    result TEXT DEFAULT 'Participant',
    primary_skill TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_partner_requests (
    id TEXT PRIMARY KEY DEFAULT ('hpr-' || substr(gen_random_uuid()::text, 1, 12)),
    request_id INT UNIQUE,
    student_id INT,
    hackathon_id INT,
    required_skill_1 TEXT,
    required_skill_2 TEXT,
    desired_role TEXT,
    pitch TEXT,
    preferred_location TEXT,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY DEFAULT ('ref-' || substr(gen_random_uuid()::text, 1, 12)),
    referral_id INT UNIQUE,
    alumni_id TEXT,
    student_id TEXT,
    job_id INT,
    student_name TEXT,
    target_company TEXT,
    role_title TEXT,
    referral_note TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    recommendation_reason TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EVENTS & WORKSHOPS
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT ('evt-' || substr(gen_random_uuid()::text, 1, 12)),
    event_id INT UNIQUE,
    college_id INT,
    title TEXT NOT NULL,
    event_date TEXT,
    start_time TEXT,
    location TEXT DEFAULT 'Online',
    event_type TEXT DEFAULT 'WEBINAR',
    speaker_name TEXT,
    speaker_company TEXT,
    meeting_link TEXT,
    capacity INT DEFAULT 100,
    registered_count INT DEFAULT 0,
    status TEXT DEFAULT 'Published',
    organizer TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY DEFAULT ('erg-' || substr(gen_random_uuid()::text, 1, 12)),
    event_id INT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. STUDY GROUPS
CREATE TABLE IF NOT EXISTS study_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    description TEXT,
    members_count INT DEFAULT 1,
    max_members INT DEFAULT 20,
    leader TEXT,
    leader_id TEXT,
    meeting_time TEXT,
    location TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_group_members (
    id TEXT PRIMARY KEY DEFAULT ('sgm-' || substr(gen_random_uuid()::text, 1, 12)),
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CONNECTIONS
CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY DEFAULT ('conn-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT NOT NULL,
    peer_id TEXT NOT NULL,
    status TEXT DEFAULT 'connected',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participant_ids JSONB DEFAULT '[]'::jsonb,
    peer_id TEXT,
    peer_name TEXT,
    peer_avatar TEXT,
    student_id TEXT,
    alumni_id TEXT,
    last_message TEXT,
    unread_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL DEFAULT 'user',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    due_date TEXT,
    due_time TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    weight TEXT DEFAULT '10%',
    score TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || substr(gen_random_uuid()::text, 1, 12)),
    actor_user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) on all platform tables so your backend and frontend have unrestricted read/write access
ALTER TABLE IF EXISTS colleges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alumni DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alumni_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentorships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hackathons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hackathon_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hackathon_partner_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant Full Schema Permissions to All Roles
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ==========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_alumni_email ON alumni(email);
CREATE INDEX IF NOT EXISTS idx_alumni_company ON alumni(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON mentorships(status);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
