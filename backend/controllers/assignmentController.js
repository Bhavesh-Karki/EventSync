const { getSupabase } = require('../config/database');
const {
  assignmentPayload,
  compact,
  isUuid,
  mapAssignment
} = require('../utils/supabaseRecords');

const VALID_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];

const sendError = (res, error, fallback = 'Server error') => {
  const status = /not found|invalid|required|already|capacity|violates|duplicate/i.test(error.message || '')
    ? 400
    : 500;

  return res.status(status).json({
    success: false,
    message: error.code === '23505' ? 'This assignment already exists' : error.message || fallback,
    data: null
  });
};

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value.id || value._id || '');
  return String(value);
};

const fetchRowsById = async (table, ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return {};

  const { data, error } = await getSupabase()
    .from(table)
    .select('*')
    .in('id', uniqueIds);

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
};

const populateAssignments = async (assignments) => {
  const events = await fetchRowsById('events', assignments.map((a) => a.event_id));
  const volunteers = await fetchRowsById('volunteers', assignments.map((a) => a.volunteer_id));

  return assignments.map((assignment) =>
    mapAssignment(assignment, events[assignment.event_id], volunteers[assignment.volunteer_id])
  );
};

const ensureAssignmentTargets = async (eventId, volunteerId, assignmentId = null) => {
  if (!isUuid(eventId)) throw new Error('Invalid event ID');
  if (!isUuid(volunteerId)) throw new Error('Invalid volunteer ID');

  const supabase = getSupabase();
  const [{ data: event, error: eventError }, { data: volunteer, error: volunteerError }] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('volunteers').select('*').eq('id', volunteerId).single()
  ]);

  if (eventError || !event) throw new Error('Event not found');
  if (volunteerError || !volunteer) throw new Error('Volunteer not found');

  const duplicateQuery = supabase
    .from('assignments')
    .select('id')
    .eq('event_id', eventId)
    .eq('volunteer_id', volunteerId)
    .neq('status', 'cancelled');

  const { data: duplicates, error: duplicateError } = assignmentId
    ? await duplicateQuery.neq('id', assignmentId)
    : await duplicateQuery;

  if (duplicateError) throw duplicateError;
  if ((duplicates || []).length) throw new Error('Volunteer is already assigned to this event');

  const { count, error: countError } = await supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .neq('status', 'cancelled');

  if (countError) throw countError;
  if ((count || 0) >= (event.capacity || 50)) throw new Error('Event is at full capacity');
};

const getAllAssignments = async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: await populateAssignments(data || [])
    });
  } catch (error) {
    console.error('Error in getAllAssignments controller:', error);
    return sendError(res, error, 'Failed to retrieve assignments');
  }
};

const createAssignment = async (req, res) => {
  try {
    const payload = assignmentPayload(req.body);
    await ensureAssignmentTargets(payload.event_id, payload.volunteer_id);

    const { data, error } = await getSupabase()
      .from('assignments')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const [assignment] = await populateAssignments([data]);

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error in createAssignment controller:', error);
    return sendError(res, error, 'Failed to create assignment');
  }
};

const getAssignmentsByVolunteer = async (req, res) => {
  try {
    if (!isUuid(req.params.volunteerId)) throw new Error('Invalid volunteer ID');

    const { data, error } = await getSupabase()
      .from('assignments')
      .select('*')
      .eq('volunteer_id', req.params.volunteerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: await populateAssignments(data || [])
    });
  } catch (error) {
    console.error('Error in getAssignmentsByVolunteer controller:', error);
    return sendError(res, error, 'Failed to retrieve assignments');
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const updates = { status };
    if (status === 'in-progress') {
      updates.started_at = new Date().toISOString();
      updates.completed_at = null;
      updates.hours_worked = 0;
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    if (status === 'pending') {
      updates.started_at = null;
      updates.completed_at = null;
      updates.hours_worked = 0;
    }

    const { data: existing, error: existingError } = await getSupabase()
      .from('assignments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (existingError || !existing) throw new Error('Assignment not found');

    if (status === 'completed' && existing.started_at) {
      updates.hours_worked = Math.max(
        0,
        (new Date(updates.completed_at) - new Date(existing.started_at)) / (1000 * 60 * 60)
      );
    }

    const { data, error } = await getSupabase()
      .from('assignments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const [assignment] = await populateAssignments([data]);
    return res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error in updateAssignmentStatus:', error);
    return sendError(res, error);
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('assignments').select('status');
    if (error) throw error;

    const assignments = data || [];
    const stats = assignments.reduce(
      (acc, assignment) => {
        acc.total += 1;
        if (assignment.status === 'pending') acc.pending += 1;
        if (assignment.status === 'in-progress') acc.inProgress += 1;
        if (assignment.status === 'completed') acc.completed += 1;
        if (assignment.status === 'cancelled') acc.cancelled += 1;
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 }
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in getAssignmentStats:', error);
    return sendError(res, error);
  }
};

const updateAssignment = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) throw new Error('Invalid assignment ID');

    const { data: existing, error: existingError } = await getSupabase()
      .from('assignments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (existingError || !existing) throw new Error('Assignment not found');

    const payload = assignmentPayload(req.body);
    const eventId = payload.event_id || existing.event_id;
    const volunteerId = payload.volunteer_id || existing.volunteer_id;

    if (eventId !== existing.event_id || volunteerId !== existing.volunteer_id) {
      await ensureAssignmentTargets(eventId, volunteerId, req.params.id);
    }

    const updates = compact({
      ...payload,
      event_id: eventId,
      volunteer_id: volunteerId
    });

    const { data, error } = await getSupabase()
      .from('assignments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const [assignment] = await populateAssignments([data]);
    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error in updateAssignment:', error);
    return sendError(res, error);
  }
};

const deleteAssignment = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) throw new Error('Invalid assignment ID');

    const { error } = await getSupabase()
      .from('assignments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    return sendError(res, error);
  }
};

module.exports = {
  getAllAssignments,
  createAssignment,
  getAssignmentsByVolunteer,
  updateAssignmentStatus,
  getAssignmentStats,
  deleteAssignment,
  updateAssignment
};
