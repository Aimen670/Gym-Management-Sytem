import React from 'react';
import './Dashboard.css';

function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-side dashboard-info">
          <div className="dashboard-info-content">
            <h1>Welcome Back!</h1>
            <p>You have successfully logged in to your Gym Management Dashboard.</p>
            <ul>
              <li>Track your workouts</li>
              <li>Monitor your progress</li>
              <li>Achieve your fitness goals</li>
            </ul>
          </div>
        </div>

        <div className="dashboard-side dashboard-panel">
          <div className="dashboard-box">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Login Successful!</h2>
              <p>You are now logged in to your account.</p>
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

export default Dashboard;