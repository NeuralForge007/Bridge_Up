import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Send, 
  Search, 
  Paperclip, 
  Phone, 
  Video, 
  CheckCheck
} from 'lucide-react';

export const MessagesPage = () => {
  const { conversations, sendMessage } = useData();
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || null);
  const [textInput, setTextInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = conversations.find(c => c.id === activeConvId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !activeConvId) return;
    sendMessage(activeConvId, textInput.trim());
    setTextInput('');
  };

  const filteredConversations = conversations.filter(c => 
    c.peerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      <div className="glass-card" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        padding: 0,
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        {/* Left Contacts Sidebar */}
        <div style={{
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          {/* Contacts Header & Search */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Campus Messages</h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', padding: '0.45rem 0.45rem 0.45rem 2.2rem' }}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredConversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <img src={conv.peerAvatar} alt={conv.peerName} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{conv.peerName}</span>
                    </div>
                    <p style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Window */}
        {activeConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Active Chat Header */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-glass-strong)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={activeConv.peerAvatar} alt={activeConv.peerName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{activeConv.peerName}</h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="status-dot status-online"></span> Active Campus Peer
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-icon" title="Voice Call"><Phone size={16} /></button>
                <button className="btn-icon" title="Video Call"><Video size={16} /></button>
              </div>
            </div>

            {/* Message Bubble Feed */}
            <div style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0) 70%)'
            }}>
              {activeConv.messages.map(msg => {
                const isMe = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe ? 'var(--gradient-brand)' : 'var(--bg-glass-strong)',
                      color: isMe ? '#ffffff' : 'var(--text-main)',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.88rem',
                      lineHeight: 1.45
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '0.25rem', padding: '0 0.2rem' }}>
                      {msg.timestamp} {isMe && <CheckCheck size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--primary)' }} />}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <button type="button" className="btn-icon" title="Attach file"><Paperclip size={18} /></button>
              <input
                type="text"
                placeholder={`Message ${activeConv.peerName}...`}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="form-input"
                style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-full)' }}>
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
