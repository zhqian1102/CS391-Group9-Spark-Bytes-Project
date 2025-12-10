import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import supabase from "../../config/supabase";
import "./UserProfile.css";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, refreshUser } = useAuth();
  const hasLoadedRef = useRef(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dietaryPreferences: [],
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (user && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        await refreshUser();
      }
    };
    loadProfile();
  }, []);

  // Reset image preview when user changes (like EventDetailModal does)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dietaryPreferences: user.dietaryPreferences || [],
      });
      setImagePreview(user.profilePicture || null);
    }
  }, [user, isEditing]);

  // Preload profile picture into browser cache to prevent flicker
  useEffect(() => {
    if (user?.profilePicture) {
      const img = new Image();
      img.src = user.profilePicture;
    }
  }, [user?.profilePicture]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDietaryToggle = (preference) => {
    setFormData((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter((p) => p !== preference)
        : [...prev.dietaryPreferences, preference],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Add SVG to valid types
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Please select a valid image (JPG, PNG, GIF, WebP, or SVG)",
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image must be less than 5MB",
      });
      return;
    }

    setProfileImage(file);
    setMessage({ type: "", text: "" });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Failed to read image file",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (user.profilePicture) {
      try {
        // Delete from Supabase Storage
        const fileName = user.profilePicture.split("/").pop();
        const filePath = `${user.id}/${fileName}`;

        await supabase.storage.from("profile-pictures").remove([filePath]);

        console.log("✅ Old image deleted from storage");
      } catch (error) {
        console.error("Error deleting old image:", error);
      }
    }

    setProfileImage(null);
    setImagePreview(null);

    const fileInput = document.getElementById("profile-image-upload");
    if (fileInput) fileInput.value = "";
  };

  const uploadImageToSupabase = async (file) => {
    try {
      // Delete old image first if exists
      if (user.profilePicture) {
        const oldFileName = user.profilePicture.split("/").pop();
        const oldFilePath = `${user.id}/${oldFileName}`;

        await supabase.storage.from("profile-pictures").remove([oldFilePath]);
      }

      // Upload new image
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("📤 Uploading image to:", filePath);

      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      console.log("✅ Image uploaded! URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let profilePictureUrl = user.profilePicture;

      // If there's a new image, upload it to Supabase Storage
      if (profileImage) {
        console.log("📄 Uploading new profile picture...");
        profilePictureUrl = await uploadImageToSupabase(profileImage);
      }

      // If image was removed
      if (imagePreview === null && user.profilePicture) {
        profilePictureUrl = null;
      }

      // console.log('💾 Saving profile with picture URL:', profilePictureUrl);

      const result = await updateProfile({
        name: formData.name,
        dietaryPreferences: formData.dietaryPreferences,
        profilePicture: profilePictureUrl,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        setProfileImage(null);

        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      dietaryPreferences: user.dietaryPreferences || [],
    });
    setImagePreview(user.profilePicture || null);
    setProfileImage(null);
    setIsEditing(false);
    setMessage({ type: "", text: "" });

    const fileInput = document.getElementById("profile-image-upload");
    if (fileInput) fileInput.value = "";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      alert("Account deletion feature will be implemented soon.");
    }
  };

  const dietaryOptions = [
    "Vegan",
    "Vegetarian",
    "Gluten-Free",
    "Dairy-Free",
    "Kosher",
    "Halal",
    "Nut-Free",
    "Other",
  ];

  const getInitials = () => {
    if (!user?.name) return "?";
    const names = user.name.split(" ");
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
          <div className={`message-banner ${message.type}`}>{message.text}</div>
        )}

        <div className="profile-content-grid">
          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">👤</span>
              Basic Information
            </h2>

            <div className="profile-picture-section">
              <div className="profile-picture-container">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="profile-picture"
                    loading="lazy"
                    onError={(e) => {
                      console.error("Image failed to load");
                      // Fallback to placeholder on error
                      setImagePreview(null);
                    }}
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
                    📷 {imagePreview ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
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
                  <p className="upload-hint">JPG, PNG, GIF or WebP (Max 5MB)</p>
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
                {user.userType === "organizer"
                  ? "📋 Event Organizer"
                  : "👨‍🎓 Student"}
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">🍽️</span>
              Dietary Preferences
            </h2>

            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}
            >
              Select your dietary preferences to get personalized event
              recommendations
            </p>

            <div className="dietary-grid">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`dietary-option ${
                    formData.dietaryPreferences.includes(option)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => isEditing && handleDietaryToggle(option)}
                  disabled={!isEditing}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <h2 className="card-title">
              <span className="card-icon">⚙️</span>
              Account Actions
            </h2>

            <div className="account-actions">
              <button className="action-btn logout-btn" onClick={handleLogout}>
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
