import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileView from "./pages/ProfileView";
import BrowseProfiles from "./pages/BrowseProfiles";
import Messages from "./pages/Messages";
import FriendRequests from "./pages/FriendRequests";
import Friends from "./pages/Friends";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/browse" element={<BrowseProfiles />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:otherUserId" element={<Messages />} />
        <Route path="/friend-requests" element={<FriendRequests />} />
        <Route path="/friends" element={<Friends />} />
      </Routes>
    </Router>
  );
}

export default App;