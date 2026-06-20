import React, { useState, useEffect } from "react";
import API, { BASE_URL } from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    photo: null,
    age: "",
    bio: ""
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchProfile(parsedUser._id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const res = await API.get(`/profile/${userId}`);
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setProfile(res.data.profile);
      setFormData({
        photo: null,
        age: res.data.profile?.age || "",
        bio: res.data.profile?.bio || ""
      });
      if (res.data.profile?.photo) {
        setPhotoPreview(`${BASE_URL}${res.data.profile.photo}`);
      }
    } catch (error) {
      console.log("Profile not found, will create new one");
    }
  };



  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({...formData, photo: file});
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const uploadData = new FormData();
      if (formData.photo) {
        uploadData.append("photo", formData.photo);
      }
      if (formData.age) {
        uploadData.append("age", formData.age);
      }
      if (formData.bio) {
        uploadData.append("bio", formData.bio);
      }

      await API.put(`/profile/${user._id}`, uploadData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      alert("Profile updated successfully!");
      setEditing(false);
      fetchProfile(user._id);
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };



  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all associated data (messages, friend requests, profile).\n\nAre you absolutely sure you want to delete your account?"
    );

    if (!confirmDelete) return;

    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;

    try {
      await API.delete(`/auth/delete/${user._id}`, {
        data: { password }
      });
      alert("✓ Your account has been permanently deleted.");
      localStorage.removeItem("user");
      navigate("/");
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
          <h2>My Profile</h2>
          
          {photoPreview && (
            <div style={styles.photoContainer}>
              <img src={photoPreview} alt="Profile" style={styles.photo} />
            </div>
          )}

          <div style={styles.profileInfo}>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Gender:</strong> {user.gender}</p>
            <p><strong>About:</strong> {user.about}</p>
            <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
            <p><strong>Bio:</strong> {profile?.bio || "Not set"}</p>
          </div>

          {!editing ? (
            <div style={styles.buttonGroup}>
              <button onClick={() => setEditing(true)} style={styles.button}>
                Edit Profile
              </button>
            </div>
          ) : (
            <div style={styles.editForm}>
              <h3>Edit Profile</h3>
              
              <div style={styles.fileInputContainer}>
                <label style={styles.fileLabel}>Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={styles.fileInput}
                />
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" style={styles.previewPhoto} />
                )}
              </div>

              <input
                placeholder="Age"
                type="number"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                style={styles.input}
              />
              <textarea
                placeholder="Bio"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                style={styles.textarea}
              />
              <button onClick={handleUpdateProfile} style={styles.button}>
                Save Changes
              </button>
              <button onClick={() => setEditing(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          )}

          <button 
            onClick={handleDeleteAccount}
            style={styles.deleteButton}
          >
            🗑️ Delete Account Permanently
          </button>
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
    backgroundImage: 'url("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600&h=900&fit=crop")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "calc(100vh - 70px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "40px 20px"
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1
  },
  container: {
    maxWidth: "600px",
    padding: "40px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 2,
    animation: "slideIn 0.5s ease-out"
  },
  photoContainer: {
    textAlign: "center",
    marginBottom: "20px"
  },
  photo: {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "8px",
    objectFit: "cover",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  profileInfo: {
    marginBottom: "20px",
    lineHeight: "1.8"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "10px",
    transition: "all 0.3s ease",
    fontWeight: "bold"
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#ccc",
    color: "black",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "bold"
  },
  editForm: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #eee"
  },
  fileInputContainer: {
    marginBottom: "15px",
    padding: "15px",
    border: "2px dashed #FF4472",
    borderRadius: "8px",
    textAlign: "center"
  },
  fileLabel: {
    display: "block",
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#FF4472"
  },
  fileInput: {
    display: "block",
    margin: "10px auto",
    padding: "8px"
  },
  previewPhoto: {
    maxWidth: "150px",
    maxHeight: "150px",
    marginTop: "10px",
    borderRadius: "8px",
    objectFit: "cover",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px"
  },
  textarea: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
    minHeight: "80px",
    fontSize: "14px",
    fontFamily: "inherit"
  },
  deleteButton: {
    marginTop: "20px",
    padding: "12px 20px",
    backgroundColor: "#d32f2f",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    transition: "background-color 0.3s ease"
  }
};

export default Dashboard;