import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login, register, verifyEmail, resendVerificationCode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    userType: "student", // Default to student, no user selection needed
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateEmail = (email) => {
    // Check if email ends with @bu.edu
    return email.endsWith("@bu.edu");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate BU email
    if (!validateEmail(formData.email)) {
      setError("Please use your BU email address (@bu.edu)");
      return;
    }

    // Validate password confirmation for signup
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await login(formData.email, formData.password);
        
        if (result.success) {
          alert(`Login successful! Welcome back, ${result.user.name}!`);
          navigate("/events");
        } else {
          setError(result.error);
        }
      } else {
        // Registration - send verification code
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.userType
        );

        if (result.success && result.needsVerification) {
          // Show verification code input
          setPendingEmail(formData.email);
          setShowVerification(true);
          alert(result.message);
        } else if (result.success) {
          // Direct success (Supabase flow)
          alert(result.message || "Registration successful!");
          navigate("/events");
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");

    if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyEmail(pendingEmail, verificationCode);

      if (result.success) {
        alert(`${result.message} Welcome to Spark Bytes, ${result.user.name}!`);
        navigate("/events");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await resendVerificationCode(pendingEmail);

      if (result.success) {
        alert(result.message);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setShowVerification(false);
    setVerificationCode("");
    setPendingEmail("");
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      userType: "student", // Default to student, no user selection needed
    });
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="welcome-section">
          <h1 className="login-welcome-title">Welcome to Spark! Bytes</h1>
          <img
            src="/sparkbytes.png"
            alt="Spark Bytes Logo"
            className="logo-image"
          />
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
              <h1 className="logo-text">Spark! Bytes</h1>
            </div>
            <p className="tagline">Boston University's Food Sharing Platform</p>
          </div>

          <div className="login-tabs">
            <button
              className={`tab ${isLogin ? "active" : ""}`}
              onClick={() => (isLogin ? null : toggleMode())}
            >
              Login
            </button>
            <button
              className={`tab ${!isLogin ? "active" : ""}`}
              onClick={() => (!isLogin ? null : toggleMode())}
            >
              Sign Up
            </button>
          </div>

          {showVerification ? (
            // Verification Code Form
            <form className="login-form" onSubmit={handleVerification}>
              <div className="verification-message">
                <p>📧 We've sent a verification code to:</p>
                <strong>{pendingEmail}</strong>
                <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                  Please check your email and enter the 6-digit code below.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError("");
                  }}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength="6"
                  style={{ 
                    fontSize: "24px", 
                    letterSpacing: "10px", 
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>
              <div className="resend-code">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4CAF50",
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginTop: "10px"
                  }}
                >
                  Didn't receive the code? Resend
                </button>
              </div>
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={toggleMode}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  ← Back to Sign Up
                </button>
              </div>
            </form>
          ) : (
            // Regular Login/Sign Up Form
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
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required={!isLogin}
                  minLength="6"
                />
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
            </button>
            {isLogin && (
              <div className="forgot-password">
                <a href="#forgot">Forgot password?</a>
              </div>
            )}
          </form>
          )}

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
