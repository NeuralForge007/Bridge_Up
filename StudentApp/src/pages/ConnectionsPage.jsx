import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Search, 
  Sparkles, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  Check
} from 'lucide-react';

export const ConnectionsPage = ({ setActivePage }) => {
  const { peers, toggleConnection, startConversation } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('All');

  const majors = ['All', 'Computer Science', 'Data Science', 'Electrical Engineering', 'Biomedical Engineering', 'Mathematics & Stats'];

  const filteredPeers = peers.filter(peer => {
    const matchesMajor = selectedMajor === 'All' || peer.major.toLowerCase().includes(selectedMajor.toLowerCase());
    const matchesSearch = peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          peer.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          peer.major.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMajor && matchesSearch;
  });

  const handleStartChat = (peer) => {
    startConversation(peer);
    setActivePage('messages');
  };

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>
            Campus Peer Connections & <span className="gradient-text">Study Matcher</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Discover and network with classmates who share your courses, skills, and study goals.
          </p>
        </div>

        <div className="badge badge-primary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
          <Sparkles size={16} /> AI Match Engine Active
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by student name, skills (e.g. Python, Algorithms), or major..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Major Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {majors.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMajor(m)}
                className={`btn btn-sm ${selectedMajor === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Peer Grid */}
      <div className="grid-3">
        {filteredPeers.map(peer => (
          <div key={peer.id} className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem',
            position: 'relative'
          }}>
            {/* Top Match Score Badge */}
            <div style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem'
            }}>
              <span className="badge badge-primary" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                <Sparkles size={12} /> {peer.matchScore}% Match
              </span>
            </div>

            <div>
              {/* Student Basic Info */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src={peer.avatar} alt={peer.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span 
                    className={`status-dot ${peer.status === 'online' ? 'status-online' : peer.status === 'studying' ? 'status-studying' : 'status-offline'}`}
                    style={{ position: 'absolute', bottom: '2px', right: '2px', border: '2px solid var(--bg-card)' }}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{peer.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>{peer.major}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {peer.year} • GPA {peer.gpa}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45, minHeight: '44px' }}>
                "{peer.bio}"
              </p>

              {/* Courses Badge */}
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Enrolled Courses:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {(Array.isArray(peer.courses) ? peer.courses : ['CS101 Intro to Computer Science']).map((c, idx) => (
                    <span key={idx} className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                      {typeof c === 'string' ? c.split(' ')[0] : c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills Badge */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Top Skills:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {(Array.isArray(peer.skills) ? peer.skills : ['Problem Solving']).map((s, idx) => (
                    <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                onClick={() => toggleConnection(peer.id)}
                className={`btn btn-sm ${peer.connectionState === 'connected' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1 }}
              >
                {peer.connectionState === 'connected' ? (
                  <><UserCheck size={14} /> Connected</>
                ) : peer.connectionState === 'pending' ? (
                  <><Check size={14} /> Request Sent</>
                ) : (
                  <><UserPlus size={14} /> Connect</>
                )}
              </button>

              <button
                onClick={() => handleStartChat(peer)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.5rem 0.75rem' }}
                title="Send Direct Message"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
