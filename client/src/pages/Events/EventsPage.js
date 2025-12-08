import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EventDetailModal from "../../components/EventDetailModal";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "./EventsPage.css";
import supabase, { APP_API_URL } from "../../config/supabase.js";
import { useLocation } from "react-router-dom";

const API_URL = APP_API_URL;
const NO_SPOTS_VALUE = 0;

const getSpotsLeft = (event) => {
  if (event.capacity && event.attendees_count !== undefined) {
    return Math.max(event.capacity - event.attendees_count, 0);
  }
  return NO_SPOTS_VALUE;
};

const isEventFull = (event) => {
  const spotsLeft = getSpotsLeft(event);
  return (
    event.capacity && event.attendees_count !== undefined && spotsLeft === 0
  );
};

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDietaryFilterManual, setIsDietaryFilterManual] = useState(false);

  const location = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
  if (user?.dietaryPreferences && user.dietaryPreferences.length > 0 && !isDietaryFilterManual) {
    setDietaryFilter(user.dietaryPreferences[0]); // Auto-apply first preference
  }
}, [user, isDietaryFilterManual]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          console.error("No auth token found");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams(location.search);
        const search = params.get("search") || "";

        const eventsRes = await fetch(
          `${API_URL}/api/events${
            search ? `?search=${encodeURIComponent(search)}` : ""
          }`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!eventsRes.ok) {
          console.error("Events fetch failed:", eventsRes.status);
          throw new Error("Failed to load events");
        }

        const eventsData = await eventsRes.json();
        let fetchedEvents = eventsData.events || [];

        // Fetch reserved events
        const reservedRes = await fetch(`${API_URL}/api/events/reserved/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let reservedIds = [];
        if (reservedRes.ok) {
          const reservedData = await reservedRes.json();
          reservedIds = reservedData.reservedEventIds || [];
        } else {
          console.error("Reserved fetch failed:", await reservedRes.text());
        }

        // Merge reserved status
        const merged = fetchedEvents.map((e) => {
          const isReserved = reservedIds.some(
            (rid) => String(rid) === String(e.id)
          );
          return {
            ...e,
            isReserved,
          };
        });

        setEvents(merged);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching events:", err);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [location.search]);

  const handleClearFilters = () => {
    setDateFilter("");
    setDietaryFilter("");
    setLocationFilter("");
    setSearchQuery("");
    setIsDietaryFilterManual(false);
  };

  // User manually changed it
  const handleDietaryFilterChange = (value) => {
  setDietaryFilter(value);
  setIsDietaryFilterManual(true);
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
  const handleReserve = async (eventId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        alert("Please log in to reserve an event");
        return;
      }

      const res = await fetch(`${API_URL}/api/events/${eventId}/reserve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reserve event");
      }

      // Update local event state (capacity - 1)
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId
            ? {
                ...event,
                isReserved: true,
                attendees_count: (event.attendees_count || 0) + 1,
              }
            : event
        )
      );

      if (selectedEvent?.id === eventId) {
        setSelectedEvent((prev) => ({
          ...prev,
          isReserved: true,
          attendees_count: (prev.attendees_count || 0) + 1,
        }));
      }

      alert("Reservation confirmed!");
      handleCloseModal();
    } catch (error) {
      console.error("Error reserving event:", error);
      alert(error.message || "Failed to reserve event. Please try again.");
    }
  };

  const parseEventDateTime = (dateStr, timeStr, end = false) => {
    if (!dateStr) return null;

    let hour = 0,
      minute = 0,
      meridian = "";

    if (timeStr) {
      const clean = timeStr.replace(/\s+/g, "").toUpperCase();
      const parts = clean.split("-");
      const target = end && parts.length > 1 ? parts[1] : parts[0];
      const match = target.match(/(\d{1,2})(?::(\d{2}))?([AP]M)?/);

      if (match) {
        hour = parseInt(match[1], 10);
        minute = match[2] ? parseInt(match[2], 10) : 0;
        meridian = match[3] || "";

        if (!meridian) meridian = hour >= 8 ? "PM" : "AM";
        if (meridian === "PM" && hour < 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
      }
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, hour, minute);
  };

  // Apply Filters
  const filteredEvents = events
    .filter((event) => {
      const now = new Date();
      const startTime = parseEventDateTime(event.date, event.time, false);
      const endTime = parseEventDateTime(event.date, event.time, true);

      if (!startTime) return false;
      // Show event if it hasn’t ended yet
      if (endTime) return endTime >= now;
      return startTime >= now;
    })
    .filter((event) => {
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
        (event.dietary_options &&
          event.dietary_options.includes(dietaryFilter));
      const matchesLocation =
        !locationFilter ||
        event.location?.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesDate && matchesDietary && matchesLocation;
    })
    // Events sort by start time
    .sort((a, b) => {
      const aTime = parseEventDateTime(a.date, a.time);
      const bTime = parseEventDateTime(b.date, b.time);
      return aTime - bTime;
    });

  return (
    <div className="events-page-container">
      {/* Use NavigationBar Component */}
      <NavigationBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <main className="events-main-content">
        {/* Page Title and Create Button */}
        <div className="events-page-header">
          <h1 className="events-page-title">Available Food Events</h1>
          <button className="create-post-btn" onClick={() => navigate("/post")}>
            Post An Event
          </button>
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
              onChange={(e) => handleDietaryFilterChange(e.target.value)}
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
                filteredEvents.map((event) => {
                  const spotsLeft = getSpotsLeft(event);
                  const isFull = isEventFull(event);
                  const noSpotsData = spotsLeft === NO_SPOTS_VALUE;
                  const showAsFull = isFull || noSpotsData;
                  const cardClassName = [
                    "event-card",
                    showAsFull ? "full" : "",
                    noSpotsData ? "no-spots" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div key={event.id} className={cardClassName}>
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
                          <span
                            className={`spots-badge ${
                              showAsFull ? "full" : ""
                            } ${noSpotsData ? "no-spots" : ""}`}
                          >
                            {showAsFull ? "Full" : `${spotsLeft} Spots Left`}
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
                                .map((f) => `${f.item}: ${f.qty}`)
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
                            className={`view-detail-btn ${
                              event.isReserved ? "reserved" : ""
                            } ${noSpotsData ? "no-spots" : ""}`}
                            onClick={() =>
                              !showAsFull && handleViewDetail(event)
                            }
                            disabled={showAsFull}
                          >
                            {event.isReserved ? "Reserved" : "View Detail"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={
          selectedEvent
            ? {
                ...selectedEvent,
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
              }
            : null
        }
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
