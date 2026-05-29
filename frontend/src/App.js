import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import AdminDashboard from './components/AdminDashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import Login from './components/Login';

function App() {
  const [userRole, setUserRole] = React.useState(() => localStorage.getItem('eventSyncRole'));
  const [userId, setUserId] = React.useState(() => localStorage.getItem('eventSyncUserId'));

  const handleLogin = (role, id) => {
    setUserRole(role);
    setUserId(id);
    localStorage.setItem('eventSyncRole', role);
    if (id) {
      localStorage.setItem('eventSyncUserId', id);
    } else {
      localStorage.removeItem('eventSyncUserId');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserId(null);
    localStorage.removeItem('eventSyncRole');
    localStorage.removeItem('eventSyncUserId');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              userRole ? (
                userRole === 'admin' ? <Navigate to="/admin" /> : (
                  userId ? <Navigate to="/volunteer" /> : <Login onLogin={handleLogin} />
                )
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              userRole === 'admin' ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          <Route 
            path="/volunteer" 
            element={
              userRole === 'volunteer' && userId ? (
                <VolunteerDashboard volunteerId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
