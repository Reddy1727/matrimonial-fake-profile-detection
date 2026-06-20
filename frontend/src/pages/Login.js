import React, { useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }
      const res = await API.post("/auth/login", { 
        email, 
        password 
      });
      alert("Login successful!");
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // Redirect to dashboard
      navigate("/dashboard");
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
              src="/images/login.svg" 
              alt="Login" 
              style={styles.image}
            />
          </div>
          <form onSubmit={handleLogin} style={styles.container}>
            <h2>Login</h2>

          <input 
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)} 
          />

          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)} 
          />

          <button type="submit" style={styles.button}>Login</button>
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
    backgroundImage: 'url("https://pixabay.com/photos/marriage-wedding-flower-engaged-4667699/")',
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
    maxWidth: "900px",
    width: "100%"
  },
  imageContainer: {
    width: "280px",
    height: "280px",
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
    width: "350px",
    gap: "12px",
    padding: "40px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 2,
    animation: "slideIn 0.5s ease-out"
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

export default Login;