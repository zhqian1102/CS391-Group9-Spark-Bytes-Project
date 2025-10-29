import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventDetailModal from './EventDetailModal';
import NavigationBar from './NavigationBar';
import Footer from './Footer';
import './EventsPage.css';

const EventsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Mock events data
  useEffect(() => {
    const mockEvents = [
      {
        id: 1,
        title: 'Spark! Demo Day',
        location: 'CDS, Second Floor',
        date: '10/25/2025',
        time: '3pm - 4pm',
        food: ['Cheese Pizza', 'Pepperoni Pizza', 'Cookies'],
        spotsLeft: 8,
        totalSpots: 15,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
        dietary: ['Vegan', 'Gluten-Free', 'Kosher'],
        dietaryTags: ['Vegan', 'Halal', 'Kosher'],
        organizer: 'CS Department',
        description: 'Join us for the exciting Spark! Demo Day where students showcase their innovative projects and ideas. Great food and networking opportunities!',
        pickupInstructions: 'Please arrive 10 minutes before the event time. Food will be served at the registration desk on the second floor.',
        foodItems: [
          { name: 'Cheese pizza', quantity: 8, unit: 'slices' },
          { name: 'Classic pepperoni pizza', quantity: 12, unit: 'slices' },
          { name: 'Chocolate chip cookies', quantity: 20, unit: 'pieces' }
        ]
      },
    ];
    setEvents(mockEvents);
  }, []);

  const handleClearFilters = () => {
    setDateFilter('');
    setDietaryFilter('');
    setLocationFilter('');
    setSearchQuery('');
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
    console.log('Reserved event:', eventId);
    alert('Reservation confirmed!');
    handleCloseModal();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
                         event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.food.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = !dateFilter || event.date === dateFilter;
    const matchesDietary = !dietaryFilter || event.dietary.includes(dietaryFilter);
    const matchesLocation = !locationFilter || event.location.includes(locationFilter);
    
    return matchesSearch && matchesDate && matchesDietary && matchesLocation;
  });

  return (
    <div className="events-page-container">
      {/* Use NavigationBar Component */}
      <NavigationBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* User Role Banner */}
      <div className="user-banner">
        <span>home - {user?.userType || 'event organizer'}</span>
      </div>

      {/* User Role Banner */}
      <div className="user-banner">
        <span>home- {user?.userType || 'event organizer'}</span>
      </div>

      {/* Main Content */}
      <main className="events-main-content">
        {/* Page Title and Create Button */}
        <div className="events-page-header">
          <h1 className="events-page-title">Available Food Events</h1>
          {user?.userType === 'organizer' && (
            <button className="create-post-btn">Create a Post</button>
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
            </select>
          </div>

          <button className="clear-btn" onClick={handleClearFilters}>
            Clear
          </button>
          <button className="search-btn">Search</button>
        </div>

        {/* Events Count */}
        <p className="events-count">{filteredEvents.length} events available</p>

        {/* Events List */}
        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <p>No events found matching your filters.</p>
              <button onClick={handleClearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
                
                <div className="event-details">
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <span className="spots-badge">{event.spotsLeft} Spots Left</span>
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
                    <div className="info-item">
                      <span className="info-icon">🍕</span>
                      <span>Food: {event.food.join(', ')} ....</span>
                    </div>
                  </div>

                  <div className="event-footer">
                    <div className="dietary-tags">
                      {event.dietary.map(tag => (
                        <span key={tag} className="dietary-tag">{tag}</span>
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