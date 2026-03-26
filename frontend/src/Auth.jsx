import React, { useState } from 'react';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    age: '',
    gender: '',
    fitness_goal: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Success!');
        if (isLogin) {
          // Store token if needed
          localStorage.setItem('token', data.token);
          setTimeout(() => {
            window.location.href = '/dashboard'; // Redirect to dashboard
          }, 1500);
        } else {
          setFormData({
            email: '',
            password: '',
            full_name: '',
            phone: '',
            age: '',
            gender: '',
            fitness_goal: ''
          });
          setIsLogin(true);
          setMessage('Account Created Successfully');
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side auth-info">
          <div className="auth-info-content">
            <h1>Gym Management</h1>
            <p>Start your fitness journey with our sleek dashboard and workout tracking.</p>
            <ul>
              <li>Member analytics</li>
              <li>Attendance recording</li>
              <li>Goal tracking</li>
            </ul>
          </div>
        </div>

        <div className="auth-side auth-panel">
          <div className="auth-box">

            <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            // Login Form
            <>
              <h2>Welcome Back!</h2>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          ) : (
            // Sign Up Form
            <>
              <h2>Create Account</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Your age"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Fitness Goal</label>
                <textarea
                  name="fitness_goal"
                  value={formData.fitness_goal}
                  onChange={handleInputChange}
                  placeholder="What are your fitness goals?"
                  rows="3"
                />
              </div>
            </>
          )}

          {message && (
            <div className={`message ${message.includes('Error') || message.includes('error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>

          {isLogin && (
            <p className="auth-toggle">
              Don't have an account? 
              <button 
                type="button" 
                className="toggle-link" 
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </p>
          )}

          {!isLogin && (
            <p className="auth-toggle">
              Already have an account? 
              <button 
                type="button" 
                className="toggle-link" 
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  </div>
</div>
  );
}

export default Auth;