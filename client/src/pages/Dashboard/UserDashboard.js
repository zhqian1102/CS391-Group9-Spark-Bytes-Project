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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch reserved events from API
  const [reservedEvents, setReservedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isOrganizerView, setIsOrganizerView] = useState(false);

  useEffect(() => {
    const fetchReservedEvents = async () => {
      if (!user?.id) return;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        const res = await fetch(`${API_URL}/api/events/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch reserved events");

        const data = await res.json();
        // data.reserved contains the events this user has reserved
        setReservedEvents(data.reserved || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reserved events:", err);
        setLoading(false);
      }
    };

    fetchReservedEvents();
  }, [user]);

  // Modal state
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

  /* Cancel event state */
  const handleCancel = async (eventId) => {
    if (!window.confirm("Confirm cancellation?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      const res = await fetch(`${API_URL}/api/events/${eventId}/reserve`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel reservation");
      }

      alert(`Cancelled reservation successfully`);

      // Remove the cancelled event from the list
      setReservedEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventId)
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert(error.message || "Failed to cancel reservation");
    }
  };

  const handleToggleView = () => {
    setIsOrganizerView(!isOrganizerView);
    setTimeout(() => {
      navigate("/organizerdashboard");
    }, 200);
  };

  return (
    <div className="userdashboard-container">
      {/* Navigation Component */}
      <NavigationBar />
      {/* Main Content */}
      <main className="userdashboard-main">
          <h2 className="dashboard-welcome-title">
            Welcome back, {user?.name || "Tester"}!
          </h2>


        {/* Reserved Events Section */}
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

          {/* Event cards section */}
          {loading ? (
            <p>Loading your reserved events...</p>
          ) : reservedEvents.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
              You haven't reserved any events yet.{" "}
              <button
                onClick={() => navigate("/events")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2c5258",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "inherit",
                }}
              >
                Browse available events
              </button>
            </p>
          ) : (
            <div className="events-grid">
              {reservedEvents.map((event) => (
                <div key={event.id} className="event-card">
                  {/* Image */}
                  <div className="event-image-container">
                    <img
                      src={
                        event.image_urls?.[0] ||
                        "https://placehold.co/600x400?text=No+Image"
                      }
                      alt={event.title}
                      className="event-image"
                    />
                    {/* Spots left tag */}
                    <span className="spots-left">
                      {event.capacity || 0} Spots Left
                    </span>
                  </div>

                  {/* Event content*/}
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
                      {/* View details button */}
                      <button
                        className="view-details-button"
                        onClick={() => {
                          handleViewDetails(event);
                        }}
                      >
                        View Details
                      </button>
                      {/* Cancel reservation button */}
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

      {/* Footer Component */}
      <Footer />

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <EventDetailModal
          event={{
            ...selectedEvent,
            isReserved: true, // Already reserved since it's on dashboard
            spotsLeft: selectedEvent.capacity || 0,
            totalSpots: selectedEvent.capacity || 0,
            image: selectedEvent.image_urls?.[0],
            tags: selectedEvent.dietary_options || [],
            dietaryTags: selectedEvent.dietary_options || [],
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
