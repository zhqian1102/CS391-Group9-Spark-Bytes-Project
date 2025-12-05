import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserDashboard.css";
import EventDetailModal from "../../components/EventDetailModal";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import supabase, { APP_API_URL } from "../../config/supabase.js";

const API_URL = APP_API_URL;

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to login
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const [reservedEvents, setReservedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isOrganizerView, setIsOrganizerView] = useState(false);

  useEffect(() => {
    const fetchReservedEvents = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) return;

        const idsRes = await fetch(`${API_URL}/api/events/reserved/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!idsRes.ok) throw new Error("Failed to fetch reserved event IDs");
        const idsData = await idsRes.json();

        const reservedIds = idsData.reservedEventIds || [];
        if (reservedIds.length === 0) {
          setReservedEvents([]);
          setLoading(false);
          return;
        }

        const eventRequests = reservedIds.map((id) =>
          fetch(`${API_URL}/api/events/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json())
        );

        const rawEvents = await Promise.all(eventRequests);

        const today = new Date().setHours(0, 0, 0, 0);

        const upcomingEvents = rawEvents.filter((ev) => {
          if (!ev || !ev.date) return false;
          const eventDate = new Date(ev.date).setHours(0, 0, 0, 0);
          return eventDate >= today;
        });

        setReservedEvents(upcomingEvents);
        setLoading(false);
      } catch (err) {
        console.error("Error loading reserved events:", err);
        alert(err.message || "Failed to load reserved events.");
        setLoading(false);
      }
    };

    fetchReservedEvents();
  }, []);

  const handleCancel = async (eventId) => {
    if (!window.confirm("Confirm cancellation?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      const res = await fetch(`${API_URL}/api/events/${eventId}/reserve`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel reservation");
      }

      alert("Reservation cancelled");

      setReservedEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.message);
    }
  };

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleToggleView = () => {
    setIsOrganizerView(!isOrganizerView);
    setTimeout(() => navigate("/organizerdashboard"), 200);
  };

  return (
    <div className="userdashboard-container">
      <NavigationBar />

      <main className="userdashboard-main">
        <h2 className="dashboard-welcome-title">
          Welcome back, {user?.name || "Friend"}!
        </h2>

        <section className="reserved-events-section">
          <div className="section-header">
            <div className="section-header-left">
              <h3>My Reservations</h3>

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
              className="view-events-button"
              onClick={() => navigate("/events")}
            >
              View Events
            </button>
          </div>

          {loading ? (
            <p>Loading your reserved events...</p>
          ) : reservedEvents.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
              You have no upcoming reservations.{" "}
              <button
                onClick={() => navigate("/events")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2c5258",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Browse available events
              </button>
            </p>
          ) : (
            <div className="events-grid">
              {reservedEvents.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-image-container">
                    <img
                      src={
                        event.image_urls?.[0] ||
                        "https://placehold.co/600x400?text=No+Image"
                      }
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
                      {event.dietary_options?.map((tag) => (
                        <span key={tag} className="event-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="event-actions">
                      <button
                        className="view-details-button"
                        onClick={() => handleViewDetails(event)}
                      >
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
          )}
        </section>
      </main>

      <Footer />

      {/* Modal */}
      {showModal && selectedEvent && (
        <EventDetailModal
          event={{
            ...selectedEvent,
            isReserved: true,
            spotsLeft: selectedEvent.capacity - selectedEvent.attendees_count,
            image: selectedEvent.image_urls?.[0],
            tags: selectedEvent.dietary_options || [],
            foodItems:
              selectedEvent.food_items?.map((f) => ({
                name: f.item,
                quantity: f.qty,
                unit: "servings",
              })) || [],
            pickupInstructions: selectedEvent.pickup_instructions,
          }}
          open={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UserDashboard;
