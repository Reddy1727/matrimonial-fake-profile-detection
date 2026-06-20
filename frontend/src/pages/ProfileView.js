import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

function ProfileView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={styles.loadingContainer}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={styles.imageSection}>
            <img 
              src="/images/profile.svg" 
              alt="Profile" 
              style={styles.profileImage}
            />
          </div>
          
          <div style={styles.profileSection}>
            <div style={styles.headerSection}>
              <h1 style={styles.title}>My Profile</h1>
              <p style={styles.subtitle}>View and manage your matrimonial profile</p>
            </div>

            {user ? (
              <div style={styles.profileCard}>
                <div style={styles.infoRow}>
                  <label style={styles.label}>Name:</label>
                  <span style={styles.value}>{user.name}</span>
                </div>

                <div style={styles.infoRow}>
                  <label style={styles.label}>Email:</label>
                  <span style={styles.value}>{user.email}</span>
                </div>

                <div style={styles.infoRow}>
                  <label style={styles.label}>Phone:</label>
                  <span style={styles.value}>{user.phone}</span>
                </div>

                <div style={styles.infoRow}>
                  <label style={styles.label}>Gender:</label>
                  <span style={styles.value}>{user.gender}</span>
                </div>

                {user.about && (
                  <div style={styles.infoRow}>
                    <label style={styles.label}>About:</label>
                    <span style={styles.value}>{user.about}</span>
                  </div>
                )}

                <div style={styles.actionButtons}>
                  <button style={styles.button}>Edit Profile</button>
                  <button style={{ ...styles.button, ...styles.secondaryButton }}>
                    View Matches
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.profileCard}>
                <p style={styles.noDataMessage}>
                  No profile data found. Please log in to view your profile.
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>Profile Views</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>Matches Found</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>Messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "calc(100vh - 70px)",
    backgroundColor: "#f8f9fa",
    padding: "40px 20px"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "100px 20px",
    fontSize: "18px",
    color: "#666"
  },
  contentWrapper: {
    display: "flex",
    gap: "40px",
    alignItems: "flex-start",
    justifyContent: "center",
    maxWidth: "1100px",
    margin: "0 auto",
    flexWrap: "wrap"
  },
  imageSection: {
    width: "320px",
    height: "320px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    overflow: "hidden"
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "20px"
  },
  profileSection: {
    flex: 1,
    minWidth: "300px"
  },
  headerSection: {
    marginBottom: "30px"
  },
  title: {
    fontSize: "32px",
    color: "#FF4472",
    margin: "0 0 10px 0"
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    margin: 0
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    marginBottom: "30px"
  },
  infoRow: {
    display: "flex",
    marginBottom: "20px",
    alignItems: "flex-start"
  },
  label: {
    fontWeight: "bold",
    color: "#FF4472",
    minWidth: "100px",
    fontSize: "14px"
  },
  value: {
    color: "#333",
    flex: 1,
    fontSize: "14px"
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #eee"
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  secondaryButton: {
    backgroundColor: "#4FC3F7",
    marginLeft: "auto"
  },
  noDataMessage: {
    textAlign: "center",
    color: "#999",
    fontSize: "16px",
    padding: "40px 20px"
  },
  statsSection: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    maxWidth: "1100px",
    margin: "0 auto",
    flexWrap: "wrap"
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px 40px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    minWidth: "200px",
    flex: "1 1 200px"
  },
  statNumber: {
    fontSize: "32px",
    color: "#FF4472",
    margin: "0 0 10px 0"
  },
  statLabel: {
    color: "#666",
    margin: 0,
    fontSize: "14px"
  }
};

export default ProfileView;