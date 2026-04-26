import React from 'react';
import { Link } from 'react-router-dom';
import './Splash.css';

function Splash() {
  return (
    <div className="splash-page">
      <div className="splash-orbit" aria-hidden="true"></div>
      <div className="splash-glow" aria-hidden="true"></div>

      <div className="splash-card">
        <p className="splash-tag">Gym Management Suite</p>
        <h1 className="splash-title">Gym_Arc</h1>
        <p className="splash-subtitle">
          Built for strong routines, smart tracking, and a better member experience.
        </p>

        <div className="splash-actions">
          <Link to="/signup" className="splash-btn primary">
            Create Account
          </Link>
          <Link to="/login" className="splash-btn ghost">
            Sign In
          </Link>
        </div>

        <div className="splash-footer">
          <span>Admin?</span>
          <Link to="/admin-login" className="splash-link">
            Go to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Splash;
