import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import './Login.css';

function Login({ onLogin }) {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSelect = (id) => {
    setSelectedVolunteer(id);
    setDropdownOpen(false);
  };

  const handleAdminLogin = () => {
    onLogin('admin', null);
  };

  const handleVolunteerLogin = () => {
    if (selectedVolunteer) {
      onLogin('volunteer', selectedVolunteer);
    }
  };

  const selectedName = volunteers.find(v => {
    const id = v.id || v._id;
    return String(id) === String(selectedVolunteer);
  })?.name;

  return (
    <div className="login-container">
      <div className="login-box">
        <h2><i className="fas fa-hands-helping"></i> EventSync</h2>
        <p className="login-subtitle">Select your role to continue</p>

        {/* Custom dropdown — stays inside the card, no native popup overflow */}
        <label className="login-label">
          <i className="fas fa-user-circle"></i> Volunteer Profile
        </label>
        <div className="custom-select-wrapper" ref={dropdownRef}>
          <div
            className={`custom-select-trigger ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className={selectedName ? '' : 'placeholder'}>
              {selectedName || 'Select your account'}
            </span>
            <i className="fas fa-chevron-down chevron"></i>
          </div>

          {dropdownOpen && (
            <div className="custom-select-options">
              <div className="custom-select-option disabled">
                Select your account
              </div>
              {(volunteers || []).map(volunteer => {
                const id = volunteer.id || volunteer._id;
                if (!id) return null;
                return (
                  <div
                    key={id}
                    className={`custom-select-option ${String(id) === String(selectedVolunteer) ? 'selected' : ''}`}
                    onClick={() => handleSelect(String(id))}
                  >
                    {volunteer.name}
                  </div>
                );
              })}
            </div>
          )}
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