import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  Clock, 
  Award, 
  X, 
  Sparkles 
} from 'lucide-react';

export const AssignmentsPage = () => {
  const { assignments, updateAssignmentStatus, addAssignment } = useData();
  const [showAddModal, setShowAddModal] = useState(false);

  // New Assignment Form State
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('CS301 Data Structures');
  const [dueDate, setDueDate] = useState('2026-08-01');
  const [dueTime, setDueTime] = useState('11:59 PM');
  const [priority, setPriority] = useState('high');
  const [weight, setWeight] = useState('15%');
  const [notes, setNotes] = useState('');

  const columns = [
    { id: 'todo', label: 'To Do', color: '#f59e0b', count: assignments.filter(a => a.status === 'todo').length },
    { id: 'in_progress', label: 'In Progress', color: '#6366f1', count: assignments.filter(a => a.status === 'in_progress').length },
    { id: 'submitted', label: 'Submitted', color: '#3b82f6', count: assignments.filter(a => a.status === 'submitted').length },
    { id: 'graded', label: 'Graded', color: '#10b981', count: assignments.filter(a => a.status === 'graded').length }
  ];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    addAssignment({
      title,
      course,
      dueDate,
      dueTime,
      priority,
      weight,
      notes,
      score: null
    });
    setShowAddModal(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>
            Academic Assignment <span className="gradient-text">Kanban Board</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Track project deliverables, homework deadlines, priority weighting, and grade releases.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Assignment
        </button>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid-4" style={{ alignItems: 'start' }}>
        {columns.map(col => {
          const colAssignments = assignments.filter(a => a.status === col.id);
          return (
            <div key={col.id} className="glass-card" style={{ padding: '1.25rem', minHeight: '550px' }}>
              {/* Column Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: `2px solid ${col.color}`,
                paddingBottom: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{col.label}</span>
                </div>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: col.color, fontWeight: 800 }}>
                  {col.count}
                </span>
              </div>

              {/* Assignment Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {colAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                    No assignments in this stage
                  </div>
                ) : (
                  colAssignments.map(asg => (
                    <div key={asg.id} style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass-strong)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {/* Priority & Weight Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className={`badge ${asg.priority === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                          {asg.priority} priority
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                          Weight: {asg.weight}
                        </span>
                      </div>

                      {/* Title & Course */}
                      <h4 style={{ fontSize: '0.92rem', marginBottom: '0.4rem', lineHeight: 1.35 }}>{asg.title}</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.6rem' }}>
                        {asg.course}
                      </div>

                      {/* Notes snippet */}
                      {asg.notes && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                          {asg.notes}
                        </p>
                      )}

                      {/* Graded Score Display if graded */}
                      {asg.score && (
                        <div style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--success-light)',
                          color: '#34d399',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <Award size={14} /> Score: {asg.score}
                        </div>
                      )}

                      {/* Due Date & Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '0.85rem' }}>
                        <Clock size={13} color="var(--warning)" />
                        <span>Due {asg.dueDate} ({asg.dueTime})</span>
                      </div>

                      {/* Column Stage Switcher Buttons */}
                      <div style={{ display: 'flex', gap: '0.3rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                        {col.id !== 'todo' && (
                          <button
                            onClick={() => updateAssignmentStatus(asg.id, col.id === 'in_progress' ? 'todo' : col.id === 'submitted' ? 'in_progress' : 'submitted')}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }}
                          >
                            ← Move Back
                          </button>
                        )}
                        {col.id !== 'graded' && (
                          <button
                            onClick={() => updateAssignmentStatus(asg.id, col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'submitted' : 'graded')}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }}
                          >
                            Move Next →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-glass-strong)'
            }}>
              <h3 style={{ fontSize: '1.1rem' }}>Add New Assignment</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming & Shortest Path Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course</label>
                <select value={course} onChange={(e) => setCourse(e.target.value)} className="form-select">
                  <option value="CS301 Data Structures">CS301 Data Structures</option>
                  <option value="CS420 Artificial Intelligence">CS420 Artificial Intelligence</option>
                  <option value="MATH302 Linear Algebra">MATH302 Linear Algebra</option>
                  <option value="CS450 Distributed Systems">CS450 Distributed Systems</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Time</label>
                  <input
                    type="text"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select">
                    <option value="high">High Priority 🔴</option>
                    <option value="medium">Medium Priority 🟡</option>
                    <option value="low">Low Priority 🟢</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Grade Weight</label>
                  <input
                    type="text"
                    placeholder="e.g. 15%"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Submission Notes & Guidelines</label>
                <textarea
                  placeholder="Include required GitHub repository links or submission requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Create Kanban Assignment <Sparkles size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
