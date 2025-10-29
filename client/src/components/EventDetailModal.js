// EventDetailModal.js
import React, { useEffect, useRef } from 'react';
import './EventDetailModal.css';

const EventDetailModal = ({ event, open, onClose, onReserve }) => {
  const dialogRef = useRef(null);

  // ESC to close (only when open)
  useEffect(() => {
    if (!open) return; // guard: do nothing if closed

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const stopPropagation = (e) => e.stopPropagation();

  // Render nothing if closed or no event
  if (!open || !event) return null;

  const servingCapacity = event.totalSpots;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal container centers the dialog */}
      <div className="modal-container" onClick={onClose}>
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
          onClick={stopPropagation}
          ref={dialogRef}
        >
          {/* Header with hero image and spots badge */}
          <div className="modal-header">
            {event.image && (
              <img
                src={event.image}
                alt={event.title || 'Event image'}
                className="event-image"
                loading="lazy"
              />
            )}
            <div className="spots-badge">{event.spotsLeft} Spots Left</div>
          </div>

          {/* Body */}
          <div className="modal-body">
            <h2 id="event-detail-title" className="event-title">
              {event.title}
            </h2>

            {/* Basic info */}
            <div className="event-info">
              <div className="info-item">
                <span className="info-icon" aria-hidden="true">📅</span>
                <span>Saturday, {event.date}</span>
              </div>
              <div className="info-item">
                <span className="info-icon" aria-hidden="true">🕐</span>
                <span>{event.time}</span>
              </div>
              <div className="info-item">
                <span className="info-icon" aria-hidden="true">📍</span>
                <span>{event.location}</span>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="event-description">
                <p>{event.description}</p>
              </div>
            )}

            {/* Pickup instructions */}
            {event.pickupInstructions && (
              <div className="pickup-section">
                <h3 className="section-title">
                  <span className="info-icon" aria-hidden="true">ⓘ</span>
                  Pickup Instructions
                </h3>
                <p className="pickup-text">{event.pickupInstructions}</p>
              </div>
            )}

            {/* Food section */}
            <div className="food-section">
              <div className="food-header">
                <h3 className="section-title">
                  <span className="info-icon" aria-hidden="true">🍱</span>
                  Available Food
                </h3>

                {/* Dietary tags */}
                <div className="dietary-tags">
                  {Array.isArray(event.dietaryTags) &&
                    event.dietaryTags.map((tag, i) => (
                      <span key={i} className="dietary-tag">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              {/* Serving capacity */}
              <div className="serving-info">
                <strong>Serving Capacity: {servingCapacity}</strong>
              </div>

              {/* Food items list */}
              <div className="food-list">
                {Array.isArray(event.foodItems) &&
                  event.foodItems.map((item, i) => (
                    <div key={i} className="food-item">
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
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onReserve?.(event.id)}
            >
              Confirm Pickup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetailModal;
