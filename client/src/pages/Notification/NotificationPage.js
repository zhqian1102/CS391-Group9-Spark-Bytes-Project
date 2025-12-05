// NotificationPage.js
import React, { useState, useEffect } from "react";
import "./NotificationPage.css";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

const NotificationPage = () => {
  // Sample notification data, will be fetched from backend API later
  const [notifications, setNotifications] = useState([
    // {
    //   id: 1,
    //   userId: 'jen',
    //   userName: 'Jen',
    //   avatar: null, // Can set avatar URL
    //   message: 'reserved your food event "Spark! Demo Day"',
    //   timestamp: '2 mins ago',
    //   isRead: false,
    //   type: 'reservation'
    // },
    // {
    //   id: 2,
    //   userId: 'nick',
    //   userName: 'Nick',
    //   avatar: null,
    //   message: 'posted a new food event: Tech Meetup Luck!',
    //   timestamp: '10 mins ago',
    //   isRead: false,
    //   type: 'new_event'
    // },
    // {
    //   id: 3,
    //   userId: 'system',
    //   userName: '',
    //   avatar: null,
    //   message: 'All your food from "Spark! Demo Day" have been reserved!',
    //   timestamp: '10 mins ago',
    //   isRead: false,
    //   type: 'system'
    // },
    // {
    //   id: 4,
    //   userId: 'jen',
    //   userName: 'Jen',
    //   avatar: null,
    //   message: 'cancelled their reservation for your food event "Spark! Demo Day"',
    //   timestamp: '2 mins ago',
    //   isRead: false,
    //   type: 'cancellation'
    // }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user from AuthContext
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch notifications when component loads
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      setLoading(false);
      setError("Please log in to view notifications");
    }
  }, [userId]);

  // Fetch notifications from backend
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/notifications/user/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/user/${userId}/read-all`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      // Update local state
      setNotifications(
        notifications.map((notif) => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Mark single notification as read when clicked
  const handleNotificationClick = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }

      // Update local state
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Format timestamp to "X mins ago" format
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Get user avatar (initial letter or image)
  const getAvatar = (notification) => {
    // System notifications
    if (
      notification.type === "system" ||
      notification.type === "all_reserved"
    ) {
      return <div className="avatar system-avatar">B</div>;
    }

    // Get first letter from title for user avatar
    const firstChar = notification.title
      ? notification.title.charAt(0).toUpperCase()
      : "?";

    return <div className="avatar user-avatar">{firstChar}</div>;
  };

  // Format notification message
  const formatMessage = (notification) => {
    return <>{notification.message}</>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="notification-page">
        <NavigationBar />
        <main className="notification-content">
          <div className="notification-header">
            <h1 className="notification-title">New Notification</h1>
          </div>
          <p>Loading notifications...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="notification-page">
        <NavigationBar />
        <main className="notification-content">
          <div className="notification-header">
            <h1 className="notification-title">New Notification</h1>
          </div>
          <p>{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="notification-page">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Notification content area */}
      <main className="notification-content">
        <div className="notification-header">
          <h1 className="notification-title">New Notification</h1>
          <button className="mark-read-button" onClick={handleMarkAllAsRead}>
            Mark all as Read
          </button>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <p>No notifications yet</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => handleNotificationClick(notification.id)}
                style={{ cursor: "pointer" }}
              >
                {getAvatar(notification)}
                <div className="notification-content-text">
                  {formatMessage(notification)}
                </div>
                <div className="notification-meta">
                  <svg
                    className="clock-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 4v4l3 2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="notification-time">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                  {!notification.isRead && <span className="unread-dot"></span>}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
};

export default NotificationPage;
