# 🌉 BridgeUp

> **Comprehensive Student, Alumni, College & Recruiter Career Mentorship Platform**

BridgeUp connects students with alumni mentors, colleges, and top recruiters for career acceleration, skill verification, assignment guidance, hackathon teaming, and direct job referrals.

---

## 🚀 Quick Start Guide (Run on Any Laptop)

### 1. Prerequisites
- **Node.js**: v18.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0 or higher

---

### 2. Clone the Repository
```bash
git clone https://github.com/NeuralForge007/Bridge_Up.git
cd Bridge_Up
```

---

### 3. Start the Backend API Server

Open a terminal and run:

```bash
cd StudentApp/backend
npm install
npm start
```
- **Backend Port**: `5001`
- **Backend Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- Automatically ingests sample dataset (`NextStep_Test_Dataset.xlsx`) and synchronizes with Supabase.

---

### 4. Start the Frontend Client

Open a second terminal window and run:

```bash
cd StudentApp
npm install
npm run dev
```
- **Frontend Port**: `5174`
- **Application URL**: [http://localhost:5174/](http://localhost:5174/)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, RESTful APIs, JWT Authentication, bcryptjs
- **Database & Sync**: Supabase PostgreSQL + Excel Dataset Seeder (`xlsx`)

---

## 👥 Demo User Logins

Quick demo accounts for testing all roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@demo.com` | `password123` |
| **Alumni Mentor** | `alumni@demo.com` | `password123` |
| **Recruiter** | `recruiter@demo.com` | `password123` |
| **College Admin** | `admin@demo.com` | `password123` |

*(You can also use the one-click Demo Switcher in the login/header interface!)*
