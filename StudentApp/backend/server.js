import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import peerRoutes from './routes/peerRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import alumniRoutes from './routes/alumniRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import hackathonRoutes from './routes/hackathonRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { seedSupabaseDatabase } from './supabaseClient.js';
import { runSeeder } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/peers', peerRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check & Welcome Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'BridgeUp Backend API with Supabase Integration',
    supabaseUrl: process.env.SUPABASE_URL || 'https://qcgekkenmgycmnhraxia.supabase.co',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/', (req, res) => {
  res.send('🚀 BridgeUp Node.js + Express + Supabase API Backend is live and running on Port ' + PORT);
});

// Start Server & Initialize Dataset Seeding
app.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(`🚀 BridgeUp Express Backend Server running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️  Supabase URL: ${process.env.SUPABASE_URL || 'https://qcgekkenmgycmnhraxia.supabase.co'}`);
  console.log(`=================================================`);

  // Initialize and seed dataset from Excel and sync to Supabase
  try {
    await runSeeder();
  } catch (err) {
    console.warn('Seeder notice:', err.message);
  }
  await seedSupabaseDatabase();
});
