import React, { useState, useEffect } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFriendRequests(parsedUser._id);
    }
  }, []);

  const fetchFriendRequests = async (userId) => {
    try {
      setLoading(true);
      const res = await API.get(`/friend-requests/${userId}`);
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await API.put(`/friend-request/${requestId}/accept`);
      alert("✓ Friend request accepted!");
      fetchFriendRequests(user._id);
    } catch (error) {
      alert("❌ Error: " + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (requestId) => {
    try {
      await API.put(`/friend-request/${requestId}/reject`);
      alert("✓ Friend request rejected!");
      fetchFriendRequests(user._id);
    } catch (error) {
      alert("❌ Error: " + (error.response?.data?.error || error.message));
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.backgroundContainer}>
        <div style={styles.overlay}></div>
        <div style={styles.container}>
          <h2 style={styles.pageTitle}>Friend Requests ({requests.length})</h2>

          {loading ? (
            <p style={styles.loadingText}>Loading friend requests...</p>
          ) : requests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No friend requests yet!</p>
              <p>Browse profiles and send friend requests to connect with others.</p>
              <button onClick={() => navigate("/browse")} style={styles.browseButton}>
                Browse Profiles
              </button>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {requests.map((request) => {
                const requester = request.fromUser;
                return (
                  <div key={request._id} style={styles.requestCard}>
                    <div style={styles.userInfo}>
                      <h3>{requester.name}</h3>
                      <p><strong>Email:</strong> {requester.email}</p>
                      <p><strong>Gender:</strong> {requester.gender}</p>
                      {request.fromUserProfile?.age && (
                        <p><strong>Age:</strong> {request.fromUserProfile.age}</p>
                      )}
                      {request.fromUserProfile?.bio && (
                        <p><strong>Bio:</strong> {request.fromUserProfile.bio}</p>
                      )}
                    </div>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleAccept(request._id)}
                        style={styles.acceptButton}
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        style={styles.rejectButton}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    margin: 0,
    padding: 0
  },
  backgroundContainer: {
    backgroundImage: 'url("https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&h=900&fit=crop")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "calc(100vh - 70px)",
    position: "relative",
    padding: "40px 20px"
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },
  pageTitle: {
    color: "white",
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
    marginBottom: "30px"
  },
  loadingText: {
    color: "white",
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    fontSize: "16px"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    color: "#888",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
  },
  browseButton: {
    marginTop: "20px",
    padding: "12px 24px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.3s ease"
  },
  requestsList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  requestCard: {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "box-shadow 0.2s"
  },
  userInfo: {
    flex: 1
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexDirection: "column"
  },
  acceptButton: {
    padding: "10px 15px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background-color 0.2s"
  },
  rejectButton: {
    padding: "10px 15px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background-color 0.2s"
  }
};

export default FriendRequests;
