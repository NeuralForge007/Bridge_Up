-- ==========================================================================
-- BRIDGEUP: PostgreSQL Migration for 300 Synthetic Alumni & pgvector AI
-- ==========================================================================

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Alumni Table Has All Master CSV Columns
CREATE TABLE IF NOT EXISTS alumni (
    id TEXT PRIMARY KEY DEFAULT ('alm-' || substr(gen_random_uuid()::text, 1, 12)),
    user_id TEXT,
    alumni_id INT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'ALUMNI',
    college_id INT DEFAULT 1,
    college_name TEXT DEFAULT 'Stanford University',
    graduation_year INT,
    "current_role" TEXT,
    role_title TEXT,
    company TEXT,
    career_domain TEXT,
    experience_years INT DEFAULT 0,
    availability TEXT DEFAULT 'Available',
    verification_status TEXT DEFAULT 'Verified',
    mentor_status TEXT DEFAULT 'Mentor',
    referral_status TEXT DEFAULT 'Open for Referrals',
    mentor_rating NUMERIC(3, 2) DEFAULT 4.8,
    bio TEXT,
    career_path TEXT,
    avatar TEXT,
    linkedin TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    topics JSONB DEFAULT '["Career Guidance", "System Design", "Mock Technical Interviews"]'::jsonb,
    sessions_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure Alumni Skills Table
CREATE TABLE IF NOT EXISTS alumni_skills (
    id TEXT PRIMARY KEY DEFAULT ('ask-' || substr(gen_random_uuid()::text, 1, 12)),
    alumni_id INT,
    skill TEXT NOT NULL,
    proficiency TEXT DEFAULT 'Advanced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Alumni AI Vector Profiles Table (Sentence-BERT 384 Dimensions)
CREATE TABLE IF NOT EXISTS alumni_ai_profiles (
    id TEXT PRIMARY KEY DEFAULT ('aip-' || substr(gen_random_uuid()::text, 1, 12)),
    alumni_id INT UNIQUE REFERENCES alumni(alumni_id) ON DELETE CASCADE,
    semantic_profile TEXT NOT NULL,
    embedding VECTOR(384),
    normalized_role TEXT,
    normalized_company TEXT,
    normalized_domain TEXT,
    college_id INT DEFAULT 1,
    verified BOOLEAN DEFAULT TRUE,
    available_for_mentorship BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Recommendation Feedback / Analytics Table
CREATE TABLE IF NOT EXISTS recommendation_events (
    id TEXT PRIMARY KEY DEFAULT ('rev-' || substr(gen_random_uuid()::text, 1, 12)),
    student_id TEXT,
    alumni_id INT,
    query_text TEXT,
    target_role TEXT,
    target_company TEXT,
    target_domain TEXT,
    match_score NUMERIC(5, 2),
    match_type TEXT, -- 'EXACT', 'STRONG', 'RELATED'
    event_type TEXT DEFAULT 'shown', -- 'shown', 'clicked', 'mentorship_requested', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. pgvector Fast Cosine Distance RPC Function (Hard Filter by College & Verification)
CREATE OR REPLACE FUNCTION match_alumni(
    query_embedding VECTOR(384),
    query_college_id INT,
    match_count INT DEFAULT 30
)
RETURNS TABLE (
    alumni_id INT,
    similarity FLOAT,
    semantic_profile TEXT,
    normalized_role TEXT,
    normalized_company TEXT,
    normalized_domain TEXT,
    college_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.alumni_id,
        (1 - (p.embedding <=> query_embedding))::FLOAT AS similarity,
        p.semantic_profile,
        p.normalized_role,
        p.normalized_company,
        p.normalized_domain,
        p.college_id
    FROM alumni_ai_profiles p
    WHERE (query_college_id IS NULL OR p.college_id = query_college_id)
      AND p.verified = TRUE
      AND p.embedding IS NOT NULL
    ORDER BY p.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 7. Disable RLS & Grant Permissions
ALTER TABLE IF EXISTS alumni DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alumni_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alumni_ai_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recommendation_events DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE alumni TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE alumni_skills TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE alumni_ai_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE recommendation_events TO postgres, anon, authenticated, service_role;
