import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Utilized Claude AI to generate dummy data for testing;
  // replace with data from db later.
  const [reservedEvents] = useState([
    {
      id: 1,
      title: "Spark! Demo Day",
      location: "CDS, Second Floor",
      date: "10/25/2025",
      time: "3pm - 4pm",
      spotsLeft: 3,
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=320&fit=crop",
      tags: ["Vegan", "Gluten-Free", "Kosher"],
    },
    {
      id: 2,
      title: "Friday Pizza Night",
      location: "CDS, Second Floor",
      date: "10/24/2025",
      time: "6pm - 8pm",
      spotsLeft: 4,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=320&fit=crop",
      tags: ["Vegan", "Gluten-Free", "Kosher"],
    },
    {
      id: 3,
      title: "Spark! Demo Day",
      location: "CDS, Second Floor",
      date: "10/25/2025",
      time: "3pm - 4pm",
      spotsLeft: 5,
      image:
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=320&fit=crop",
      tags: ["Vegan", "Gluten-Free", "Kosher"],
    },
  ]);

  const handleViewDetails = (eventId) => {
    alert(`View details of event ${eventId} coming soon`);
  };

  const handleCancel = (eventId) => {
    if (window.confirm("Confirm cancellation?")) {
      alert(`Cancelled reservation for event ${eventId}`);
      // Later: remove cancelled event from reservedEvents
    }
  };

  return (
    <div className="userdashboard-container">
      {/* Navigation Header */}
      <header className="dashboard-navbar">
        <div className="navbar-left">
          <div className="logo-section">
            <img src="/sparkbytes.png" alt="Spark Bytes" className="nav-logo" />
            <h1 className="nav-title">Spark!Bytes</h1>
          </div>
        </div>

        <div className="navbar-right">
          <button 
            className="nav-link-btn"
            onClick={() => navigate('/events')}
          >
            Browse Events
          </button>
          <button 
            className="nav-link-btn"
            onClick={() => navigate('/userdashboard')}
          >
            My Dashboard
          </button>
          <button 
            className="profile-btn" 
            title={user?.name || 'User'}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </button>
          <button 
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="userdashboard-main">
        <div className="welcome-section">
          <h2 className="welcome-title">
            Welcome back, {user?.name || "Tester"}!
          </h2>
        </div>

        {/* Reserved Events Section */}
        <section className="reserved-events-section">
          <div className="section-header">
            <h3>My Reserved Events</h3>
            <button 
              className="view-events-button"
              onClick={() => navigate('/events')}
            >
              View Events
            </button>
          </div>

          <div className="events-grid">
            {reservedEvents.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-image-container">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="event-image"
                  />
                  <span className="spots-left">
                    {event.spotsLeft} Spots Left
                  </span>
                </div>

                <div className="event-content">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <span className="reserved-badge">Reserved</span>
                  </div>

                  <div className="event-detail">
                    <span className="detail-icon">📍</span>
                    <span>{event.location}</span>
                  </div>

                  <div className="event-detail">
                    <span className="detail-icon">📅</span>
                    <span>{event.date}</span>
                  </div>

                  <div className="event-detail">
                    <span className="detail-icon">🕐</span>
                    <span>{event.time}</span>
                  </div>

                  <div className="event-tags">
                    {event.tags.map((tag) => (
                      <span key={tag} className="event-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="event-actions">
                    <button className="view-details-button">
                      View Details
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => handleCancel(event.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Spark!Bytes. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserDashboard;
