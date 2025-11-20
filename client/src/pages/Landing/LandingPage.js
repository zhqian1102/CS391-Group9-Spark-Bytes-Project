import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showFirstLine, setShowFirstLine] = useState(false);
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Show first line after a short delay
    const firstLineTimer = setTimeout(() => {
      setShowFirstLine(true);
    }, 500);

    // Show second line after first line has appeared
    const secondLineTimer = setTimeout(() => {
      setShowSecondLine(true);
    }, 1800);

    // Show buttons after both lines have appeared
    const buttonTimer = setTimeout(() => {
      setShowButtons(true);
    }, 3300);

    return () => {
      clearTimeout(firstLineTimer);
      clearTimeout(secondLineTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const handleLogin = () => {
    navigate("/login?mode=login");
  };

  const handleSignUp = () => {
    navigate("/login?mode=signup");
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">
          <span className={`title-line first-line ${showFirstLine ? "fade-in" : ""}`}>
            Ready to make an impact,
          </span>
          <br />
          <span className={`title-line second-line ${showSecondLine ? "fade-in" : ""}`}>
            one event at a time?
          </span>
        </h1>
        
        <div className={`landing-buttons ${showButtons ? "fade-in" : ""}`}>
          <button className="landing-btn signup-btn" onClick={handleSignUp}>
            Sign Up
          </button>
          <button className="landing-btn login-btn" onClick={handleLogin}>
            Log In
          </button>
        </div>
      </div>

      <div className="landing-footer">
        <p>© 2025 Spark Bytes | Boston University</p>
      </div>
    </div>
  );
};

export default LandingPage;
