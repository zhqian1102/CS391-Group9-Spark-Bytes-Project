import React from "react";
import { LOCATION_MAP } from "../config/locationMap";
import "./EventLocationMap.css";

const EventLocationMap = ({ locationCode }) => {
  // Return nothing if no location code provided
  if (!locationCode) {
    return null;
  }

  // Look up location details from mapping
  const locationDetails = LOCATION_MAP[locationCode];

  // Return nothing if location code not in our mapping
  if (!locationDetails) {
    return null;
  }

  const { label } = locationDetails;

  // Use building name for Google Maps search
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(label)}&output=embed`;

  return (
    <div className="event-location-map">
      <div className="map-container">
        <iframe
          title={`Map of ${label}`}
          src={mapUrl}
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="map-caption">
        <span className="map-icon">📍</span>
        <span className="map-label">{label}</span>
      </div>
    </div>
  );
};

export default EventLocationMap;