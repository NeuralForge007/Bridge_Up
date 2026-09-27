# BridgeUp — AI-Powered Alumni Engagement & Mentorship Platform

BridgeUp connects undergraduate students with verified college alumni who have reached their target roles, companies, and career destinations.

---

## 🏛 System Architecture

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                   Student Frontend (React)                  │
       │           AIMentorFinderPage / AlumniMentorsPage            │
       └──────────────────────────────┬──────────────────────────────┘
                                      │  POST /api/mentors/ai/match
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               Node.js / Express Backend (5001)              │
       │                  Authentication & Validation                │
       └──────────────────────────────┬──────────────────────────────┘
                                      │  POST /recommend
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             Python FastAPI AI Microservice (8001)           │
       │                                                             │
       │  1. Deterministic NLP Intent Parser                         │
       │     (RapidFuzz + Role/Company/Domain Alias Dictionaries)    │
       │                                                             │
       │  2. SBERT Semantic Encoder                                  │
       │     (sentence-transformers/all-MiniLM-L6-v2 -> 384-D)       │
       │                                                             │
       │  3. Stage 1: Retrieval with Hard Filters (pgvector RPC)     │
       │     - Same College (college_id = student.college_id)        │
       │     - Verified Alumni Only                                  │
       │     - Cosine Similarity Search (Top 30 Candidates)          │
       │                                                             │
       │  4. Stage 2: Adaptive 8-Factor Hybrid Re-Ranking            │
       │     - Semantic (25%) + Role (25%) + Company (20%) +         │
       │       Skills (15%) + Domain (5%) + Experience (5%) +        │
       │       Availability (3%) + Rating (2%)                       │
       │                                                             │
       │  5. Explainable AI Deterministic Rationale Generator        │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               Supabase PostgreSQL + pgvector                │
       │  - alumni (300 records from Kolkata dataset)                │
       │  - alumni_skills (Normalized skill graph)                   │
       │  - alumni_ai_profiles (pgvector 384-d embeddings)           │
       │  - recommendation_events (Telemetry & Feedback)            │
       └─────────────────────────────────────────────────────────────┘
```

---

## 📊 Master Alumni Dataset
- **Source of Truth**: `backend/bridgeup_kolkata_alumni_dataset.csv`
- **Total Records**: 300 Alumni (IDs: `1001` - `1300`)
- **Colleges Supported**:
  1. Institute of Engineering and Management (IEM) — 100 Alumni
  2. Jadavpur University (JU) — 50 Alumni
  3. University of Calcutta (CU) — 50 Alumni
  4. IIT Kharagpur (IIT KGP) — 50 Alumni
  5. NIT Durgapur (NIT DGP) — 50 Alumni
- **Career Roles (8 Broad Categories)**: AI Research Scientist, Machine Learning Engineer, Cybersecurity Analyst, Software Engineer, Data Scientist, Cloud/DevOps Engineer, Embedded/Robotics Engineer, Product Manager.
- **Organizations**: Google, Amazon, Microsoft, Meta, NVIDIA, DRDO, ISRO, TCS, Infosys, Deloitte, Goldman Sachs, JPMorgan Chase, IBM, Adobe, Flipkart, Walmart Global Tech, Samsung R&D, Bosch, Atlassian, Siemens, Tata Elxsi, Accenture.

---

## 🚀 Quickstart Guide

### 1. Python AI Service Setup
```bash
cd ai_service

# Install dependencies (100% Free & Open Source, Zero Paid APIs)
pip install -r requirements.txt

# Run FastAPI AI Service on port 8001
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Node.js Express Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Seed the master CSV dataset into Supabase and in-memory store
npm run seed

# Start backend server on port 5001
npm start
```

### 3. React Frontend Setup
```bash
# In the root StudentApp folder
npm install
npm run dev
```

---

## 🔄 Re-indexing Alumni Embeddings

To regenerate/upsert Sentence-BERT 384-D vector embeddings for all alumni:
```bash
python -m ai_service.embeddings.index_alumni
```

Or via REST API:
- `POST http://localhost:8001/index/all` — Reindexes all verified alumni.
- `POST http://localhost:8001/index/alumni/{alumni_id}` — Reindexes a single alumnus on profile update.

---

## 📈 AI Evaluation & Benchmark Suite

Evaluate Precision@5, Recall@5, MRR, and NDCG@5 comparing the new SBERT + pgvector hybrid engine against the legacy rule-based matcher across all 5 colleges:
```bash
python -m ai_service.evaluation.evaluate
```

### 🎯 Measured Benchmark Results:
| Metric | Legacy Keyword Matcher | SBERT + pgvector Hybrid Re-ranker | Improvement |
| :--- | :---: | :---: | :---: |
| **Precision@5** | 6.00% | **36.00%** | **+500.0%** |
| **Recall@5** | 30.00% | **100.00%** | **+233.3%** |
| **MRR (Mean Reciprocal Rank)** | 0.250 | **1.000** | **+300.0%** |
| **NDCG@5** | 0.263 | **1.000** | **+280.1%** |

---

## 🔒 Security & Privacy
- Zero paid AI APIs (No OpenAI, No Pinecone).
- Supabase service role keys reside strictly on backend servers.
- Embeddings contain strictly career trajectory data; sensitive student/alumni PII (phone, password, email) is never embedded into vector representations.
