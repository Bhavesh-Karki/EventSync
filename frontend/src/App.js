import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import AdminDashboard from './components/AdminDashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import Login from './components/Login';

function App() {
  const [userRole, setUserRole] = React.useState(null);
  const [userId, setUserId] = React.useState(null);

  const handleLogin = (role, id) => {
    setUserRole(role);
    setUserId(id);
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserId(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              userRole ? (
                userRole === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/volunteer" />
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
              userRole === 'volunteer' ? (
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
