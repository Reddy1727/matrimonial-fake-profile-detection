import React, { useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    about: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (!form.name || !form.email || !form.phone || !form.gender || !form.password) {
        alert("Please fill all required fields");
        return;
      }
      await API.post("/auth/register", form);
      alert("Account created successfully! You can now login.");
      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        gender: "",
        about: "",
        password: ""
      });
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.backgroundContainer}>
        <div style={styles.overlay}></div>
        <div style={styles.contentWrapper}>
          <div style={styles.imageContainer}>
            <img 
              src="/images/register.svg" 
              alt="Register" 
              style={styles.image}
            />
          </div>
          <form onSubmit={handleSubmit} style={styles.container}>
            <h2>Create Account</h2>

          <input 
            placeholder="Full Name" 
            required
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})} 
          />

          <input 
            placeholder="Email" 
            type="email"
            required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} 
          />

          <input 
            placeholder="Phone Number" 
            type="tel"
            required
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})} 
          />

          <select 
            required
            value={form.gender}
            onChange={e => setForm({...form, gender: e.target.value})}
            style={styles.select}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <textarea 
            placeholder="About Yourself"
            value={form.about}
            onChange={e => setForm({...form, about: e.target.value})} 
            style={styles.textarea}
          />

          <input 
            placeholder="Password" 
            type="password"
            required
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
          />

          <button type="submit" style={styles.button}>Register</button>
          </form>
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
    backgroundImage: 'url("https://pixabay.com/photos/heart-wedding-marriage-529607/")',
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1
  },
  contentWrapper: {
    display: "flex",
    gap: "40px",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    flexWrap: "wrap",
    maxWidth: "1000px",
    width: "100%"
  },
  imageContainer: {
    width: "300px",
    height: "300px",
    flexShrink: 0,
    display: "flex"
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 8px 32px rgba(0, 0, 0, 0.2))"
  },
  container: {
    display: "flex",
    flexDirection: "column",
    width: "380px",
    gap: "12px",
    padding: "40px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 2,
    animation: "slideIn 0.5s ease-out"
  },
  select: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit"
  },
  textarea: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "80px",
    fontFamily: "inherit",
    resize: "vertical"
  },
  button: {
    padding: "12px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease"
  }
};

export default Register;