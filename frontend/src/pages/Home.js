import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect logged-in users to dashboard
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.heroContainer}>
        <div style={styles.overlay}></div>
        <div style={styles.content}>
          <h1 style={styles.title}>Welcome to Matrimonial App 💍</h1>
          <p style={styles.subtitle}>Find your perfect match with AI-powered fake profile detection.</p>
          <p style={styles.description}>
            Our advanced detection system uses machine learning to identify fake profiles and keep you safe.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    margin: 0,
    padding: 0
  },
  heroContainer: {
    backgroundImage: 'url("https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&h=900&fit=crop")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "calc(100vh - 70px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
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
  content: {
    textAlign: "center",
    color: "white",
    zIndex: 2,
    maxWidth: "700px",
    padding: "40px 20px",
    animation: "fadeIn 1s ease-in"
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "20px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
    animation: "slideDown 0.8s ease-out"
  },
  subtitle: {
    fontSize: "28px",
    marginBottom: "30px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
    animation: "slideUp 0.8s ease-out 0.2s both"
  },
  description: {
    fontSize: "16px",
    marginBottom: "30px",
    lineHeight: "1.6",
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    animation: "slideUp 0.8s ease-out 0.4s both"
  }
};

export default Home;