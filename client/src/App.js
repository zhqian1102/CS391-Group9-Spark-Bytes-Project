import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/LogIn/Login";
import EventsPage from "./pages/Events/EventsPage";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import "./App.css";
import PostEvent from "./pages/PostEvent/PostEvent";

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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
