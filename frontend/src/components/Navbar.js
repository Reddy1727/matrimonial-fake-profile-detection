import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Navbar() {
  const [user, setUser] = useState(null);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFriendRequestCount(parsedUser._id);
      
      // Poll for new friend requests every 30 seconds
      const interval = setInterval(() => {
        fetchFriendRequestCount(parsedUser._id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const fetchFriendRequestCount = async (userId) => {
    try {
      const res = await API.get(`/friend-requests/${userId}`);
      const pending = (res.data.requests || []).filter(req => req.status === 'pending').length;
      setFriendRequestCount(pending);
    } catch (error) {
      console.error("Error fetching friend request count:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>Matrimonial App</h2>
      <div style={styles.navLinks}>
        {!user && <Link to="/" style={styles.link}>Home</Link>}
        {user ? (
          <>
            <Link to="/dashboard" style={styles.link}>Profile</Link>
            <Link to="/browse" style={styles.link}>Browse Profiles</Link>
            <Link to="/friend-requests" style={styles.friendRequestLink}>
              Friend Requests
              {friendRequestCount > 0 && (
                <span style={styles.badge}>{friendRequestCount}</span>
              )}
            </Link>
            <Link to="/friends" style={styles.link}>Friends</Link>
            <Link to="/messages" style={styles.link}>Messages</Link>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register" style={styles.link}>Register</Link>
            <Link to="/login" style={styles.link}>Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    backgroundColor: "#FF4472",
    color: "white",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  logo: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    transition: "transform 0.3s ease"
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "25px"
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "15px",
    transition: "all 0.3s ease",
    padding: "8px 12px",
    borderRadius: "4px"
  },
  friendRequestLink: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    padding: "8px 12px",
    borderRadius: "4px",
    transition: "all 0.3s ease"
  },
  badge: {
    backgroundColor: "#FFD700",
    color: "#FF4472",
    borderRadius: "50%",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
    minHeight: "24px",
    animation: "pulse 2s infinite"
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "white",
    color: "#FF4472",
    border: "none",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
  }
};

export default Navbar;