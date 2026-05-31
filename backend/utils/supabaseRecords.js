const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => UUID_RE.test(String(value || ''));

const compact = (value) => {
  Object.keys(value).forEach((key) => value[key] === undefined && delete value[key]);
  return value;
};

const toIsoDate = (value) => {
  if (!value) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const mapEvent = (row = {}) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  date: row.date,
  location: row.location,
  description: row.description,
  status: row.status || 'upcoming',
  volunteers: row.volunteers || [],
  volunteersCount: Array.isArray(row.volunteers) ? row.volunteers.length : 0,
  capacity: row.capacity || 50,
  organizer: row.organizer || { name: 'Admin' },
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapVolunteer = (row = {}, eventsAssigned = []) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  skills: Array.isArray(row.skills) ? row.skills : [],
  availability: row.availability || 'flexible',
  status: row.status || 'active',
  eventsAssigned,
  eventsCount: eventsAssigned.length,
  address: row.address || null,
  emergencyContact: row.emergency_contact || null,
  dateJoined: row.date_joined,
  totalHours: row.total_hours || 0,
  rating: row.rating || 5,
  notes: row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAssignment = (row = {}, event = null, volunteer = null) => ({
  id: row.id,
  _id: row.id,
  event: event ? mapEvent(event) : row.event_id,
  volunteer: volunteer ? mapVolunteer(volunteer) : row.volunteer_id,
  eventName: event?.name,
  volunteerName: volunteer?.name,
  duty: row.duty,
  schedule: row.schedule,
  status: row.status || 'pending',
  priority: row.priority || 'medium',
  notes: row.notes || '',
  startedAt: row.started_at,
  completedAt: row.completed_at,
  hoursWorked: row.hours_worked || 0,
  feedback: row.feedback || null,
  checkedIn: Boolean(row.checked_in),
  checkInTime: row.check_in_time,
  checkOutTime: row.check_out_time,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const eventPayload = (body = {}) => compact({
  name: body.name,
  date: toIsoDate(body.date),
  location: body.location,
  description: body.description,
  status: body.status,
  capacity: body.capacity,
  organizer: body.organizer || (body.organizerName || body.organizerEmail ? {
    name: body.organizerName || 'Admin',
    email: body.organizerEmail || null
  } : undefined)
});

const volunteerPayload = (body = {}) => compact({
  name: body.name,
  email: typeof body.email === 'string' ? body.email.toLowerCase().trim() : body.email,
  phone: body.phone,
  skills: Array.isArray(body.skills) ? body.skills : [],
  availability: body.availability,
  status: body.status,
  address: body.address || null,
  emergency_contact: body.emergencyContact || body.emergency_contact || null,
  total_hours: body.totalHours,
  rating: body.rating,
  notes: body.notes
});

const assignmentPayload = (body = {}) => compact({
  event_id: body.event || body.eventId || body.event_id,
  volunteer_id: body.volunteer || body.volunteerId || body.volunteer_id,
  duty: body.duty,
  schedule: body.schedule,
  status: body.status,
  priority: body.priority,
  notes: body.notes
});

module.exports = {
  compact,
  isUuid,
  mapEvent,
  mapVolunteer,
  mapAssignment,
  eventPayload,
  volunteerPayload,
  assignmentPayload
};
