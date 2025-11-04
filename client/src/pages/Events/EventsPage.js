import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EventDetailModal from "../../components/EventDetailModal";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "./EventsPage.css";
import supabase, { APP_API_URL } from "../../config/supabase.js";

const API_URL = APP_API_URL;
// console.log("API_URL:", API_URL);

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch Events from the Database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        const res = await fetch(`${API_URL}/api/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch events");

        const data = await res.json();
        setEvents(data.events || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    fetchEvents();
  }, []);

  const handleClearFilters = () => {
    setDateFilter("");
    setDietaryFilter("");
    setLocationFilter("");
    setSearchQuery("");
  };

  // Open modal
  const handleViewDetail = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Reserve food
  const handleReserve = (eventId) => {
    console.log("Reserved event:", eventId);
    alert("Reservation confirmed!");
    handleCloseModal();
  };

  // search and filter
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.food_items &&
        event.food_items.some((f) =>
          f.item.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesDate = !dateFilter || event.date === dateFilter;

    const matchesDietary =
      !dietaryFilter ||
      (event.dietary_options && event.dietary_options.includes(dietaryFilter));

    const matchesLocation =
      !locationFilter ||
      event.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesDate && matchesDietary && matchesLocation;
  });

  return (
    <div className="events-page-container">
      {/* Use NavigationBar Component */}
      <NavigationBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* User Role Banner 
      <div className="user-banner">
        <span>home- {user?.userType || "event organizer"}</span>
      </div> */}

      {/* Main Content */}
      <main className="events-main-content">
        {/* Page Title and Create Button */}
        <div className="events-page-header">
          <h1 className="events-page-title">Available Food Events</h1>
          {user?.userType === "organizer" && (
            <button
              className="create-post-btn"
              onClick={() => navigate("/post")}
            >
              Create a Post
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="events-filters-container">
          <div className="filter-group">
            <label>
              <span className="filter-icon">📅</span> Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-input"
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div className="filter-group">
            <label>
              <span className="filter-icon">🍽️</span> Dietary
            </label>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Select dietary preference</option>
              <option value="Vegan">Vegan</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Gluten-Free">Gluten-Free</option>
              <option value="Kosher">Kosher</option>
              <option value="Halal">Halal</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <span className="filter-icon">📍</span> Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Select location</option>
              <option value="CDS">CDS</option>
              <option value="GSU">GSU</option>
              <option value="CAS">CAS</option>
              <option value="COM">COM</option>
              <option value="ENG">ENG</option>
              <option value="Mugar">Mugar Library</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <button className="clear-btn" onClick={handleClearFilters}>
            Clear
          </button>
        </div>

        {/* Events */}
        {loading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <p className="events-count">
              {filteredEvents.length} events available
            </p>

            <div className="events-list">
              {filteredEvents.length === 0 ? (
                <div className="no-events">
                  <p>No events found matching your filters.</p>
                  <button
                    onClick={handleClearFilters}
                    className="clear-filters-btn"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-image">
                      <img
                        src={
                          event.image_urls?.[0] ||
                          "https://placehold.co/600x400?text=No+Image"
                        }
                        alt={event.title}
                      />
                    </div>

                    <div className="event-details">
                      <div className="event-header">
                        <h3 className="event-title">{event.title}</h3>
                        <span className="spots-badge">
                          {event.capacity
                            ? `${event.capacity} Spots`
                            : "Spots Available"}
                        </span>
                      </div>

                      <div className="event-info">
                        <div className="info-item">
                          <span className="info-icon">📍</span>
                          <span>Location: {event.location}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">📅</span>
                          <span>Date: {event.date}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🕐</span>
                          <span>Time: {event.time}</span>
                        </div>
                      </div>

                      {event.food_items && event.food_items.length > 0 && (
                        <div className="info-item">
                          <span className="info-icon">🍕</span>
                          <span>
                            Food:{" "}
                            {event.food_items
                              .map((f) => `${f.item}, ${f.qty}`)
                              .join("; ")}
                          </span>
                        </div>
                      )}

                      <div className="event-footer">
                        <div className="dietary-tags">
                          {event.dietary_options?.map((tag) => (
                            <span key={tag} className="dietary-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          className="view-detail-btn"
                          onClick={() => handleViewDetail(event)}
                        >
                          View Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        open={isModalOpen}
        onClose={handleCloseModal}
        onReserve={handleReserve}
      />

      {/* Use Footer Component */}
      <Footer />
    </div>
  );
};

export default EventsPage;
