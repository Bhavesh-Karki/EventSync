const { getSupabase } = require('../config/database');
const { isUuid, mapVolunteer, volunteerPayload } = require('../utils/supabaseRecords');
const validators = require('../utils/validators');

const sendError = (res, error, fallback) => {
  const status = /not found|invalid|required|validation|duplicate|violates|already/i.test(error.message || '')
    ? 400
    : 500;
  const message = error.code === '23505'
    ? 'A volunteer with this email already exists'
    : error.message || fallback;

  return res.status(status).json({ success: false, message, data: null });
};

const getAssignedEventIds = async (volunteerIds) => {
  if (!volunteerIds.length) return {};

  const { data, error } = await getSupabase()
    .from('assignments')
    .select('volunteer_id,event_id,status')
    .in('volunteer_id', volunteerIds)
    .neq('status', 'cancelled');

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    acc[row.volunteer_id] = acc[row.volunteer_id] || [];
    acc[row.volunteer_id].push(row.event_id);
    return acc;
  }, {});
};

const getAllVolunteers = async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('volunteers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const assigned = await getAssignedEventIds((data || []).map((v) => v.id));
    res.json({
      success: true,
      data: (data || []).map((volunteer) => mapVolunteer(volunteer, assigned[volunteer.id] || []))
    });
  } catch (error) {
    console.error(error);
    sendError(res, error, 'Failed to retrieve volunteers');
  }
};

const createVolunteer = async (req, res) => {
  try {
    const validation = validators.validateVolunteer(req.body);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await getSupabase()
      .from('volunteers')
      .insert(volunteerPayload(req.body))
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: mapVolunteer(data) });
  } catch (error) {
    console.error(error);
    sendError(res, error, 'Failed to add volunteer');
  }
};

const getVolunteerById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      throw new Error('Invalid volunteer ID');
    }

    const { data, error } = await getSupabase()
      .from('volunteers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Volunteer not found');

    const assigned = await getAssignedEventIds([data.id]);
    res.json({ success: true, data: mapVolunteer(data, assigned[data.id] || []) });
  } catch (error) {
    console.error(error);
    sendError(res, error, 'Server error');
  }
};

const updateVolunteer = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      throw new Error('Invalid volunteer ID');
    }

    const { data, error } = await getSupabase()
      .from('volunteers')
      .update(volunteerPayload(req.body))
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Volunteer not found');

    const assigned = await getAssignedEventIds([data.id]);
    res.json({ success: true, data: mapVolunteer(data, assigned[data.id] || []) });
  } catch (error) {
    console.error(error);
    sendError(res, error, 'Failed to update volunteer');
  }
};

const deleteVolunteer = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      throw new Error('Invalid volunteer ID');
    }

    const supabase = getSupabase();
    await supabase.from('assignments').delete().eq('volunteer_id', req.params.id);
    const { error } = await supabase.from('volunteers').delete().eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Volunteer deleted successfully' });
  } catch (error) {
    console.error(error);
    sendError(res, error, 'Failed to delete volunteer');
  }
};

module.exports = {
  getAllVolunteers,
  createVolunteer,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer
};
