import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavigationBar.css";

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentSearch = params.get("search") || "";
    setSearchQuery(currentSearch);
  }, [location.search]);

  // ✅ Immediately update URL when on /events and search changes
  useEffect(() => {
    // only run this effect if you're actually on /events
    if (!location.pathname.startsWith("/events")) return;

    if (searchQuery.trim() === "") {
      navigate("/events", { replace: true });
    } else {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`, {
        replace: true,
      });
    }
  }, [searchQuery, navigate, location.pathname]);

  // Preload profile picture into browser cache to prevent flicker
useEffect(() => {
  if (user?.profilePicture) {
    const img = new Image();
    img.src = user.profilePicture;
  }
}, [user?.profilePicture]);


  // Get user initials for placeholder
  const getInitials = () => {
    if (!user?.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    if (window.confirm("Confirm logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleCreateNewEvent = () => {
    navigate("/post");
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim() !== "") {
                navigate(
                  `/events?search=${encodeURIComponent(searchQuery.trim())}`
                );
              }
            }}
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

        {/* Profile Dropdown with Picture */}
        <div className="profile-dropdown-container">
          <button
            className="profile-picture-button"
            onClick={toggleProfile}
            title={user?.name || "Profile"}
          >
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="navbar-profile-pic"
              />
            ) : (
              <div className="navbar-profile-placeholder">
                {getInitials()}
              </div>
            )}
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

              <button
                className="profile-menu-item"
                onClick={handleCreateNewEvent}
              >
                <span>Create New Event</span>
              </button>

              <button className="profile-menu-item" onClick={handleViewProfile}>
                <span>View Profile</span>
              </button>

              <button className="profile-menu-item" onClick={toggleAlerts}>
                <span>Alerts {alertsOn ? "on" : "off"}</span>
              </button>

              <div className="profile-menu-divider"></div>

              <button
                className="profile-menu-item logout-item"
                onClick={handleLogout}
              >
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
