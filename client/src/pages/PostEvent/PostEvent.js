import React, { useState } from "react";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "./PostEvent.css";
import { useNavigate } from "react-router-dom";

export default function PostEvent() {
  const [foodList, setFoodList] = useState([{ item: "", qty: "" }]);
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [location, setLocation] = useState("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", {
      foodList,
      dietaryOptions: selectedDietary,
    });
    // TODO: send data to backend
  };

  return (
    <div className="post-page-container">
      <NavigationBar />

      <main className="post-main-content">
        <h1 className="post-page-title">Post A Food Event</h1>

        <div className="post-form-container" onSubmit={handleSubmit}>
          <form className="post-form">
            <div className="form-group">
              <label>Event Title *</label>
              <input type="text" placeholder="e.g., Spark! Demo Day" required />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              >
                <option value="">Select location *</option>
                <option value="CDS">CDS</option>
                <option value="GSU">GSU</option>
                <option value="CAS">CAS</option>
                <option value="COM">COM</option>
                <option value="ENG">ENG</option>
                <option value="Mugar Library">Mugar Library</option>
              </select>
            </div>

            <div className="form-row-date-time">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" required />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input type="text" placeholder="3:00 PM - 5:00 PM" required />
              </div>
            </div>

            {/* Dynamic Food Items */}
            <div className="food-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Food Items *</label>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                </div>
              </div>
              <div className="food-inputs-container">
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
                        onChange={(e) =>
                          handleChange(index, "qty", e.target.value)
                        }
                        required
                      />
                    </div>

                    {index === 0 && (
                      <button
                        type="button"
                        className="add-btn"
                        onClick={handleAdd}
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Total Serving Capacity *</label>
              <input type="number" placeholder="e.g., 11" required />
            </div>

            <div className="form-group">
              <label>Dietary Options * </label>
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
                    required
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Pickup Instructions</label>
              <input
                type="text"
                placeholder="e.g., Enter through the entrance and go to second floor..."
              />
            </div>

            <div className="form-group">
              <label>Event Descriptions</label>
              <textarea
                rows="4"
                placeholder="e.g., leftover pizza, drinks, and snacks from our event..."
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
              <button
                type="submit"
                className="btn-primary"
                onClick={handleSubmit}
              >
                Post Event
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
