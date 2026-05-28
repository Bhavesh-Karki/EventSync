import React, { useState, useEffect } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const response = await api.get('/api/volunteers');
      if (response.data.success && Array.isArray(response.data.data)) {
        setVolunteers(response.data.data);
      } else {
        setVolunteers([]);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setVolunteers([]);
    }
  };

  const handleAdminLogin = () => {
    onLogin('admin', null);
  };

  const handleVolunteerLogin = () => {
    if (selectedVolunteer) {
      onLogin('volunteer', selectedVolunteer);
    } else {
      alert('Please select a volunteer');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2><i className="fas fa-hands-helping"></i> EventSync</h2>
        <p className="login-subtitle">
          Select your role to continue
        </p>

        <div className="form-group">
          <label><i className="fas fa-user-circle"></i> Volunteer Profile</label>
          <select
            value={selectedVolunteer}
            onChange={(e) => setSelectedVolunteer(e.target.value)}
          >
            <option value="">Select your account</option>
            {(volunteers || []).map(volunteer => {
              const id = volunteer.id || volunteer._id;
              if (!id) return null;
              return (
                <option key={id} value={String(id)}>
                  {volunteer.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="role-buttons">
          <button
            className="role-button volunteer"
            onClick={handleVolunteerLogin}
            disabled={!selectedVolunteer}
          >
            <i className="fas fa-user"></i> Volunteer Login
          </button>

          <div className="divider"><span>OR</span></div>

          <button
            className="role-button admin"
            onClick={handleAdminLogin}
          >
            <i className="fas fa-user-shield"></i> Admin Access
          </button>
        </div>

        <p className="login-footer">
          <i className="fas fa-info-circle"></i> Demo Credentials - No Password Needed
        </p>
      </div>
    </div>
  );
}

export default Login;
