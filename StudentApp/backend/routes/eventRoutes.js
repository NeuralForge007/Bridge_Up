import express from 'express';
import { dbStore } from '../dbStore.js';

const router = express.Router();

// Get all events
router.get('/', (req, res) => {
  try {
    const { type, collegeId, search } = req.query;
    let list = dbStore.getEvents ? dbStore.getEvents() : (dbStore.events || []);

    if (type) {
      list = list.filter(e => e.event_type?.toLowerCase() === type.toLowerCase() || e.type?.toLowerCase() === type.toLowerCase());
    }
    if (collegeId) {
      list = list.filter(e => e.college_id === Number(collegeId) || e.college_id === collegeId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.speaker_name && e.speaker_name.toLowerCase().includes(q))
      );
    }

    const regList = dbStore.eventRegistrations || dbStore.event_registrations || [];

    const enriched = list.map(e => {
      const eid = e.event_id || e.id;
      const registrations = regList.filter(r => r.event_id === eid || r.event_id === Number(eid));
      return {
        ...e,
        id: eid,
        title: e.title,
        description: e.description || 'Masterclass and interactive career session with alumni leaders.',
        event_type: e.event_type || 'WEBINAR',
        speaker_name: e.speaker_name || 'Vikram Sethi',
        speaker_company: e.speaker_company || 'Google Cloud',
        scheduled_at: e.event_date ? `${e.event_date}T${e.start_time || '18:00'}:00Z` : new Date(Date.now() + 5 * 86400000).toISOString(),
        location: e.location || 'Virtual / Zoom',
        meeting_link: e.meeting_link || 'https://meet.google.com/bridgeup-talk',
        registeredCount: registrations.length + (e.registered_count || 35),
        college_name: 'All Partner Universities'
      };
    });

    res.json({ success: true, count: enriched.length, events: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an event
router.post('/', (req, res) => {
  try {
    const { title, description, eventType, speakerName, speakerCompany, scheduledAt, location, meetingLink } = req.body;

    const newEvent = {
      event_id: Date.now() % 10000,
      id: `evt-${Date.now()}`,
      college_id: 1,
      title: title || 'Alumni Tech Talk',
      description: description || 'Insightful session on industry trends and career pathways.',
      event_type: eventType || 'WEBINAR',
      speaker_name: speakerName || 'Alumni Leader',
      speaker_company: speakerCompany || 'Tech Giant',
      event_date: '2026-10-10',
      start_time: '18:00',
      location: location || 'Virtual / Zoom',
      meeting_link: meetingLink || 'https://meet.google.com/bridgeup-talk',
      registered_count: 1,
      status: 'Published'
    };

    if (dbStore.upsertEvent) dbStore.upsertEvent(newEvent);
    else dbStore.events.unshift(newEvent);

    res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register for an event
router.post('/:id/register', (req, res) => {
  try {
    const { id } = req.params;
    const registration = {
      id: `ereg-${Date.now()}`,
      event_id: Number(id) || id,
      user_id: 1001,
      registered_at: new Date().toISOString()
    };

    if (!dbStore.eventRegistrations) dbStore.eventRegistrations = [];
    dbStore.eventRegistrations.push(registration);

    res.status(201).json({ success: true, message: 'Successfully registered for event!', registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
