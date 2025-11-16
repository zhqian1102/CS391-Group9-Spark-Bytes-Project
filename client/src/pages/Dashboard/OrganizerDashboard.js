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
    console.log("Navigating to attendees for event:", event.id);
    navigate(`/viewattendees/${event.id}`);
  };

  const today = new Date().setHours(0, 0, 0, 0); // normalize to midnight

  const upcomingEvents = postedEvents.filter((e) => {
    const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const pastEvents = postedEvents.filter((e) => {
    const eventDate = new Date(e.date).setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  const EventsSection = ({ title, events, loading }) => (
    <section className="posted-events-section" style={{ marginTop: "2rem" }}>
      <div className="section-header">
        <h3>{title}</h3>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p className="no-events-message">
          No posted events in this category yet.{" "}
        </p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-image-container">
                <img
                  src={event.image_urls?.[0]}
                  alt={event.title}
                  className="event-image"
                />

                <span className="spots-left">
                  {event.capacity - event.attendees_count || event.capacity}{" "}
                  Spots Left
                </span>
              </div>

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
                    onClick={() => handleEdit(event)}
                  >
                    Edit
                  </button>

                  <button
                    className="view-attendees-button"
                    onClick={() => handleViewAttendees(event)}
                  >
                    Attendees
                  </button>

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
  );

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
              Post A Event
            </button>
          </div>
          <EventsSection
            title="Upcoming Events"
            events={upcomingEvents}
            loading={loadingEvents}
          />

          <EventsSection
            title="Past Events"
            events={pastEvents}
            loading={loadingEvents}
          />
        </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default OrganizerDashboard;
