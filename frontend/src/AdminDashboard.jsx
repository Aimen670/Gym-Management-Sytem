import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function AdminDashboard() {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card admin-dashboard">
        <div className="dashboard-side dashboard-info admin-info-dashboard">
          <div className="dashboard-info-content">
            <h1>Admin Portal</h1>
            <p>You have successfully logged in to the Gym Management Admin Dashboard.</p>
            <ul>
              <li>Manage members</li>
              <li>View reports</li>
              <li>Manage staff</li>
            </ul>
            <div className="dashboard-switch">
              <p>Are you a member?</p>
              <Link to="/login" className="dashboard-link">
                Go to Member Area →
              </Link>
            </div>
          </div>
        </div>

        <div className="dashboard-side dashboard-panel">
          <div className="dashboard-box">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Admin Login Successful!</h2>
              <p>You are now logged in to your admin account.</p>
            </div>

            <div className="dashboard-content">
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
