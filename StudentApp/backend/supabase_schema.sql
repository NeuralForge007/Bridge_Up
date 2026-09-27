-- ==========================================================================
-- NEXTSTEP: Production PostgreSQL Relational Schema for Supabase
-- Target URL: https://uknypaqumcsseydiyncz.supabase.co
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    full_name TEXT,
    verification_status TEXT DEFAULT 'Verified', -- 'Verified', 'Pending', 'Rejected'
    college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
    avatar TEXT,
    bio TEXT,
    status TEXT DEFAULT 'online',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    student_id INT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
    year_of_study INT DEFAULT 1,
    degree TEXT DEFAULT 'B.Tech',
    department TEXT,
    graduation_year INT,
    cgpa NUMERIC(4, 2) DEFAULT 8.0,
    career_domain TEXT,
    career_goal TEXT,
    primary_skill TEXT,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    alumni_id INT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'ALUMNI',
    college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
    graduation_year INT,
    current_role TEXT,
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
    topics JSONB DEFAULT '["Career Guidance", "System Design", "Mock Interviews"]'::jsonb,
    sessions_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECRUITERS TABLE
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    proficiency TEXT DEFAULT 'Intermediate',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumni_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumni_id INT REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    proficiency TEXT DEFAULT 'Advanced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. JOBS & INTERNSHIPS
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INT UNIQUE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    preferred_college_city TEXT,
    country TEXT DEFAULT 'India',
    employment_type TEXT DEFAULT 'Full-time', -- 'Internship', 'Full-time', 'Contract'
    required_skills TEXT,
    status TEXT DEFAULT 'Active', -- 'Active', 'Closed'
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentorship_id INT UNIQUE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    alumni_id INT REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    goal TEXT,
    status TEXT DEFAULT 'REQUESTED', -- 'REQUESTED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'REJECTED'
    start_date TEXT,
    end_date TEXT,
    source TEXT DEFAULT 'AI match',
    ai_match_score NUMERIC(5, 2) DEFAULT 85.0,
    notes TEXT,
    rating NUMERIC(3, 2),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. HACKATHONS & PARTICIPANTS
CREATE TABLE IF NOT EXISTS hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id INT UNIQUE,
    name TEXT NOT NULL,
    short_code TEXT,
    description TEXT,
    date TEXT,
    status TEXT DEFAULT 'Upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_record_id INT UNIQUE,
    hackathon_id INT REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
    person_type TEXT DEFAULT 'STUDENT',
    person_id INT,
    hackathon_name TEXT,
    result TEXT DEFAULT 'Participant', -- 'Winner', 'Finalist', 'Top 10', 'Participant'
    primary_skill TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathon_partner_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id INT UNIQUE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    hackathon_id INT REFERENCES hackathons(hackathon_id) ON DELETE CASCADE,
    required_skill_1 TEXT,
    required_skill_2 TEXT,
    preferred_location TEXT,
    status TEXT DEFAULT 'Open', -- 'Open', 'Filled', 'Closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id INT UNIQUE,
    alumni_id INT REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'REJECTED'
    recommendation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EVENTS & WORKSHOPS
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id INT UNIQUE,
    college_id INT REFERENCES colleges(college_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    event_date TEXT,
    start_time TEXT,
    location TEXT DEFAULT 'Online',
    capacity INT DEFAULT 100,
    registered_count INT DEFAULT 0,
    status TEXT DEFAULT 'Published',
    organizer TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'MENTOR_REQUEST', 'MENTOR_ACCEPTED', 'REFERRAL', 'PARTNER_REQUEST', 'EVENT', 'VERIFICATION'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    alumni_id TEXT,
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL, -- 'LOGIN', 'SIGNUP', 'VERIFY_STUDENT', 'VERIFY_ALUMNI', 'CREATE_REFERRAL', 'REQUEST_MENTOR', etc.
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_cgpa ON students(cgpa);
CREATE INDEX IF NOT EXISTS idx_students_verification ON students(verification_status);
CREATE INDEX IF NOT EXISTS idx_alumni_college ON alumni(college_id);
CREATE INDEX IF NOT EXISTS idx_alumni_company ON alumni(company);
CREATE INDEX IF NOT EXISTS idx_alumni_verification ON alumni(verification_status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON mentorships(status);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
