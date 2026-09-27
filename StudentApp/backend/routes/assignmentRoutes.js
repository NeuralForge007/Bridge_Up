import express from 'express';
import { supabase } from '../supabaseClient.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

const SEED_ASSIGNMENTS = [
  {
    id: 'asg-1',
    user_id: 'demo-1',
    title: 'Graph Traversal & Dijkstra Algorithm Implementation',
    course: 'CS301 Data Structures',
    due_date: '2026-07-28',
    due_time: '11:59 PM',
    status: 'in_progress',
    priority: 'high',
    weight: '15%',
    score: null,
    notes: 'Implement adjacency list graph with shortest path algorithm and benchmark running time.'
  },
  {
    id: 'asg-2',
    user_id: 'demo-1',
    title: 'Convolutional Neural Networks for Image Classification',
    course: 'CS420 Artificial Intelligence',
    due_date: '2026-07-30',
    due_time: '5:00 PM',
    status: 'todo',
    priority: 'high',
    weight: '20%',
    score: null,
    notes: 'Train ResNet-18 model on CIFAR-10 dataset using PyTorch with data augmentation.'
  },
  {
    id: 'asg-3',
    user_id: 'demo-1',
    title: 'Linear Algebra Matrix Transformations Quiz',
    course: 'MATH302 Linear Algebra',
    due_date: '2026-07-25',
    due_time: '2:00 PM',
    status: 'submitted',
    priority: 'medium',
    weight: '10%',
    score: null,
    notes: 'Eigenvalues, eigenvectors, and singular value decomposition problem sets.'
  },
  {
    id: 'asg-4',
    user_id: 'demo-1',
    title: 'Distributed Consensus & Raft Protocol Report',
    course: 'CS450 Distributed Systems',
    due_date: '2026-07-20',
    due_time: '11:59 PM',
    status: 'graded',
    priority: 'medium',
    weight: '15%',
    score: '96/100 (A)',
    notes: 'Detailed analysis of raft leader election and log replication fault tolerance.'
  }
];

// GET /api/assignments/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let assignments = [];

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      assignments = data.map(a => ({
        id: a.id,
        title: a.title,
        course: a.course,
        dueDate: a.due_date,
        dueTime: a.due_time,
        status: a.status,
        priority: a.priority,
        weight: a.weight,
        score: a.score,
        notes: a.notes
      }));
    } else {
      assignments = SEED_ASSIGNMENTS.map(a => ({
        id: a.id,
        title: a.title,
        course: a.course,
        dueDate: a.due_date,
        dueTime: a.due_time,
        status: a.status,
        priority: a.priority,
        weight: a.weight,
        score: a.score,
        notes: a.notes
      }));
    }

    return res.json({ assignments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments — Create new assignment
router.post('/', async (req, res) => {
  try {
    const { userId, title, course, dueDate, dueTime, priority, weight, notes } = req.body;

    if (!title || !course) {
      return res.status(400).json({ error: 'Title and course are required.' });
    }

    const asgId = 'asg-' + Date.now();
    const newAsg = {
      id: asgId,
      user_id: userId || 'demo-1',
      title,
      course,
      due_date: dueDate || '2026-08-01',
      due_time: dueTime || '11:59 PM',
      status: 'todo',
      priority: priority || 'medium',
      weight: weight || '10%',
      notes: notes || ''
    };

    await supabase.from('assignments').insert([newAsg]);

    await logUserActivity({
      userId: newAsg.user_id,
      action: 'ASSIGNMENT_CREATE',
      details: { title, course, priority },
      req
    });

    return res.status(201).json({
      message: 'Assignment created successfully!',
      assignment: {
        id: asgId,
        title,
        course,
        dueDate: newAsg.due_date,
        dueTime: newAsg.due_time,
        status: 'todo',
        priority: newAsg.priority,
        weight: newAsg.weight,
        notes: newAsg.notes
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assignments/:id/status — Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    await supabase
      .from('assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    await logUserActivity({
      userId,
      action: 'ASSIGNMENT_STATUS',
      details: { assignmentId: id, newStatus: status },
      req
    });

    return res.json({ message: 'Assignment status updated.', id, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
