import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NavigationBar from '../../components/NavigationBar';
import Footer from '../../components/Footer';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, refreshUser } = useAuth();
  const hasLoadedRef = useRef(false); //  Track if we've loaded data
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dietaryPreferences: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load fresh data from database ONCE on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        await refreshUser();
      }
    };
    loadProfile();
    
  }, []); // Empty array - only run ONCE on mount, prevents infinite loop!

  // Update form when user data changes (but not while editing!)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dietaryPreferences: user.dietaryPreferences || []
      });
      setImagePreview(user.profilePicture || null);
    }
  }, [user, isEditing]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // If there's a new image, convert to base64 for storage
      let profilePictureData = imagePreview;
      
      const result = await updateProfile({
        name: formData.name,
        dietaryPreferences: formData.dietaryPreferences,
        profilePicture: profilePictureData
      });

      if (result.success) {
        // No need to call refreshUser - updateProfile already updated the state
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
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
      dietaryPreferences: user.dietaryPreferences || []
    });
    setImagePreview(user.profilePicture || null);
    setProfileImage(null);
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion feature will be implemented soon.');
    }
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

  // Get user initials for default avatar
  const getInitials = () => {
    if (!user.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

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
          {/* Profile Picture & Basic Info Card */}
          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">👤</span>
              Basic Information
            </h2>

            {/* Profile Picture Section */}
            <div className="profile-picture-section">
              <div className="profile-picture-container">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile" 
                    className="profile-picture"
                  />
                ) : (
                  <div className="profile-picture-placeholder">
                    {getInitials()}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="profile-picture-controls">
                  <label htmlFor="profile-image-upload" className="upload-btn">
                    📷 {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  {imagePreview && (
                    <button 
                      type="button"
                      className="remove-photo-btn"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  )}
                  <p className="upload-hint">Max 5MB, JPG/PNG</p>
                </div>
              )}
            </div>
            
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
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Select your dietary preferences to get personalized event recommendations
            </p>
            
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
                onClick={handleLogout}
              >
                <span>🚪</span>
                Logout
              </button>
              
              <button 
                className="action-btn danger-btn"
                onClick={handleDeleteAccount}
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
