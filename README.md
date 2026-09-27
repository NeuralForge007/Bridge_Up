# 🚀 BridgeUp — Student & Alumni Mentorship & Career Platform

BridgeUp is a comprehensive university ecosystem platform connecting students, alumni mentors, recruiters, college admins, and super admins. It features AI mentor matching, hackathon teammate finders, peer study groups, real-time messaging, referral tracking, and automated dataset seeding.

---

## 🌟 Key Features

- **🎓 Student Hub**: Track study streaks, GPA, active assignments, study groups, and hackathons.
- **🤝 AI Mentor Finder**: Smart cosine/TF-IDF inspired matching connecting students with verified alumni mentors based on skill overlaps and career goals.
- **👥 Peer Collaboration**: Discover study partners by major, skills, and course topics.
- **💼 Job & Referral Board**: Browse verified internships and request direct employee referrals from alumni.
- **🏆 Hackathon Partner Finder**: Create and join hackathon teams filtered by skill synergy.
- **💬 Real-Time Messaging**: Interactive direct messaging between students and alumni mentors.
- **📊 Multi-Role Dashboards**: Role-tailored dashboards for Students, Alumni, Recruiters, College Administrators, and Super Admins.
- **⚡ Dual Storage Layer**: Automatic ingestion of `NextStep_Test_Dataset.xlsx` with resilient fallback between in-memory `dbStore` and cloud Supabase PostgreSQL.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, JSON Web Token (JWT), CORS, XLSX Parser |
| **Database** | Supabase (PostgreSQL) + In-Memory Fallback Store (`dbStore.js`) |

---

## 🚦 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/NeuralForge007/Bridge_Up.git
cd Bridge_Up
```

---

### 2. Backend Setup & Launch
Navigate to `StudentApp/backend`, install dependencies, and start the server:

```bash
cd StudentApp/backend
npm install
npm run start
```
> **Backend URL**: [http://localhost:5001](http://localhost:5001)

*(Environment variables are preset in `StudentApp/backend/.env` with default port `5001` and Supabase keys)*

---

### 3. Frontend Setup & Launch
In a new terminal window, navigate to `StudentApp`, install dependencies, and start the Vite dev server:

```bash
cd StudentApp
npm install
npm run dev
```
> **Frontend URL**: [http://localhost:5174](http://localhost:5174)

---

## 🔑 Demo Login Accounts

Quick 1-click login is available via the **Demo User Selector** on the Login modal:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Alex Rivera | `alex.rivera@stanford.edu` | `demo123` |
| **Alumni Mentor** | Priya Sharma (Google) | `priya.sharma@alumni.stanford.edu` | `demo123` |
| **Recruiter** | Michael Chang (Microsoft) | `michael.c@microsoft.com` | `demo123` |
| **College Admin** | Dr. Sarah Jenkins | `sjenkins@admin.stanford.edu` | `demo123` |
| **Super Admin** | Platform Admin | `admin@bridgeup.io` | `admin123` |

---

## 📡 API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & service status |
| `/api/auth/demo-users` | `GET` | Retrieve pre-seeded demo accounts |
| `/api/auth/login` | `POST` | Authenticate user & issue JWT token |
| `/api/peers` | `GET` | Retrieve student peer network |
| `/api/mentors` | `GET` | Retrieve alumni mentor directory |
| `/api/jobs` | `GET` | Get job & internship listings |
| `/api/referrals` | `GET`, `POST` | Manage job referral requests |
| `/api/events` | `GET`, `POST` | Campus workshops & webinars |
| `/api/hackathons` | `GET` | Hackathon events & partner requests |
| `/api/groups` | `GET`, `POST` | Peer study groups & memberships |
| `/api/assignments/:userId` | `GET`, `POST` | Student coursework tracking |
