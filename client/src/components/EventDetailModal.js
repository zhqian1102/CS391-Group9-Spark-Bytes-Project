// EventDetailModal.js
import React, { useEffect, useRef } from 'react';
import './EventDetailModal.css';

const EventDetailModal = ({ event, open, onClose, onReserve }) => {
  const dialogRef = useRef(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const stopPropagation = (e) => e.stopPropagation();

  if (!open || !event) return null;

  const servingCapacity = event.totalSpots;

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
            {event.image && (
              <img
                src={event.image}
                alt={event.title || 'Event image'}
                loading="lazy"
              />
            )}
            <div className="modal-spots-badge">{event.spotsLeft} Spots Left</div>
          </div>

          {/* Body */}
          <div className="modal-body">
            <h2 id="modal-event-detail-title" className="modal-event-title">
              {event.title}
            </h2>

            {/* Basic info */}
            <div className="modal-event-info">
              <div className="modal-info-item">
                <span className="modal-info-icon" aria-hidden="true">📅</span>
                <span>Saturday, {event.date}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-icon" aria-hidden="true">🕐</span>
                <span>{event.time}</span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-icon" aria-hidden="true">📍</span>
                <span>{event.location}</span>
              </div>
            </div>

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
                  <span className="modal-info-icon" aria-hidden="true">ℹ️</span>
                  Pickup Instructions
                </h3>
                <p className="modal-pickup-text">{event.pickupInstructions}</p>
              </div>
            )}

            {/* Food section */}
            <div className="modal-food-section">
              <div className="modal-food-header">
                <h3 className="modal-section-title">
                  <span className="modal-info-icon" aria-hidden="true">🍱</span>
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
                <strong>Serving Capacity: {servingCapacity}</strong>
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
              className="modal-btn modal-btn-primary"
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