import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/trainers');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load trainers');
        }
        setTrainers(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    loadTrainers();
  }, []);

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
            <div className="dashboard-switch">
              <p>Are you an admin?</p>
              <Link to="/admin-login" className="dashboard-link">
                Go to Admin Panel →
              </Link>
            </div>
          </div>
        </div>

        <div className="dashboard-side dashboard-panel">
          <div className="dashboard-box">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Login Successful!</h2>
              <p>You are now logged in to your account.</p>
            </div>
            <div className="trainer-section">
              <h3>Meet Your Trainers</h3>
              <p className="trainer-subtitle">Browse trainers and choose a specialization.</p>

              {error && <div className="error-message">{error}</div>}

              <div className="trainer-list">
                {trainers.length === 0 ? (
                  <p className="trainer-empty">No trainers available right now.</p>
                ) : (
                  trainers.map((trainer) => (
                    <div key={trainer.trainer_id} className="trainer-card">
                      <div>
                        <h4>{trainer.name}</h4>
                        <p>{trainer.specialization || 'General Trainer'}</p>
                        <div className="trainer-meta">
                          {trainer.phone && <span>{trainer.phone}</span>}
                          {trainer.email && <span>{trainer.email}</span>}
                          {trainer.experience_years !== null && trainer.experience_years !== undefined && (
                            <span>{trainer.experience_years} yrs</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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