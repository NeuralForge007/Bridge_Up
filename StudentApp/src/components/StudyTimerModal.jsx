import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Play, Pause, RotateCcw, Volume2, Flame, BookOpen } from 'lucide-react';

export const StudyTimerModal = ({ onClose }) => {
  const { addFocusMinutes } = useData();
  const [mode, setMode] = useState('focus'); // 'focus' (25), 'short' (5), 'long' (15)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState('lofi'); // 'lofi', 'rain', 'cafe', 'none'
  const [notes, setNotes] = useState('');

  const MODE_TIMES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
    setIsRunning(false);
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'focus') {
        addFocusMinutes(25);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, addFocusMinutes]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass-strong)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Flame size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', lineHeight: 1.2 }}>Focus Study Room & Pomodoro</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deep Study Session Launcher</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <button
            onClick={() => handleModeChange('focus')}
            className={`btn btn-sm ${mode === 'focus' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🧠 Deep Focus (25m)
          </button>
          <button
            onClick={() => handleModeChange('short')}
            className={`btn btn-sm ${mode === 'short' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ☕ Short Break (5m)
          </button>
          <button
            onClick={() => handleModeChange('long')}
            className={`btn btn-sm ${mode === 'long' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🌴 Long Break (15m)
          </button>
        </div>

        {/* Main Timer Display */}
        <div style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)'
        }}>
          <div style={{
            fontFamily: 'Outfit',
            fontSize: '5rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: isRunning ? 'var(--primary)' : 'var(--text-main)',
            textShadow: isRunning ? '0 0 30px rgba(99,102,241,0.4)' : 'none',
            lineHeight: 1
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '80%',
            height: '8px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '4px',
            margin: '1.5rem auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--gradient-brand)',
              transition: 'width 1s linear'
            }}></div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={toggleTimer}
              className="btn btn-primary"
              style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', gap: '0.6rem' }}
            >
              {isRunning ? <><Pause size={22} /> Pause Focus</> : <><Play size={22} /> Start Focus</>}
            </button>
            <button onClick={resetTimer} className="btn btn-secondary">
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </div>

        {/* Ambient Music Sound Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Volume2 size={16} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>Ambient Study Audio:</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['lofi', 'rain', 'cafe', 'none'].map(snd => (
              <button
                key={snd}
                onClick={() => setAmbientSound(snd)}
                className={`btn btn-sm ${ambientSound === snd ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
              >
                {snd === 'lofi' ? '🎶 Lo-Fi Beats' : snd === 'rain' ? '🌧️ Soft Rain' : snd === 'cafe' ? '☕ Cozy Cafe' : '🔇 Mute'}
              </button>
            ))}
          </div>
        </div>

        {/* Study Scratchpad */}
        <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <BookOpen size={16} color="var(--secondary)" /> Session Goal & Scratchpad
          </div>
          <textarea
            placeholder="Type your current study objectives, formulas, or tasks here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            rows={3}
            style={{ fontSize: '0.85rem' }}
          />
        </div>
      </div>
    </div>
  );
};
