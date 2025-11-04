import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/LogIn/Login";
import EventsPage from "./pages/Events/EventsPage";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import PostEvent from "./pages/PostEvent/PostEvent";
import NotificationPage from "./components/NotificationPage";
import AboutPage from "./pages/About/AboutPage";
import UserProfile from "./pages/UserProfile/UserProfile";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/post" element={<PostEvent />} />
            <Route path="/userdashboard" element={<UserDashboard />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;