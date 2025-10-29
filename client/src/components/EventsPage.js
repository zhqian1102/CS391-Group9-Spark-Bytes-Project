import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './EventsPage.css';

const EventsPage = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Mock events data - you can replace with Supabase later
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
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
        dietary: ['Vegan', 'Gluten-Free', 'Kosher'],
        organizer: 'CS Department'
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
      {/* Navigation Header */}
      <header className="events-navbar">
        <div className="navbar-left">
          <div className="logo-section">
            <img src="/sparkbytes.png" alt="Spark Bytes" className="nav-logo" />
            <h1 className="nav-title">Spark!Bytes</h1>
          </div>
        </div>

        <div className="navbar-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for event, food or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="navbar-right">
          <a href="#events" className="nav-link">Events</a>
          <a href="#about" className="nav-link">About</a>
          <button className="profile-btn" title={user?.name || 'User'}>
            {user?.name?.charAt(0).toUpperCase() || 'P'}
          </button>
          
         
        </div>
      </header>

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
                    <button className="view-detail-btn">View Detail</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="events-footer">
        <p>© 2025 Spark!Bytes. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default EventsPage;