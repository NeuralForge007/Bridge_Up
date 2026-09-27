import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Check, 
  Sparkles, 
  Play,
  X
} from 'lucide-react';

export const StudyGroupsPage = ({ onOpenTimer }) => {
  const { studyGroups, toggleGroupJoin, addStudyGroup } = useData();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Group Form State
  const [name, setName] = useState('');
  const [course, setCourse] = useState('CS301 Data Structures');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('Tuesdays @ 6:00 PM');
  const [location, setLocation] = useState('Library Room 302 / Discord');
  const [tags, setTags] = useState('Midterm, Homework, Practice');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name || !description) return;
    addStudyGroup({
      name,
      course,
      description,
      leader: 'You (Active Student)',
      meetingTime,
      location,
      tags: tags.split(',').map(t => t.trim())
    });
    setShowCreateModal(false);
    // Reset form
    setName('');
    setDescription('');
  };

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>
            Collaborative <span className="gradient-text">Study Groups & Squads</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Join course study rooms or launch your own virtual group session for exam prep and project teamwork.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onOpenTimer} className="btn btn-secondary">
            <Play size={16} color="var(--primary)" /> Launch Virtual Study Room
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create Study Group
          </button>
        </div>
      </div>

      {/* Study Group Cards Grid */}
      <div className="grid-2">
        {studyGroups.map(group => (
          <div key={group.id} className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.75rem'
          }}>
            <div>
              {/* Group Course & Join Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  <BookOpen size={12} /> {group.course}
                </span>
                <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                  <Users size={12} /> {group.membersCount} / {group.maxMembers} Members
                </span>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.name}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {group.description}
              </p>

              {/* Details: Meeting Time, Location, Leader */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={15} color="var(--primary)" /> <span>{group.meetingTime}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={15} color="var(--accent)" /> <span>{group.location}</span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
                {(Array.isArray(group.tags) ? group.tags : []).map((tag, idx) => (
                  <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                onClick={() => toggleGroupJoin(group.id)}
                className={`btn btn-sm ${group.isJoined ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1 }}
              >
                {group.isJoined ? <><Check size={14} /> Joined Group</> : <><Plus size={14} /> Join Squad</>}
              </button>

              {group.isJoined && (
                <button onClick={onOpenTimer} className="btn btn-outline btn-sm">
                  <Play size={14} /> Launch Room
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Study Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-glass-strong)'
            }}>
              <h3 style={{ fontSize: '1.1rem' }}>Form a New Study Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. CS301 Dynamic Programming Masters"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Enrolled Course</label>
                <select value={course} onChange={(e) => setCourse(e.target.value)} className="form-select">
                  <option value="CS301 Data Structures">CS301 Data Structures</option>
                  <option value="CS420 Artificial Intelligence">CS420 Artificial Intelligence</option>
                  <option value="MATH302 Linear Algebra">MATH302 Linear Algebra</option>
                  <option value="CS450 Distributed Systems">CS450 Distributed Systems</option>
                  <option value="CHEM301 Organic Chemistry II">CHEM301 Organic Chemistry II</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Group Description & Focus</label>
                <textarea
                  placeholder="Describe your weekly study goals and review topics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Meeting Schedule</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location / Online Room</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Topic Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm, LeetCode, Flashcards"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Launch Study Group <Sparkles size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
