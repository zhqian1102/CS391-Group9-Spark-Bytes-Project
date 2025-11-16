import React, { useState, useEffect } from "react";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "../PostEvent/PostEvent.css";
import { useNavigate, useParams } from "react-router-dom";
import supabase, { APP_API_URL } from "../../config/supabase.js";

const API_URL = APP_API_URL;
const MAX_IMAGES = 5;

export default function EditEventPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [foodList, setFoodList] = useState([{ item: "", qty: "" }]);
  const [selectedDietary, setSelectedDietary] = useState([]);

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const totalImages = existingImages.length + newImagePreviews.length;

  useEffect(() => {
  async function fetchEvent() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You must be logged in.");
        navigate("/login");
        return;
      }

      const token = session.access_token;

      const res = await fetch(`${API_URL}/api/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert("Failed to load event.");
        navigate("/events");
        return;
      }

      const event = await res.json();
      setTitle(event.title || "");
      setLocation(event.location || "");
      setDate(event.date || "");
      setTime(event.time || "");
      setCapacity(event.capacity || "");
      setPickupInstructions(event.pickup_instructions || "");
      setDescription(event.description || "");
      setFoodList(event.food_items || [{ item: "", qty: "" }]);
      setSelectedDietary(event.dietary_options || []);
      setExistingImages(event.image_urls || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading event:", error);
      alert("An error occurred while loading the event.");
      setLoading(false);
    }
  }

  fetchEvent();
}, [id, navigate]);  



  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

    const handleAdd = () => setFoodList([...foodList, { item: "", qty: "" }]);

    const handleChange = (index, field, value) => {
    const updated = [...foodList];
    updated[index][field] = value;
    setFoodList(updated);
    };

    const handleDietaryToggle = (tag) => {
    setSelectedDietary((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    };


    const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - totalImages;

    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Maximum is ${MAX_IMAGES} images total.`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setNewImageFiles(prev => [...prev, ...validFiles]);
    setNewImagePreviews(prev => [...prev, ...newPreviews]);

    e.target.value = '';
  };

  const uploadImagesToSupabase = async (files) => {
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
      const { error } = await supabase.storage
        .from("event_images")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("event_images").getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in.");
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      alert("Please add at least one image.");
      return;
    }

    const token = session.access_token;

    let uploadedUrls = [];
    if (newImageFiles.length > 0) {
      uploadedUrls = await uploadImagesToSupabase(newImageFiles);
    }

    const finalImageUrls = [...existingImages, ...uploadedUrls];

    const updatedEvent = {
      title,
      location,
      date,
      time,
      capacity: parseInt(capacity, 10),
      food_items: foodList,
      dietary_options: selectedDietary,
      pickup_instructions: pickupInstructions,
      description,
      image_urls: finalImageUrls,
    };

    const res = await fetch(`${API_URL}/api/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedEvent),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update event.");
      return;
    }

    alert("Event updated successfully!");
    navigate("/events");
  };

  if (loading) return <div className="post-main-content">Loading...</div>;

  return (
    <div className="post-page-container">
      <NavigationBar />

      <main className="post-main-content">
        <h1 className="post-page-title">Edit Event</h1>

        <form className="post-form" onSubmit={handleSave}>

          {/* EVERYTHING BELOW IS IDENTICAL TO PostEvent.jsx */}
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} required>
              <option value="">Select location *</option>
              <option value="CAS">CAS</option>
              <option value="CDS">CDS</option>
              <option value="GSU">GSU</option>
              <option value="COM">COM</option>
              <option value="ENG">ENG</option>
              <option value="Mugar Library">Mugar Library</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-row-date-time">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Time *</label>
              <input type="text" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          {/* Food section (identical) */}
          <div className="food-section">
            <div className="form-row">
              <div className="form-group">
                <label>Food Items *</label>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
              </div>
            </div>

            {foodList.map((food, index) => (
              <div key={index} className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    value={food.item}
                    onChange={(e) => handleChange(index, "item", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={food.qty}
                    onChange={(e) => handleChange(index, "qty", e.target.value)}
                  />
                </div>

                {index === 0 && (
                  <button type="button" className="add-btn" onClick={handleAdd}>
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Total Serving Capacity *</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Dietary Options *</label>
            <div className="dietary-tags">
              {[
                "Vegan",
                "Vegetarian",
                "Kosher",
                "Gluten-Free",
                "Halal",
                "Dairy-Free",
                "Other",
              ].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`dietary-tag ${selectedDietary.includes(tag) ? "selected" : ""}`}
                  onClick={() => handleDietaryToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Event Images * (Max {MAX_IMAGES})</label>
            
            <div className="image-grid">
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="image-container">
                  <img 
                    src={url} 
                    alt={`Event ${idx + 1}`}
                    className="image-preview"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="remove-image-btn"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}

              {newImagePreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="image-container">
                  <img 
                    src={preview} 
                    alt={`New ${idx + 1}`}
                    className="image-preview new-image"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="remove-image-btn"
                    title="Remove image"
                  >
                    ×
                  </button>
                  <span className="new-image-badge">NEW</span>
                </div>
              ))}
            </div>

            {totalImages < MAX_IMAGES && (
              <div>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-upload-input"
                />
                <label 
                  htmlFor="image-upload"
                  className="image-upload-label"
                >
                  Add Images ({totalImages}/{MAX_IMAGES})
                </label>
              </div>
            )}

            {totalImages >= MAX_IMAGES && (
              <p className="max-images-warning">
                Maximum number of images reached
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Pickup Instructions</label>
            <input type="text" value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Event Description</label>
            <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={() => navigate("/organizerdashboard")}>
              Close
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}
