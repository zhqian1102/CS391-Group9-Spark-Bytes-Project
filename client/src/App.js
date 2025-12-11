import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/LogIn/Login";
import EventsPage from "./pages/Events/EventsPage";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import OrganizerDashboard from "./pages/Dashboard/OrganizerDashboard";
import PostEvent from "./pages/PostEvent/PostEvent";
import NotificationPage from "./pages/Notification/NotificationPage";
import AboutPage from "./pages/About/AboutPage";
import UserProfile from "./pages/UserProfile/UserProfile";
import EditEventPage from "./pages/EditEvent/EditEvent";
import ViewAttendeesPage from "./pages/ViewAttendees/ViewAttendees";
import "./App.css";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/post"
              element={
                <PrivateRoute>
                  <PostEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/userdashboard"
              element={
                <PrivateRoute>
                  <UserDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizerdashboard"
              element={
                <PrivateRoute>
                  <OrganizerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <NotificationPage />
                </PrivateRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/editevent/:id"
              element={
                <PrivateRoute>
                  <EditEventPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/viewattendees/:id"
              element={
                <PrivateRoute>
                  <ViewAttendeesPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
