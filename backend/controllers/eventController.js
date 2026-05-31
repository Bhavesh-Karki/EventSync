const { getSupabase } = require('../config/database');
const { eventPayload, isUuid, mapEvent } = require('../utils/supabaseRecords');
const validators = require('../utils/validators');

const sendError = (res, error, fallback) => {
  const status = /not found|invalid|required|validation|duplicate|violates/i.test(error.message || '')
    ? 400
    : 500;

  return res.status(status).json({ success: false, message: error.message || fallback });
};

const getAllEvents = async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return res.json({ success: true, data: (data || []).map(mapEvent) });
  } catch (error) {
    console.error('getAllEvents error:', error);
    return sendError(res, error, 'Failed to fetch events');
  }
};

const createEvent = async (req, res) => {
  try {
    const validation = validators.validateEvent(req.body);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await getSupabase()
      .from('events')
      .insert(eventPayload(req.body))
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data: mapEvent(data) });
  } catch (error) {
    console.error('createEvent error:', error);
    return sendError(res, error, 'Failed to create event');
  }
};

const updateEvent = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      throw new Error('Invalid event ID');
    }

    const { data, error } = await getSupabase()
      .from('events')
      .update(eventPayload(req.body))
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Event not found');

    return res.json({ success: true, data: mapEvent(data) });
  } catch (error) {
    console.error('updateEvent error:', error);
    return sendError(res, error, 'Failed to update event');
  }
};

const deleteEvent = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      throw new Error('Invalid event ID');
    }

    const supabase = getSupabase();

    await supabase.from('assignments').delete().eq('event_id', req.params.id);
    const { error } = await supabase.from('events').delete().eq('id', req.params.id);

    if (error) throw error;

    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('deleteEvent error:', error);
    return sendError(res, error, 'Failed to delete event');
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
