import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    userType: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateEmail = (email) => {
    // Check if email ends with @bu.edu
    return email.endsWith('@bu.edu');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate BU email
    if (!validateEmail(formData.email)) {
      setError('Please use your BU email address (@bu.edu)');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.userType
        );
      }

      if (result.success) {
        // Show success message
        const welcomeMessage = result.message 
          ? result.message 
          : `${isLogin ? 'Login' : 'Registration'} successful! Welcome to Spark Bytes, ${result.user.name}!`;
        
        alert(welcomeMessage);
        
        // Redirect to events page after successful login/registration
        navigate('/events');
      } else {
        setError(result.error);
      }
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      name: '',
      userType: 'student'
    });
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome to Spark Bytes</h1>
          <img src="/sparkbytes.png" alt="Spark Bytes Logo" className="logo-image" />
        </div>
        <footer className="login-footer">
          <p>© 2025 Spark Bytes | Boston University</p>
        </footer>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-section">
              <div className="logo-icon">⚡</div>
              <h1 className="logo-text">Spark Bytes</h1>
            </div>
            <p className="tagline">Boston University's Food Sharing Platform</p>
          </div>

          <div className="login-tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => isLogin ? null : toggleMode()}
            >
              Login
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => !isLogin ? null : toggleMode()}
            >
              Sign Up
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">BU Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourname@bu.edu"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength="6"
              />
            </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="userType">I am a</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="student">Student</option>
                <option value="organizer">Event Organizer</option>
              </select>
            </div>
          )}            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isLogin ? 'Login' : 'Create Account')}
            </button>

            {isLogin && (
              <div className="forgot-password">
                <a href="#forgot">Forgot password?</a>
              </div>
            )}
          </form>

          <div className="info-section">
            <div className="info-card">
              <div className="info-icon">🍕</div>
              <p>Find free food from campus events</p>
            </div>
            <div className="info-card">
              <div className="info-icon">♻️</div>
              <p>Help reduce food waste at BU</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📍</div>
              <p>Get real-time event notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
