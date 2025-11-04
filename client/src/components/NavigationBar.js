import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavigationBar.css";

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);

  const handleLogout = () => {
    if (window.confirm("Confirm logout?")) {
      logout();
      navigate("/login");
    }
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const handleViewProfile = () => {
    setShowProfile(false);
    navigate("/profile");
  };

  const handleNotifications = () => {
    navigate("/notifications");
  };

  const toggleAlerts = () => {
    setAlertsOn(!alertsOn);
    alert(`Alerts ${!alertsOn ? "on" : "off"}`);
  };

  return (
    <header className="navigation-header">
      {/* Logo and Header */}
      <div className="header-left">
        <img className="header-logo" src="/sparkbytes.png" alt="Spark! Bytes" />
        <h1 className="header-title">Spark!Bytes</h1>
      </div>

      {/* Search bar */}
      <div className="header-center">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for event, food or location"
            className="search-input"
          />
        </div>
      </div>

      {/* Navigation links */}
      <nav className="header-right">
        <Link to="/userdashboard" className="nav-link">
          Dashboard
        </Link>
        <Link to="/events" className="nav-link">
          Events
        </Link>
        <Link to="/about" className="nav-link">
          About
        </Link>

        {/* Notification Bell */}
        <button
          className="icon-button notification-button"
          onClick={handleNotifications}
          title="Notifications"
        >
          <span>🔔</span>
        </button>

        {/* Profile Dropdown */}
        <div className="profile-dropdown-container">
          <button
            className="icon-button profile-button"
            onClick={toggleProfile}
            title="Profile"
          >
            <span>👤</span>
          </button>

          {showProfile && (
            <div className="profile-dropdown-menu">
              <div className="profile-menu-header">
                <span className="profile-menu-user">
                  {user?.name || "Tester"}
                </span>
                <span className="profile-menu-email">
                  {user?.email || "test@bu.edu"}
                </span>
              </div>

              <div className="profile-menu-divider"></div>

              <button className="profile-menu-item" onClick={handleViewProfile}>
                <span>👤</span>
                <span>View Profile</span>
              </button>

              <button className="profile-menu-item" onClick={toggleAlerts}>
                <span>{alertsOn ? "🔔" : "🔕"}</span>
                <span>Alerts {alertsOn ? "on" : "off"}</span>
              </button>

              <div className="profile-menu-divider"></div>

              <button
                className="profile-menu-item logout-item"
                onClick={handleLogout}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default NavigationBar;