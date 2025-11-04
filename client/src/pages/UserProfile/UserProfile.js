import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavigationBar from '../../components/NavigationBar';
import Footer from '../../components/Footer';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dietaryPreferences: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Initialize form data with user info
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dietaryPreferences: user.dietaryPreferences || []
      });
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDietaryToggle = (preference) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        dietaryPreferences: formData.dietaryPreferences
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      dietaryPreferences: user.dietaryPreferences || []
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const dietaryOptions = [
    'Vegan',
    'Vegetarian',
    'Gluten-Free',
    'Dairy-Free',
    'Kosher',
    'Halal',
    'Nut-Free',
    'Other'
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page-container">
      <NavigationBar />
      
      <main className="profile-main-content">
        <div className="profile-header-section">
          <h1 className="profile-page-title">My Profile</h1>
          {!isEditing && (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content-grid">
          {/* Basic Information Card */}
          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">👤</span>
              Basic Information
            </h2>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="profile-input"
              />
            </div>

            <div className="form-group">
              <label>Email (BU)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="profile-input disabled"
              />
              <span className="input-hint">Email cannot be changed</span>
            </div>

            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+1 (XXX) XXX-XXXX"
                className="profile-input"
              />
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <div className="account-type-badge">
                {user.userType === 'organizer' ? '📋 Event Organizer' : '👨‍🎓 Student'}
              </div>
            </div>
          </div>

          {/* Dietary Preferences Card */}
          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">🍽️</span>
              Dietary Preferences
            </h2>
            
            <div className="dietary-grid">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`dietary-option ${
                    formData.dietaryPreferences.includes(option) ? 'selected' : ''
                  }`}
                  onClick={() => isEditing && handleDietaryToggle(option)}
                  disabled={!isEditing}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Account Actions Card */}
          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">⚙️</span>
              Account Actions
            </h2>
            
            <div className="account-actions">
              <button 
                className="action-btn logout-btn"
                onClick={logout}
              >
                <span>🚪</span>
                Logout
              </button>
              
              <button 
                className="action-btn danger-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion would be implemented here');
                  }
                }}
              >
                <span>⚠️</span>
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons (shown when editing) */}
        {isEditing && (
          <div className="profile-actions">
            <button 
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;