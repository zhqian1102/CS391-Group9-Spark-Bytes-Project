import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserDashboard.css";
import EventDetailModal from "../../components/EventDetailModal";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
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
      totalSpots: 20,
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=320&fit=crop",
      tags: ["Vegan", "Gluten-Free", "Kosher"],
      dietaryTags: ["Vegan", "Gluten-Free", "Kosher"],
      description: "Join us for our demo day with amazing food!", // ← OPTIONAL
      pickupInstructions: "Pick up at the front desk", // ← OPTIONAL
      foodItems: [
        // ← OPTIONAL
        { name: "Grilled Chicken", quantity: 50, unit: "pieces" },
        { name: "Caesar Salad", quantity: 30, unit: "servings" },
      ],
    },
    {
      id: 2,
      title: "Friday Pizza Night",
      location: "CDS, Second Floor",
      date: "10/24/2025",
      time: "6pm - 8pm",
      spotsLeft: 4,
      totalSpots: 10,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=320&fit=crop",
      tags: ["Vegan"],
      dietaryTags: ["Vegan"],
      description: "Join us for our demo day with amazing food!", // ← OPTIONAL
      foodItems: [
        // ← OPTIONAL
        { name: "Grilled Chicken", quantity: 50, unit: "pieces" },
      ],
    },
    {
      id: 3,
      title: "Spark! Demo Day",
      location: "CDS, Second Floor",
      date: "10/25/2025",
      time: "3pm - 4pm",
      spotsLeft: 5,
      totalSpots: 5,
      image:
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=320&fit=crop",
      tags: ["Vegan", "Gluten-Free", "Kosher"],
      pickupInstructions: "Pick up at the front desk", // ← OPTIONAL
    },
  ]);

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
  const handleCancel = (eventId) => {
    if (window.confirm("Confirm cancellation?")) {
      alert(`Cancelled reservation for event ${eventId}`);
      // Later: remove cancelled event from reservedEvents
    }
  };

  return (
    <div className="userdashboard-container">
      {/* Navigation Component */}
      <NavigationBar />
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
              onClick={() => navigate("/events")}
            >
              View Events
            </button>
          </div>

          {/* Event cards section */}
          <div className="events-grid">
            {reservedEvents.map((event) => (
              <div key={event.id} className="event-card">
                {/* Image */}
                <div className="event-image-container">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="event-image"
                  />
                  {/* Spots left tag */}
                  <span className="spots-left">
                    {event.spotsLeft} Spots Left
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
                    {event.tags.map((tag) => (
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
        </section>
      </main>

      {/* Footer Component */}
      <Footer />

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          open={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UserDashboard;
