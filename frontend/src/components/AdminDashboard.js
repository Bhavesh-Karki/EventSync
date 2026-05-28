import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

function AdminDashboard({ onLogout }) {
  const [activeView, setActiveView] = useState('overview');
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    location: '',
    description: ''
  });

  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    event: '',
    volunteer: '',
    duty: '',
    schedule: ''
  });

  const [editEventId, setEditEventId] = useState(null);
  const [editVolunteerId, setEditVolunteerId] = useState(null);
  const [editAssignmentId, setEditAssignmentId] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, volunteersRes, assignmentsRes, statsRes] = await Promise.allSettled([
        api.get('/api/events'),
        api.get('/api/volunteers'),
        api.get('/api/assignments'),
        api.get('/api/assignments/stats')
      ]);

      // Handle events response (API now always returns .id on each item)
      if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.success) {
        const eventsData = eventsRes.value.data.data;
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        if (eventsRes.status === 'rejected') console.error('Error fetching events:', eventsRes.reason);
        setEvents([]);
      }

      // Handle volunteers response
      if (volunteersRes.status === 'fulfilled' && volunteersRes.value.data?.success) {
        const volunteersData = volunteersRes.value.data.data;
        setVolunteers(Array.isArray(volunteersData) ? volunteersData : []);
      } else {
        if (volunteersRes.status === 'rejected') console.error('Error fetching volunteers:', volunteersRes.reason);
        setVolunteers([]);
      }

      // Handle assignments response
      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.data?.success) {
        const arr = assignmentsRes.value.data.data;
        setAssignments(Array.isArray(arr) ? arr : []);
      } else {
        if (assignmentsRes.status === 'rejected') console.error('Error fetching assignments:', assignmentsRes.reason);
        setAssignments([]);
      }

      // Handle stats response (optional - don't fail if stats fail)
      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.data);
      } else if (statsRes.status === 'rejected') {
        console.error('Error fetching stats:', statsRes.reason);
        // Set default stats if stats endpoint fails
        setStats({ total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 });
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
      showMessage('Error loading some data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch when switching to Assignments so dropdowns have latest events/volunteers
  useEffect(() => {
    if (activeView === 'assignments') {
      fetchAllData();
    }
  }, [activeView, fetchAllData]);

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 5000);
  };

  // Event Handlers
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      if (editEventId) {
        const response = await api.put(`/api/events/${editEventId}`, eventForm);
        if (response.data.success) {
          showMessage('Event updated successfully!');
          setEventForm({ name: '', date: '', location: '', description: '' });
          setEditEventId(null);
          fetchAllData();
        }
      } else {
        const response = await api.post('/api/events', eventForm);
        if (response.data.success) {
          showMessage('Event created successfully!');
          setEventForm({ name: '', date: '', location: '', description: '' });
          fetchAllData();
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error saving event';
      showMessage(errorMsg, 'error');
    }
  };

  const startEditEvent = (event) => {
    setEditEventId(event._id || event.id);
    setEventForm({
      name: event.name,
      date: new Date(event.date).toISOString().split('T')[0],
      location: event.location,
      description: event.description
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    try {
      const volunteerData = {
        ...volunteerForm,
        skills: typeof volunteerForm.skills === 'string'
          ? volunteerForm.skills.split(',').map(s => s.trim())
          : volunteerForm.skills
      };

      if (editVolunteerId) {
        const response = await api.put(`/api/volunteers/${editVolunteerId}`, volunteerData);
        if (response.data.success) {
          showMessage('Volunteer updated successfully!');
          setVolunteerForm({ name: '', email: '', phone: '', skills: '' });
          setEditVolunteerId(null);
          fetchAllData();
        }
      } else {
        const response = await api.post('/api/volunteers', volunteerData);
        if (response.data.success) {
          showMessage('Volunteer added successfully!');
          setVolunteerForm({ name: '', email: '', phone: '', skills: '' });
          fetchAllData();
        }
      }
    } catch (error) {
      console.error('Error saving volunteer:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error saving volunteer';
      showMessage(errorMsg, 'error');
    }
  };

  const startEditVolunteer = (volunteer) => {
    setEditVolunteerId(volunteer._id || volunteer.id);
    setVolunteerForm({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      skills: Array.isArray(volunteer.skills) ? volunteer.skills.join(', ') : volunteer.skills
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      if (editAssignmentId) {
        const response = await api.patch(`/api/assignments/${editAssignmentId}/status`, { status: assignmentForm.status }); // Simplified for now, but usually assignments have more fields
        // Since the user might want to edit duty/schedule, let's assume they want full update.
        // Wait, I only added patch status in controller. Let's check if I have full update.
        // I'll add full update to assignment controller in a moment. 

        const updateRes = await api.put(`/api/assignments/${editAssignmentId}`, assignmentForm);
        if (updateRes.data.success) {
          showMessage('Assignment updated successfully!');
          setAssignmentForm({ event: '', volunteer: '', duty: '', schedule: '' });
          setEditAssignmentId(null);
          fetchAllData();
        }
      } else {
        const response = await api.post('/api/assignments', assignmentForm);
        if (response.data.success) {
          showMessage('Assignment created successfully!');
          setAssignmentForm({ event: '', volunteer: '', duty: '', schedule: '' });
          fetchAllData();
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error saving assignment';
      showMessage(errorMsg, 'error');
    }
  };

  const startEditAssignment = (assignment) => {
    setEditAssignmentId(assignment._id || assignment.id);
    setAssignmentForm({
      event: assignment.event?._id || assignment.event,
      volunteer: assignment.volunteer?._id || assignment.volunteer,
      duty: assignment.duty,
      schedule: assignment.schedule
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/api/events/${id}`);
        showMessage('Event deleted successfully!');
        fetchAllData();
      } catch (error) {
        showMessage('Error deleting event', 'error');
      }
    }
  };

  const handleDeleteVolunteer = async (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await api.delete(`/api/volunteers/${id}`);
        showMessage('Volunteer deleted successfully!');
        fetchAllData();
      } catch (error) {
        showMessage('Error deleting volunteer', 'error');
      }
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.delete(`/api/assignments/${id}`);
        showMessage('Assignment deleted successfully!');
        fetchAllData();
      } catch (error) {
        showMessage('Error deleting assignment', 'error');
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await api.post('/api/reports/volunteer-report');
      if (response.data.success) {
        showMessage('Report generated successfully!');
        alert(`Report saved to: ${response.data.data.filename}`);
      }
    } catch (error) {
      showMessage('Error generating report', 'error');
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2><i className="fas fa-hands-helping"></i> EventSync Admin</h2>
        <ul className="nav-menu">
          <li
            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <i className="fas fa-th-large"></i> Overview
          </li>
          <li
            className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
            onClick={() => setActiveView('events')}
          >
            <i className="fas fa-calendar-alt"></i> Manage Events
          </li>
          <li
            className={`nav-item ${activeView === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveView('volunteers')}
          >
            <i className="fas fa-user-friends"></i> Manage Volunteers
          </li>
          <li
            className={`nav-item ${activeView === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveView('assignments')}
          >
            <i className="fas fa-tasks"></i> Assignments
          </li>
          <li
            className={`nav-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            <i className="fas fa-file-contract"></i> Reports
          </li>
        </ul>
        <button className="logout-button" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>
            <i className={`fas ${message.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            {message.text}
          </div>
        )}

        {activeView === 'overview' && (
          <div>
            <div className="content-header">
              <h1>Dashboard Overview</h1>
              <p>Welcome to the Event Volunteer Coordination System</p>
            </div>

            {stats && (
              <div className="cards-container">
                <div className="stat-card">
                  <h3><i className="fas fa-calendar-alt"></i> Total Events</h3>
                  <div className="number">{events.length}</div>
                </div>
                <div className="stat-card">
                  <h3><i className="fas fa-user-friends"></i> Total Volunteers</h3>
                  <div className="number">{volunteers.length}</div>
                </div>
                <div className="stat-card">
                  <h3><i className="fas fa-tasks"></i> Total Assignments</h3>
                  <div className="number">{stats.total}</div>
                </div>
                <div className="stat-card">
                  <h3><i className="fas fa-check-circle"></i> Completed</h3>
                  <div className="number">{stats.completed}</div>
                </div>
              </div>
            )}

            <div className="table-container">
              <h3>Recent Assignments</h3>
              {assignments.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Volunteer</th>
                      <th>Duty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.slice(0, 5).map(assignment => (
                      <tr key={assignment._id || assignment.id}>
                        <td>{assignment.eventName || assignment.event?.name}</td>
                        <td>{assignment.volunteerName || assignment.volunteer?.name}</td>
                        <td>{assignment.duty}</td>
                        <td>
                          <span className={`status-badge status-${assignment.status}`}>
                            {assignment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No assignments yet</h3>
                  <p>Start by creating events and adding volunteers</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'events' && (
          <div>
            <div className="content-header">
              <h1>Manage Events</h1>
              <p>Create and manage events</p>
            </div>

            <div className="form-container">
              <h3>{editEventId ? 'Update Event' : 'Create New Event'}</h3>
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    value={eventForm.name}
                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    required
                  />
                </div>
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save"></i> {editEventId ? 'Update Event' : 'Create Event'}
                  </button>
                  {editEventId && (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => {
                        setEditEventId(null);
                        setEventForm({ name: '', date: '', location: '', description: '' });
                      }}
                    >
                      <i className="fas fa-times-circle"></i> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-container">
              <h3>All Events</h3>
              {events.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Volunteers</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => {
                      const eventId = event._id || event.id;
                      return (
                        <tr key={eventId}>
                          <td>{event.name}</td>
                          <td>{new Date(event.date).toLocaleDateString()}</td>
                          <td>{event.location}</td>
                          <td>
                            <span className={`status-badge status-${event.status}`}>
                              {event.status}
                            </span>
                          </td>
                          <td>{assignments.filter(a => {
                            const eId = a.event?._id || a.event?.id || a.event;
                            return String(eId) === String(eventId);
                          }).length}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-warning"
                                onClick={() => startEditEvent(event)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteEvent(eventId)}
                              >
                                <i className="fas fa-trash-alt"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No events yet</h3>
                  <p>Create your first event above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'volunteers' && (
          <div>
            <div className="content-header">
              <h1>Manage Volunteers</h1>
              <p>Add and manage volunteers</p>
            </div>

            <div className="form-container">
              <h3>{editVolunteerId ? 'Update Volunteer' : 'Add New Volunteer'}</h3>
              <form onSubmit={handleCreateVolunteer}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={volunteerForm.email}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={volunteerForm.phone}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={volunteerForm.skills}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, skills: e.target.value })}
                    placeholder="e.g. Event Planning, Photography, Catering"
                  />
                </div>
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-user-plus"></i> {editVolunteerId ? 'Update Volunteer' : 'Add Volunteer'}
                  </button>
                  {editVolunteerId && (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => {
                        setEditVolunteerId(null);
                        setVolunteerForm({ name: '', email: '', phone: '', skills: '' });
                      }}
                    >
                      <i className="fas fa-times-circle"></i> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-container">
              <h3>All Volunteers</h3>
              {volunteers.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Skills</th>
                      <th>Events</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map(volunteer => {
                      const volunteerId = volunteer._id || volunteer.id;
                      return (
                        <tr key={volunteerId}>
                          <td>{volunteer.name}</td>
                          <td>{volunteer.email}</td>
                          <td>{volunteer.phone}</td>
                          <td>{Array.isArray(volunteer.skills) ? volunteer.skills.join(', ') : ''}</td>
                          <td>{assignments.filter(a => {
                            const vId = a.volunteer?._id || a.volunteer?.id || a.volunteer;
                            return String(vId) === String(volunteerId);
                          }).length}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-warning"
                                onClick={() => startEditVolunteer(volunteer)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteVolunteer(volunteerId)}
                              >
                                <i className="fas fa-trash-alt"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No volunteers yet</h3>
                  <p>Add your first volunteer above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'assignments' && (
          <div>
            <div className="content-header">
              <h1>Manage Assignments</h1>
              <p>Assign volunteers to events</p>
            </div>

            <div className="form-container">
              <h3>{editAssignmentId ? 'Update Assignment' : 'Create New Assignment'}</h3>
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label>Select Event *</label>
                  <select
                    value={assignmentForm.event}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, event: e.target.value })}
                    required
                  >
                    <option value="">Choose an event</option>
                    {(events || []).map(event => {
                      const eventId = event.id || event._id;
                      if (!eventId) return null;
                      return (
                        <option key={eventId} value={String(eventId)}>
                          {event.name} - {event.date ? new Date(event.date).toLocaleDateString() : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Volunteer *</label>
                  <select
                    value={assignmentForm.volunteer}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, volunteer: e.target.value })}
                    required
                  >
                    <option value="">Choose a volunteer</option>
                    {(volunteers || []).map(volunteer => {
                      const volunteerId = volunteer.id || volunteer._id;
                      if (!volunteerId) return null;
                      return (
                        <option key={volunteerId} value={String(volunteerId)}>
                          {volunteer.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duty *</label>
                  <input
                    type="text"
                    value={assignmentForm.duty}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, duty: e.target.value })}
                    placeholder="e.g. Registration Desk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Schedule *</label>
                  <input
                    type="text"
                    value={assignmentForm.schedule}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, schedule: e.target.value })}
                    placeholder="e.g. 9:00 AM - 12:00 PM"
                    required
                  />
                </div>
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-plus-circle"></i> {editAssignmentId ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                  {editAssignmentId && (
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => {
                        setEditAssignmentId(null);
                        setAssignmentForm({ event: '', volunteer: '', duty: '', schedule: '' });
                      }}
                    >
                      <i className="fas fa-times-circle"></i> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="table-container">
              <h3>All Assignments</h3>
              {assignments.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Volunteer</th>
                      <th>Duty</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(assignment => (
                      <tr key={assignment._id || assignment.id}>
                        <td>{assignment.eventName || assignment.event?.name}</td>
                        <td>{assignment.volunteerName || assignment.volunteer?.name}</td>
                        <td>{assignment.duty}</td>
                        <td>{assignment.schedule}</td>
                        <td>
                          <span className={`status-badge status-${assignment.status}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td>{assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-warning"
                              onClick={() => startEditAssignment(assignment)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteAssignment(assignment._id || assignment.id)}
                            >
                              <i className="fas fa-trash-alt"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No assignments yet</h3>
                  <p>Create assignments above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'reports' && (
          <div>
            <div className="content-header">
              <h1>Generate Reports</h1>
              <p>Generate comprehensive volunteer reports</p>
            </div>

            <div className="form-container">
              <h3>Volunteer Report</h3>
              <p>Generate a complete report of all events, volunteers, and assignments.
                The report will be saved to the server's data directory.</p>
              <button
                className="btn btn-success"
                onClick={handleGenerateReport}
              >
                <i className="fas fa-download"></i> Generate PDF Report
              </button>
            </div>

            {stats && (
              <div className="table-container">
                <h3>Current Statistics</h3>
                <div className="cards-container">
                  <div className="stat-card">
                    <h3>Total Assignments</h3>
                    <div className="number">{stats.total}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Pending</h3>
                    <div className="number">{stats.pending}</div>
                  </div>
                  <div className="stat-card">
                    <h3>In Progress</h3>
                    <div className="number">{stats.inProgress}</div>
                  </div>
                  <div className="stat-card">
                    <h3>Completed</h3>
                    <div className="number">{stats.completed}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
