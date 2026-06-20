import React from "react";

function FakeStatus({ status }) {
  let color = "gray";
  let text = "Unknown";

  if (status === "Real") {
    color = "green";
    text = "✅ Genuine Profile";
  } else if (status === "Fake") {
    color = "red";
    text = "❌ Fake Profile";
  } else if (status === "Suspicious") {
    color = "orange";
    text = "⚠️ Suspicious";
  }

  return (
    <div style={{ ...styles.box, backgroundColor: color }}>
      {text}
    </div>
  );
}

const styles = {
  box: {
    marginTop: "10px",
    padding: "8px",
    color: "white",
    borderRadius: "5px",
    fontWeight: "bold"
  }
};

export default FakeStatus;