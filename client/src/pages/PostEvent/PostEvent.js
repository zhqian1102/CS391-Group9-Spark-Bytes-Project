import React, { useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "./PostEvent.css";
import { useNavigate } from "react-router-dom";
import supabase, { APP_API_URL } from "../../config/supabase.js";

const API_URL = APP_API_URL;

export default function PostEvent() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [foodList, setFoodList] = useState([{ item: "", qty: "" }]);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [images, setImages] = useState([]);

  const navigate = useNavigate();

  const handleAdd = () => setFoodList([...foodList, { item: "", qty: "" }]);

  const handleChange = (index, field, value) => {
    const updated = [...foodList];
    updated[index][field] = value;
    setFoodList(updated);
  };

  const handleDietaryToggle = (tag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const uploadImagesToSupabase = async (files) => {
    const uploadedUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("event_images")
        .upload(fileName, file);

      if (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload one or more images.");
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("event_images").getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You must be logged in to post an event.");
        return;
      }

      const token = session.access_token;

      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToSupabase(images);
      }

      // event data
      const newEvent = {
        title,
        location,
        date,
        time,
        capacity: parseInt(capacity, 10),
        food_items: foodList.map((f) => ({
          item: f.item.trim(),
          qty: f.qty.trim(),
        })),
        dietary_options: selectedDietary,
        pickup_instructions: pickupInstructions,
        description,
        image_urls: imageUrls,
      };

      console.log("Submitting event:", newEvent);

      // Send to backend
      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to post event.");
      }

      alert(" Event posted successfully!");
      navigate("/events");
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Failed to post event. Check console for details.");
    }
  };

  return (
    <div className="post-page-container">
      <NavigationBar />

      <main className="post-main-content">
        <h1 className="post-page-title">Post A Food Event</h1>

        <form className="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              placeholder="e.g., Spark! Demo Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="">Select location *</option>
              <option value="CAS">CAS</option>
              <option value="CDS">CDS</option>
              <option value="GSU">GSU</option>
              <option value="CAS">CAS</option>
              <option value="COM">COM</option>
              <option value="ENG">ENG</option>
              <option value="Mugar Library">Mugar Library</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-row-date-time">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input
                type="text"
                placeholder="3:00 PM - 5:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Dynamic Food List */}
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
                    placeholder="e.g., Cheese Pizza"
                    value={food.item}
                    onChange={(e) =>
                      handleChange(index, "item", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="e.g., 8 Slices"
                    value={food.qty}
                    onChange={(e) => handleChange(index, "qty", e.target.value)}
                    required
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
              placeholder="e.g., 11"
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
                  className={`dietary-tag ${
                    selectedDietary.includes(tag) ? "selected" : ""
                  }`}
                  onClick={() => handleDietaryToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Upload Event Images *</label>
            </div>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            required
          />

          <div className="form-group">
            <label>Pickup Instructions</label>
            <input
              type="text"
              placeholder="e.g., Enter through the entrance and go to second floor..."
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Event Description</label>
            <textarea
              rows="4"
              placeholder="e.g., leftover pizza, drinks, and snacks from our event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/events")}
            >
              Close
            </button>
            <button type="submit" className="btn-primary">
              Post Event
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
