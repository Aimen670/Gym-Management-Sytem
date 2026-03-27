import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 new state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('adminToken', data.token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side auth-info admin-info">
          <div className="auth-info-content">
            <h1>Admin Portal</h1>
            <p>Log in to your admin account and manage the gym.</p>
            <ul>
              <li>Manage members</li>
              <li>View reports</li>
              <li>Manage staff</li>
            </ul>
            <div className="switch-role">
              <p>Are you a member?</p>
              <Link to="/login" className="switch-link">
                Go to Member Login →
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-side auth-panel">
          <div className="auth-box">
            <h2>Admin Login</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your admin email"
                />
              </div>

              <div className="form-group password-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account?{' '}
              <Link to="/admin-signup" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
