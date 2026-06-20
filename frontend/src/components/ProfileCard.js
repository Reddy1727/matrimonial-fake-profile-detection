import React from "react";
import FakeStatus from "./FakeStatus";

function ProfileCard({ user }) {
  return (
    <div style={styles.card}>
      <img
        src={user.photo || "https://via.placeholder.com/150"}
        alt="profile"
        style={styles.image}
      />

      <h3>{user.name}</h3>
      <p>Age: {user.age}</p>
      <p>{user.bio}</p>

      {/* Fake Detection Status */}
      <FakeStatus status={user.status} />
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "15px",
    margin: "10px",
    width: "250px",
    textAlign: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
  },
  image: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px"
  }
};

export default ProfileCard;