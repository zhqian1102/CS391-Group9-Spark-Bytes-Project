// NotificationPage.js
import React, { useState } from 'react';
import './NotificationPage.css';
import NavigationBar from './NavigationBar';
import Footer from './Footer';

const NotificationPage = () => {
  // Sample notification data, will be fetched from backend API later
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      userId: 'jen',
      userName: 'Jen',
      avatar: null, // Can set avatar URL
      message: 'reserved your food event "Spark! Demo Day"',
      timestamp: '2 mins ago',
      isRead: false,
      type: 'reservation'
    },
    {
      id: 2,
      userId: 'nick',
      userName: 'Nick',
      avatar: null,
      message: 'posted a new food event: Tech Meetup Luck!',
      timestamp: '10 mins ago',
      isRead: false,
      type: 'new_event'
    },
    {
      id: 3,
      userId: 'system',
      userName: '',
      avatar: null,
      message: 'All your food from "Spark! Demo Day" have been reserved!',
      timestamp: '10 mins ago',
      isRead: false,
      type: 'system'
    },
    {
      id: 4,
      userId: 'jen',
      userName: 'Jen',
      avatar: null,
      message: 'cancelled their reservation for your food event "Spark! Demo Day"',
      timestamp: '2 mins ago',
      isRead: false,
      type: 'cancellation'
    }
  ]);

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    // TODO: Call backend API to mark as read
    // await fetch('/api/notifications/mark-all-read', { method: 'POST' });
  };

  // Get user avatar (initial letter or image)
  const getAvatar = (notification) => {
    if (notification.type === 'system') {
      return <div className="avatar system-avatar">B</div>;
    }
    
    if (notification.avatar) {
      return <img src={notification.avatar} alt={notification.userName} className="avatar" />;
    }
    
    return (
      <div className="avatar user-avatar">
        {notification.userName.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Format notification message
  const formatMessage = (notification) => {
    return (
      <>
        <span className="user-name">{notification.userName}</span>
        {' '}{notification.message}
      </>
    );
  };

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
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              {getAvatar(notification)}
              <div className="notification-content-text">
                {formatMessage(notification)}
              </div>
              <div className="notification-meta">
                <svg className="clock-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="notification-time">{notification.timestamp}</span>
                {!notification.isRead && <span className="unread-dot"></span>}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
};

export default NotificationPage;