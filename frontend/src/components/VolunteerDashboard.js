import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

function VolunteerDashboard({ volunteerId, onLogout }) {
  const [volunteer, setVolunteer] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showMessage = useCallback((msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const fetchVolunteerData = useCallback(async () => {
    if (!volunteerId) {
      setVolunteer(null);
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [volunteerRes, assignmentsRes] = await Promise.allSettled([
        api.get(`/api/volunteers/${volunteerId}`),
        api.get(`/api/assignments/volunteer/${volunteerId}`)
      ]);

      if (volunteerRes.status === 'fulfilled' && volunteerRes.value.data.success) {
        setVolunteer(volunteerRes.value.data.data);
      } else {
        setVolunteer(null);
        showMessage('Volunteer profile could not be loaded', 'error');
      }

      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.data.success) {
        setAssignments(Array.isArray(assignmentsRes.value.data.data) ? assignmentsRes.value.data.data : []);
      } else {
        setAssignments([]);
        showMessage('Assignments could not be loaded', 'error');
      }
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage, volunteerId]);

  useEffect(() => {
    fetchVolunteerData();
  }, [fetchVolunteerData]);

  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      const response = await api.patch(
        `/api/assignments/${assignmentId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        showMessage('Status updated successfully!');
        fetchVolunteerData();
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error updating status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="main-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="dashboard">
        <div className="main-content">
          <div className="error-message">Volunteer not found</div>
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const inProgressAssignments = assignments.filter(a => a.status === 'in-progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const getAssignmentId = (assignment) => assignment._id || assignment.id;
  const getAssignmentEventName = (assignment) => assignment.eventName || assignment.event?.name || 'Event unavailable';
  const volunteerSkills = Array.isArray(volunteer.skills) ? volunteer.skills : [];

  return (
    <div className={`dashboard${sidebarOpen ? ' sidebar-open' : ''}`}>
      {/* Hamburger button — visible on mobile only, hidden when sidebar is open */}
      <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <i className="fas fa-bars"></i>
      </button>

      {/* Backdrop overlay for mobile sidebar */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <i className="fas fa-times"></i>
        </button>
        <h2><i className="fas fa-handshake"></i> EventSync</h2>
        <div className="volunteer-profile-box">
          <p className="welcome-text">Welcome back,</p>
          <p className="volunteer-name">{volunteer.name}</p>
          <p className="volunteer-email">{volunteer.email}</p>
        </div>
        <ul className="nav-menu">
          <li className="nav-item active">
            <i className="fas fa-clipboard-list"></i> My Assignments
        </li>
        </ul>
        <button className="logout-button" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {message && (
          <div className={`message ${message.type}`}>
            <i className={`fas ${message.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            {message.text}
          </div>
        )}

        <div className="content-header">
          <h1>My Assignments</h1>
          <p>View and manage your event assignments</p>
        </div>

        {/* Statistics Cards */}
        <div className="cards-container">
          <div className="stat-card">
            <h3><i className="fas fa-list-ul"></i> Total Tasks</h3>
            <div className="number">{assignments.length}</div>
          </div>
          <div className="stat-card">
            <h3><i className="fas fa-clock"></i> Pending</h3>
            <div className="number">{pendingAssignments.length}</div>
          </div>
          <div className="stat-card">
            <h3><i className="fas fa-spinner"></i> In Progress</h3>
            <div className="number">{inProgressAssignments.length}</div>
          </div>
          <div className="stat-card">
            <h3><i className="fas fa-check-double"></i> Completed</h3>
            <div className="number">{completedAssignments.length}</div>
          </div>
        </div>

        {/* Volunteer Profile */}
        <div className="form-container">
          <div className="form-container">
            <h3><i className="fas fa-id-card"></i> Personal Information</h3>
            <div className="profile-info-grid">
              <div className="profile-detail">
                <p><i className="fas fa-user-tag"></i> <strong>Name:</strong> {volunteer.name}</p>
                <p><i className="fas fa-envelope"></i> <strong>Email:</strong> {volunteer.email}</p>
                <p><i className="fas fa-phone"></i> <strong>Phone:</strong> {volunteer.phone}</p>
              </div>
              <div className="profile-detail">
                <p><strong><i className="fas fa-star"></i> My Skills:</strong></p>
                <div className="skills-list">
                  {volunteerSkills.length > 0 ? (
                    volunteerSkills.map((skill, index) => (
                      <span key={index} className="skill-badge">{skill}</span>
                    ))
                  ) : (
                    <span className="no-data">No skills listed</span>
                  )}
                </div>
                <p className="profile-status">
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge status-${volunteer.status}`}>
                    {volunteer.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="table-container">
          <h3>My Event Assignments</h3>
          {assignments.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Duty</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={getAssignmentId(assignment)}>
                    <td>
                      <strong>{getAssignmentEventName(assignment)}</strong>
                      {assignment.notes && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Notes: {assignment.notes}
                        </div>
                      )}
                    </td>
                    <td>{assignment.duty}</td>
                    <td>{assignment.schedule}</td>
                    <td>
                      <span className={`status-badge status-${assignment.status}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {assignment.status === 'pending' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpdateStatus(getAssignmentId(assignment), 'in-progress')}
                          >
                            <i className="fas fa-play"></i> Start Task
                          </button>
                        )}
                        {assignment.status === 'in-progress' && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleUpdateStatus(getAssignmentId(assignment), 'completed')}
                          >
                            <i className="fas fa-check"></i> Mark Complete
                          </button>
                        )}
                        {assignment.status === 'completed' && (
                          <>
                            <span className="completed-text">
                              <i className="fas fa-check-circle"></i> Completed
                            </span>
                            <button
                              className="btn btn-warning"
                              onClick={() => handleUpdateStatus(getAssignmentId(assignment), 'in-progress')}
                              title="Undo completion"
                            >
                              <i className="fas fa-undo"></i> Incomplete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>No assignments yet</h3>
              <p>You don't have any event assignments at the moment.</p>
            </div>
          )}
        </div>

        {/* Pending Tasks Section */}
        {pendingAssignments.length > 0 && (
          <div className="form-container" style={{ background: '#fff3cd', borderLeft: '4px solid #f39c12' }}>
            <h3 style={{ color: '#f39c12' }}>⚠️ Pending Tasks ({pendingAssignments.length})</h3>
            <p>You have {pendingAssignments.length} pending task(s) that need attention.</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {pendingAssignments.map(assignment => (
                <li key={getAssignmentId(assignment)} style={{ marginBottom: '5px' }}>
                  <strong>{getAssignmentEventName(assignment)}</strong> - {assignment.duty}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedAssignments.length > 0 && (
          <div className="form-container" style={{ background: '#d4edda', borderLeft: '4px solid #2ecc71' }}>
            <h3 style={{ color: '#2ecc71' }}>✅ Completed Tasks ({completedAssignments.length})</h3>
            <p>Great job! You've completed {completedAssignments.length} task(s).</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerDashboard;