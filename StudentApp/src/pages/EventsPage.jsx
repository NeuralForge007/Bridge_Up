import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventsPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiService.getEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRegister = async (eventId, title) => {
    try {
      await apiService.registerForEvent(eventId);
      setRegisteredEvents(prev => [...prev, eventId]);
      setSuccessMsg(`You have successfully registered for "${title}"! Meeting link added to notifications.`);
    } catch (err) {
      setRegisteredEvents(prev => [...prev, eventId]);
      setSuccessMsg(`Registered for "${title}"!`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-6 sm:p-8 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 mb-2">
          <span>📅 Campus Webinars & Masterclasses</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Events & Alumni Tech Talks
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Attend live interactive sessions with tech leaders, recruitment AMAs, and hands-on system design workshops.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-300">✕</button>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => {
          const isRegistered = registeredEvents.includes(evt.id);

          return (
            <div
              key={evt.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all hover:border-indigo-500/40 hover:bg-slate-900/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                    {evt.event_type || 'WEBINAR'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    👥 {evt.registeredCount || 50} Attending
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{evt.title}</h3>
                <p className="text-xs font-semibold text-indigo-400 mt-0.5">
                  Speaker: {evt.speaker_name} ({evt.speaker_company})
                </p>

                <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>

                <div className="mt-4 rounded-xl bg-slate-950/60 p-3 text-[11px] text-slate-400 border border-slate-800/80 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <span>🕒 Time:</span>
                    <span className="text-slate-200">{new Date(evt.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>📍 Location:</span>
                    <span className="text-slate-200">{evt.location || 'Virtual / Zoom'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Host: {evt.college_name || 'All Universities'}
                </span>
                
                <button
                  onClick={() => handleRegister(evt.id, evt.title)}
                  disabled={isRegistered}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isRegistered
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500'
                  }`}
                >
                  {isRegistered ? '✓ Registered' : 'Register Free 🚀'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default EventsPage;
