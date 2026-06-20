import React, { useState, useEffect, useCallback, useMemo } from "react";
import API, { BASE_URL } from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function BrowseProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [user, setUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState({});
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    gender: "",
    minAge: "",
    maxAge: ""
  });
  const navigate = useNavigate();

  const checkFriendStatus = useCallback(async (userId1, userId2) => {
    try {
      const res = await API.get(
        `/friend-status?userId1=${userId1}&userId2=${userId2}`
      );
      return res.data;
    } catch (error) {
      console.error("Error checking friend status:", error);
      return { isFriend: false, status: "none" };
    }
  }, []);

  const fetchProfiles = useCallback(async (userId) => {
    try {
      const res = await API.get(`/profiles?userId=${userId}`);
      setProfiles(res.data.profiles);
      // Suggestion: The backend should ideally include 'friendStatus' 
      // inside the profileData object to avoid sequential await calls in a loop.
      if (res.data.statuses) {
          setFriendStatus(res.data.statuses);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchProfiles(parsedUser._id);
    } else {
      navigate("/login");
    }
  }, [navigate, fetchProfiles]);

  const handleSendFriendRequest = async (toUserId) => {
    try {
      await API.post("/friend-request", {
        fromUserId: user._id,
        toUserId: toUserId
      });
      // Update friend status
      const newStatus = await checkFriendStatus(user._id, toUserId);
      setFriendStatus({
        ...friendStatus,
        [toUserId]: newStatus
      });
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Error sending friend request: " + (error.response?.data?.error || error.message));
    }
  };

  const handleSendMessage = (toUserId) => {
    navigate(`/messages/${toUserId}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters({
      ...searchFilters,
      [name]: value
    });
  };

  const handleClearFilters = () => {
    setSearchFilters({
      name: "",
      gender: "",
      minAge: "",
      maxAge: ""
    });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profileData) => {
      const { user: otherUser, profile } = profileData;
      const matchesName = otherUser.name.toLowerCase().includes(searchFilters.name.toLowerCase());
      const matchesGender = searchFilters.gender === "" || otherUser.gender === searchFilters.gender;
      const age = profile?.age || 0;
      const matchesMinAge = searchFilters.minAge === "" || age >= parseInt(searchFilters.minAge);
      const matchesMaxAge = searchFilters.maxAge === "" || age <= parseInt(searchFilters.maxAge);
      
      return matchesName && matchesGender && matchesMinAge && matchesMaxAge;
    });
  }, [profiles, searchFilters]);

  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.backgroundContainer}>
        <div style={styles.overlay}></div>
        <div style={styles.container}>
          <h2 style={styles.pageTitle}>Browse Profiles</h2>
          
          {/* Search Filters Section */}
          <div style={styles.searchSection}>
            <h3>Search Profiles</h3>
            <div style={styles.filtersGrid}>
              <div style={styles.filterGroup}>
                <label htmlFor="name">Name:</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter name"
                  value={searchFilters.name}
                  onChange={handleFilterChange}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.filterGroup}>
                <label htmlFor="gender">Gender:</label>
                <select
                  id="gender"
                  name="gender"
                  value={searchFilters.gender}
                  onChange={handleFilterChange}
                  style={styles.input}
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={styles.filterGroup}>
                <label htmlFor="minAge">Min Age:</label>
                <input
                  id="minAge"
                  type="number"
                  name="minAge"
                  placeholder="Min age"
                  value={searchFilters.minAge}
                  onChange={handleFilterChange}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.filterGroup}>
                <label htmlFor="maxAge">Max Age:</label>
                <input
                  id="maxAge"
                  type="number"
                  name="maxAge"
                  placeholder="Max age"
                  value={searchFilters.maxAge}
                  onChange={handleFilterChange}
                  style={styles.input}
                />
              </div>
              
              <button
                onClick={handleClearFilters}
                style={styles.clearButton}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div style={styles.resultsInfo}>
            <p>Found {filteredProfiles.length} profile(s)</p>
          </div>

          <div style={styles.profilesGrid}>
            {filteredProfiles.map((profileData) => {
              const { user: otherUser, profile } = profileData;
              const status = friendStatus[otherUser._id];
              const isFriend = status?.isFriend;
              const requestStatus = status?.status;

              return (
              <div key={otherUser._id} style={styles.profileCard}>
                {profile?.photo && (
                  <img 
                    src={profile.photo.startsWith("http") ? profile.photo : `${BASE_URL}${profile.photo}`} 
                    alt={otherUser.name} 
                    style={styles.photo} 
                  />
                )}
                <div style={styles.cardContent}>
                  <h3>{otherUser.name}</h3>
                  <p><strong>Gender:</strong> {otherUser.gender}</p>
                  <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
                  <p><strong>Email:</strong> {otherUser.email}</p>
                  {profile?.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
                </div>
                <div style={styles.cardActions}>
                  {isFriend ? (
                    <button
                      onClick={() => handleSendMessage(otherUser._id)}
                      style={styles.button}
                    >
                      Send Message
                    </button>
                  ) : requestStatus === "pending" ? (
                    <button
                      disabled
                      style={{ ...styles.button, opacity: 0.6, cursor: "not-allowed" }}
                  >
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendFriendRequest(otherUser._id)}
                    style={{ ...styles.button, backgroundColor: "#2196F3" }}
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
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
    backgroundImage: 'url("https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1600&h=900&fit=crop")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    position: "relative"
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
    padding: "40px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },
  pageTitle: {
    color: "white",
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
    marginBottom: "30px"
  },
  searchSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginTop: "15px"
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column"
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "border-color 0.3s ease"
  },
  clearButton: {
    padding: "12px 20px",
    backgroundColor: "#666",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    alignSelf: "flex-end",
    transition: "all 0.3s ease",
    fontWeight: "bold"
  },
  resultsInfo: {
    marginBottom: "20px",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
  },
  profilesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "20px"
  },
  profileCard: {
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "white",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer"
  },
  photo: {
    width: "100%",
    height: "250px",
    objectFit: "cover"
  },
  cardContent: {
    padding: "15px"
  },
  cardActions: {
    padding: "10px 15px",
    borderTop: "1px solid #ddd"
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  }
};

export default BrowseProfiles;
