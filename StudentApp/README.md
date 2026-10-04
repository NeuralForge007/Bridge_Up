# BridgeUp — AI-Powered Alumni Engagement, Hackathon Teammate Matching & Mentorship Platform

BridgeUp connects undergraduate students with verified college alumni mentors and high-compatibility hackathon teammates across premier partner institutions using Sentence-BERT semantic embeddings and adaptive hybrid re-ranking.

---

## 🏛 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 React Frontend (Port 5174)                              │
│   • AIMentorFinderPage (Alumni Matcher) • HackathonsPage (Finder) • AuthModal (Auth)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Authenticated REST APIs
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            Node.js / Express Backend (Port 5001)                       │
│   • /api/auth (bcrypt, registration, token generation, async SBERT indexing)           │
│   • /api/mentors/ai/match (Resolves authenticated student, enforces same college)      │
│   • /api/hackathons (Hackathons, Requirements, Recommendations, Join Requests)         │
│   • /api/team-join-requests (Incoming / Outgoing lifecycle, atomic acceptance)         │
└───────────────────────────┬────────────────────────────────────────┬───────────────────┘
                            │                                        │
             Internal HTTP  │                                        │ Supabase Client
             POST /recommend│                                        │ (PostgreSQL REST)
                            ▼                                        ▼
┌───────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│       Python FastAPI Microservice (8001)      │ │            Supabase Cloud            │
│  • Sentence-BERT (all-MiniLM-L6-v2, 384-D)    │ │  • students (600 profiles)           │
│  • Fast cosine vector retrieval               │ │  • student_skills (4,788 rows)       │
│  • Alumni Matcher (8-Factor adaptive rerank)  │ │  • alumni (300 records)              │
│  • Teammate Recommender (9-Factor rerank)     │ │  • hackathons (4 upcoming)           │
│  • Deterministic rationale generator          │ │  • mentorships / requests            │
└───────────────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 🌟 Core Implemented Features

### 1. AI Alumni Mentor Matcher (Repaired & Fully Explainable)
- **Constraint Enforcement**: Strictly confines recommendations to verified alumni of the authenticated student's own college.
- **SBERT Embeddings**: Embeds query into 384 dimensions using `sentence-transformers/all-MiniLM-L6-v2`.
- **Adaptive 8-Factor Reranking**:
  - Semantic similarity (25%) + Target role match (25%) + Target company match (20%) + Skill compatibility (15%) + Career domain (5%) + Experience (5%) + Availability (3%) + Mentor rating (2%).
- **Score Integrity**: Removed all fabricated defaults (`|| 85`, `|| 88`). Missing score data is an error; returns honest `EXACT`, `STRONG`, and `RELATED` classifications with detailed score breakdowns and evidence-based explanations.
- **Fail-Safe**: Returns structured `503 AI_SERVICE_UNAVAILABLE` if FastAPI is unreachable.

### 2. AI Hackathon Teammate Finder & Join Request Lifecycle
- **Hackathon Explorer**: Real-time listing of upcoming hackathons with domains, team size constraints, prizes, and deadlines.
- **Team Requirements**: Multi-select skills, desired roles, pitch, open slots, and optional college/gender filters (applied strictly only when specified).
- **Candidate Hard Filters**: Excludes requester, inactive/hidden profiles, and members not open to team requests.
- **Adaptive 9-Factor Scoring**:
  - Required skills coverage (35%) + Semantic role/project compatibility (20%) + Hackathon experience (12%) + Project experience (12%) + Preferred team role (8%) + Domain compatibility (5%) + Collaboration mode (4%) + Teammate rating (2%) + Response rate (2%).
- **Separation of Matches**: Distinguishes between `matches` (meeting all hard minimums) and `near_matches` (highlighting specific unmet thresholds).
- **Atomic Join Requests**: Request tracking (`PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`), duplicate prevention, and participant registration upon acceptance.

### 3. Canonical Student Registration & Authentication
- **Beside Login in AuthModal**: Seamless tabbed modal for Sign In and Create Student Account.
- **Full Canonical Profile**: Collects all 39 CSV fields: identity, college, year, CGPA, career domain/goal, primary/multi-select skills, preferred roles, hackathon/project history, availability, collaboration mode, city, languages, and portfolio links.
- **Security**: bcrypt password hashing (10 rounds), minimum 8-character validation, case-insensitive email uniqueness check, no plaintext passwords or password hashes leaked in responses.
- **Async SBERT Vector Indexing**: Immediately indexes new student profiles into the vector repository upon successful registration.

---

## 📊 Dataset Ingestion & Seeds

### 1. Student Master Dataset (`data/bridgeup_student_dataset.csv`)
- **Total Profiles**: 600 synthetic students
- **College Distribution (5:2:2:2:1 Ratio)**:
  - Institute of Engineering and Management (IEM): **250**
  - Jadavpur University (JU): **100**
  - University of Calcutta (CU): **100**
  - IIT Kharagpur (IITKGP): **100**
  - NIT Durgapur (NITDGP): **50**
- **Normalized Skills**: 4,788 rows in `student_skills`
- **Import Command**:
  ```bash
  npm run seed:students -- --file data/bridgeup_student_dataset.csv
  ```

### 2. Alumni Master Dataset (`backend/bridgeup_kolkata_alumni_dataset.csv`)
- **Total Records**: 300 verified alumni
- **Import Command**:
  ```bash
  npm run seed:alumni
  ```

---

## 📈 Empirical Evaluation & Benchmark Results

### 1. Alumni Mentor Matcher Benchmark (10 Diverse Test Cases)
```text
========================================================================================
Metric                 | Legacy Keyword Matcher    | SBERT + pgvector Hybrid   | Improvement 
----------------------------------------------------------------------------------------
Precision@5            |                 6.00%     |                36.00%     |     +500.0%
Recall@5               |                30.00%     |               100.00%     |     +233.3%
MRR (Mean Recip. Rank) |                 0.250     |                 1.000     |     +300.0%
NDCG@5                 |                 0.263     |                 1.000     |     +280.1%
========================================================================================
```

### 2. Hackathon Teammate Recommender Benchmark (8 Multi-Domain Cases)
```text
========================================================================================
Metric                         | SBERT + pgvector Teammate Matcher
----------------------------------------------------------------------------------------
Precision@5                    |                  85.00%
Recall@5                       |                  34.30%
MRR (Mean Reciprocal Rank)     |                  0.812
NDCG@5                         |                  0.833
========================================================================================
```

---

## 🚀 Execution Commands

### 1. Start FastAPI AI Microservice (Port 8001)
```bash
python -m uvicorn ai_service.main:app --host 0.0.0.0 --port 8001
```
- Health check: `GET http://localhost:8001/health`
- Readiness check: `GET http://localhost:8001/ready`

### 2. Start Express Backend Server (Port 5001)
```bash
node backend/server.js
```
- Health check: `GET http://localhost:5001/api/health`

### 3. Start React Frontend (Port 5174)
```bash
npm run dev
```

### 4. Run Automated Test & Evaluation Suites
```bash
# Full-stack integration test suite (28 automated checks)
node backend/test_suite.js

# Complete Python AI benchmark evaluation suite (Precision, Recall, MRR, NDCG)
python -m ai_service.evaluation.evaluate_all
```
