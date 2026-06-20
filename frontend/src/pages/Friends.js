import React, { useState, useEffect } from "react";
import API, { BASE_URL } from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function Friends() {
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFriends(parsedUser._id);
    }
  }, []);

  const fetchFriends = async (userId) => {
    try {
      setLoading(true);
      console.log("Fetching friends for user:", userId);
      const res = await API.get(`/friends/${userId}`);
      console.log("Friends API Response:", res.data);
      setFriends(res.data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error.response?.data || error.message);
      setFriends([]);
      alert("Error loading friends: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (user) {
      fetchFriends(user._id);
    }
  };

  const handleMessage = (friendId) => {
    navigate(`/messages/${friendId}`);
  };

  const handleUnfriend = async (friendId) => {
    const confirmUnfriend = window.confirm("Are you sure you want to remove this friend?");
    if (!confirmUnfriend) return;

    try {
      await API.delete(`/friend/${friendId}`, {
        data: { userId: user._id }
      });
      alert("✓ Friend removed!");
      fetchFriends(user._id);
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
          <div style={styles.headerSection}>
            <h2 style={styles.pageTitle}>My Friends ({friends.length})</h2>
            <button onClick={handleRefresh} style={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.loadingText}>Loading friends...</p>
          ) : friends.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No friends yet!</p>
              <p>Browse profiles and send friend requests to connect with others.</p>
              <button onClick={() => navigate("/browse")} style={styles.browseButton}>
                Browse Profiles
              </button>
            </div>
          ) : (
            <div style={styles.friendsList}>
              {friends.map((friendData) => {
                const friendUser = friendData.user;
                const friendProfile = friendData.profile;
                return (
                  <div key={friendUser._id} style={styles.friendCard}>
                    {friendProfile?.photo && (
                      <img
                        src={
                          friendProfile.photo.startsWith("http")
                            ? friendProfile.photo
                            : `${BASE_URL}${friendProfile.photo}`
                        }
                        alt={friendUser.name}
                        style={styles.friendPhoto}
                      />
                    )}
                    <div style={styles.friendInfo}>
                      <h3>{friendUser.name}</h3>
                      <p><strong>Email:</strong> {friendUser.email}</p>
                      <p><strong>Gender:</strong> {friendUser.gender}</p>
                      {friendProfile?.age && (
                        <p><strong>Age:</strong> {friendProfile.age}</p>
                      )}
                      {friendProfile?.bio && (
                        <p><strong>Bio:</strong> {friendProfile.bio}</p>
                      )}
                    </div>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handleMessage(friendUser._id)}
                        style={styles.messageButton}
                      >
                        💬 Message
                      </button>
                      <button
                        onClick={() => handleUnfriend(friendUser._id)}
                        style={styles.unfriendButton}
                      >
                        ✕ Unfriend
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
    backgroundImage: 'url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=900&fit=crop")',
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
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },
  pageTitle: {
    color: "white",
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
    margin: 0
  },
  loadingText: {
    color: "white",
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    fontSize: "16px"
  },
  refreshButton: {
    padding: "12px 24px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease"
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
  friendsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px"
  },
  friendCard: {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "box-shadow 0.2s",
    display: "flex",
    flexDirection: "column"
  },
  friendPhoto: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "15px"
  },
  friendInfo: {
    flex: 1,
    marginBottom: "15px"
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexDirection: "column"
  },
  messageButton: {
    padding: "10px 15px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background-color 0.2s"
  },
  unfriendButton: {
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

export default Friends;
