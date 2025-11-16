import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./OrganizerDashboard.css";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import supabase, { APP_API_URL } from "../../config/supabase.js";

const API_URL = APP_API_URL;

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postedEvents, setPostedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchEvents() {
      setLoadingEvents(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session.access_token;

      const response = await fetch(`${API_URL}/api/events/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Fetched events", result);
        setPostedEvents(result.posted || []);
      } else {
        console.error("❌ Error loading events:", result.error);
      }

      setLoadingEvents(false);
    }

    fetchEvents();
  }, [user?.id]);

  const [isOrganizerView, setIsOrganizerView] = useState(true);

  const handleToggleView = () => {
    setIsOrganizerView(!isOrganizerView);
    setTimeout(() => navigate("/userdashboard"), 300);
  };
  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session.access_token;

      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Failed to delete event.");
        return;
      }

      alert("Event deleted successfully.");

      // Remove from UI
      setPostedEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Server error while deleting event.");
    }
  };

  const handleEdit = (event) => {
    console.log("EDIT CLICKED — event id = ", event.id);
    navigate(`/editevent/${event.id}`);
  };

  const handleViewAttendees = (event) => {
    navigate("/attendees", {
      state: { eventId: event.id, eventTitle: event.title },
    });
  };

  return (
    <div className="organizerdashboard-container">
      {/* Navigation Component */}
      <NavigationBar />
      {/* Main Content */}
      <main className="organizerdashboard-main">
        <h2 className="dashboard-welcome-title">
          Welcome back, {user?.name || "Tester"}!
        </h2>

        {/* Reserved Events Section */}
        <section className="posted-events-section">
          <div className="section-header">
            <div className="section-header-left">
              <h3>My Events</h3>
              <div className="view-toggle-container">
                <span className="toggle-label">My Reservations</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isOrganizerView}
                    onChange={handleToggleView}
                  />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label">My Events</span>
              </div>
            </div>
            <button
              className="view-all-events-button"
              onClick={() => navigate("/post")}
            >
              View All Events
            </button>
          </div>

          {/* Event cards section */}
          {loadingEvents ? (
            <p>Loading your reserved events...</p>
          ) : postedEvents.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
              You have not posted any events yet.{" "}
              <button
                onClick={() => navigate("/post")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2c5258",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "inherit",
                }}
              >
                Post your first Leftover Food Event!
              </button>
            </p>
          ) : (
            <div className="events-grid">
              {postedEvents.map((event) => (
                <div key={event.id} className="event-card">
                  {/* Image */}
                  <div className="event-image-container">
                    <img
                      src={event.image_urls?.[0]}
                      alt={event.title}
                      className="event-image"
                    />
                    {/* Spots Left tag */}
                    <span className="spots-left">
                      {event.capacity - event.attendees_count || event.capacity}{" "}
                      Spots Left
                    </span>
                  </div>

                  {/* Event content*/}
                  <div className="event-content">
                    <div className="event-header">
                      <h4 className="event-title">{event.title}</h4>
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
                      {event.dietary_options?.map((tag) => (
                        <span key={tag} className="event-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="event-actions">
                      <button
                        className="view-details-button"
                        onClick={() => {
                          handleEdit(event);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="view-attendees-button"
                        onClick={() => {
                          handleViewAttendees(event);
                        }}
                      >
                        Attendees
                      </button>
                      {/* Cancel reservation button */}
                      <button
                        className="cancel-button"
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default OrganizerDashboard;
