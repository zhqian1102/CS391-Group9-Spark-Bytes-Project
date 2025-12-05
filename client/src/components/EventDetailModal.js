import React, { useEffect, useRef, useState } from "react";
import "./EventDetailModal.css";
import EventLocationMap from "./EventLocationMap";

const EventDetailModal = ({ event, open, onClose, onReserve }) => {
  const dialogRef = useRef(null);
  const [isReserving, setIsReserving] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = event?.image_urls || (event?.image ? [event.image] : []);
  const hasMultipleImages = images.length > 1;

  // Reset image index when modal opens or event changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [open, event?.id]);

  // ESC to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const stopPropagation = (e) => e.stopPropagation();

  const handleReserveClick = async () => {
    if (isReserving || event.isReserved) return;

    setIsReserving(true);
    try {
      await onReserve?.(event.id);
    } catch (error) {
      console.error("Reservation failed:", error);
      alert("Failed to reserve this event. Please try again.");
    } finally {
      setIsReserving(false);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Helper function to format date with proper weekday
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString; // Return original on error
    }
  };

  if (!open || !event) return null;

  const totalSpots = event.capacity || 0;
  const attendees = event.attendees_count || 0;
  const spotsLeft = Math.max(totalSpots - attendees, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal container */}
      <div className="modal-container" onClick={onClose}>
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-event-detail-title"
          onClick={stopPropagation}
          ref={dialogRef}
        >
          {/* Header with image and spots badge */}
          <div className="modal-header">
            {images.length > 0 && (
              <div className="modal-image-carousel">
                <img
                  src={images[currentImageIndex]}
                  alt={`${event.title || "Event"} ${currentImageIndex + 1} of ${
                    images.length
                  }`}
                />

                {/* Navigation arrows - only show if multiple images */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      className="modal-carousel-btn modal-carousel-btn-prev"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="modal-carousel-btn modal-carousel-btn-next"
                      onClick={handleNextImage}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Image indicators */}
                {hasMultipleImages && (
                  <div className="modal-carousel-indicators">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`modal-carousel-dot ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Image counter */}
                {hasMultipleImages && (
                  <div className="modal-image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            )}
            <div className="modal-spots-badge">
              {spotsLeft > 0 ? `${spotsLeft} Spots Left` : "Event Full"}
            </div>
          </div>

          {/* Body */}
          <div className="modal-body">
            <h2 id="modal-event-detail-title" className="modal-event-title">
              {event.title}
            </h2>

            {/* Basic info */}
            <div className="modal-event-info">
              <div className="modal-info-item">
                <span className="modal-info-icon" aria-hidden="true">
                  📅
                </span>
                <span>{formatEventDate(event.date)}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-icon" aria-hidden="true">
                  🕐
                </span>
                <span>{event.time}</span>
              </div>
            </div>

            {/* Google Maps Embed */}
            <EventLocationMap locationCode={event.location} />

            {/* Description */}
            {event.description && (
              <div className="modal-event-description">
                <p>{event.description}</p>
              </div>
            )}

            {/* Pickup instructions */}
            {event.pickupInstructions && (
              <div className="modal-pickup-section">
                <h3 className="modal-section-title">
                  <span className="modal-info-icon" aria-hidden="true">
                    ℹ️
                  </span>
                  Pickup Instructions
                </h3>
                <p className="modal-pickup-text">{event.pickupInstructions}</p>
              </div>
            )}

            {/* Food section */}
            <div className="modal-food-section">
              <div className="modal-food-header">
                <h3 className="modal-section-title">
                  <span className="modal-info-icon" aria-hidden="true">
                    🍱
                  </span>
                  Available Food
                </h3>

                {/* Dietary tags */}
                <div className="modal-dietary-tags">
                  {Array.isArray(event.dietaryTags) &&
                    event.dietaryTags.map((tag, i) => (
                      <span key={i} className="modal-dietary-tag">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              {/* Serving capacity */}
              <div className="modal-serving-info">
                <strong>Serving Capacity: {totalSpots}</strong>
              </div>

              {/* Food items list */}
              <div className="modal-food-list">
                {Array.isArray(event.foodItems) &&
                  event.foodItems.map((item, i) => (
                    <div key={i} className="modal-food-item">
                      {item.name}: {item.quantity} {item.unit}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className={`modal-btn ${
                event.isReserved ? "modal-btn-secondary" : "modal-btn-primary"
              }`}
              onClick={handleReserveClick}
              disabled={event.isReserved || isReserving}
              style={
                event.isReserved ? { opacity: 0.6, cursor: "not-allowed" } : {}
              }
            >
              {isReserving
                ? "Reserving..."
                : event.isReserved
                ? "Reserved"
                : "Reserve Event"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetailModal;
