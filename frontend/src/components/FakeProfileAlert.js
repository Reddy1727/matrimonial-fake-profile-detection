import React, { useState } from "react";

function FakeProfileAlert({ fakeScore, genuineScore, riskLevel, prediction, confidence, analysis, breakdown }) {
  const [showDetails, setShowDetails] = useState(false);

  const getAlertStyle = (risk) => {
    if (risk === "High") return "#f44336"; // Red
    if (risk === "Medium") return "#ff9800"; // Orange
    return "#2196F3"; // Blue
  };

  const getAlertBgStyle = (risk) => {
    if (risk === "High") return "#ffebee"; // Light red
    if (risk === "Medium") return "#fff3e0"; // Light orange
    return "#e3f2fd"; // Light blue
  };

  const getPredictionColor = (pred) => {
    if (pred === "LIKELY FAKE") return "#d32f2f";
    if (pred === "SUSPICIOUS") return "#f57c00";
    if (pred === "UNCERTAIN") return "#1976d2";
    return "#388e3c"; // Green for genuine
  };

  const borderColor = getAlertStyle(riskLevel);
  const bgColor = getAlertBgStyle(riskLevel);

  return (
    <div style={styles.alertContainer(bgColor, borderColor)}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.predictionSection}>
          <div style={styles.predictionBadge(getPredictionColor(prediction))}>
            {prediction}
          </div>
          <span style={styles.confidence}>
            {confidence}% Confidence
          </span>
        </div>
        <div style={styles.scoreDisplay}>
          <div style={styles.scoreItem}>
            <span style={styles.scoreLabel}>Genuine</span>
            <div style={styles.scoreBar}>
              <div
                style={{
                  ...styles.scoreBarFill,
                  width: `${genuineScore}%`,
                  backgroundColor: "#4CAF50"
                }}
              />
            </div>
            <span style={styles.percentage}>{genuineScore}%</span>
          </div>
          <div style={styles.scoreItem}>
            <span style={styles.scoreLabel}>Fake</span>
            <div style={styles.scoreBar}>
              <div
                style={{
                  ...styles.scoreBarFill,
                  width: `${fakeScore}%`,
                  backgroundColor: "#f44336"
                }}
              />
            </div>
            <span style={styles.percentage}>{fakeScore}%</span>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={styles.detailsToggle}
      >
        {showDetails ? "▼ Hide Details" : "▶ Show Detailed Analysis"}
      </button>

      {showDetails && analysis && (
        <div style={styles.detailsSection}>
          {/* Profile Completeness */}
          {analysis.profileCompleteness && (
            <div style={styles.categoryBox}>
              <h4 style={styles.categoryTitle}>
                📋 Profile Completeness
                <span style={styles.categoryScore}>
                  {analysis.profileCompleteness.score}/{analysis.profileCompleteness.maxScore}
                </span>
              </h4>
              <ul style={styles.detailsList}>
                {analysis.profileCompleteness.details.map((detail, idx) => (
                  <li key={idx} style={styles.detailItem}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Account Age */}
          {analysis.accountAge && (
            <div style={styles.categoryBox}>
              <h4 style={styles.categoryTitle}>
                ⏰ Account Age
                <span style={styles.categoryScore}>
                  {analysis.accountAge.score}/{analysis.accountAge.maxScore}
                </span>
              </h4>
              <ul style={styles.detailsList}>
                {analysis.accountAge.details.map((detail, idx) => (
                  <li key={idx} style={styles.detailItem}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messaging Behavior */}
          {analysis.messagingBehavior && (
            <div style={styles.categoryBox}>
              <h4 style={styles.categoryTitle}>
                💬 Messaging Behavior
                <span style={styles.categoryScore}>
                  {analysis.messagingBehavior.score}/{analysis.messagingBehavior.maxScore}
                </span>
              </h4>
              <ul style={styles.detailsList}>
                {analysis.messagingBehavior.details.map((detail, idx) => (
                  <li key={idx} style={styles.detailItem}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search Behavior */}
          {analysis.searchBehavior && (
            <div style={styles.categoryBox}>
              <h4 style={styles.categoryTitle}>
                🔍 Search Behavior
                <span style={styles.categoryScore}>
                  {analysis.searchBehavior.score}/{analysis.searchBehavior.maxScore}
                </span>
              </h4>
              <ul style={styles.detailsList}>
                {analysis.searchBehavior.details.map((detail, idx) => (
                  <li key={idx} style={styles.detailItem}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bio Content */}
          {analysis.bioContent && (
            <div style={styles.categoryBox}>
              <h4 style={styles.categoryTitle}>
                📝 Bio Content
                <span style={styles.categoryScore}>
                  {analysis.bioContent.score}/{analysis.bioContent.maxScore}
                </span>
              </h4>
              <ul style={styles.detailsList}>
                {analysis.bioContent.details.map((detail, idx) => (
                  <li key={idx} style={styles.detailItem}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Score Breakdown */}
          {breakdown && (
            <div style={styles.breakdownBox}>
              <h4 style={styles.breakdownTitle}>Score Breakdown</h4>
              <div style={styles.breakdownItems}>
                <div style={styles.breakdownItem}>
                  <span>Profile Completeness:</span>
                  <strong>{breakdown.profileCompleteness}/30</strong>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Account Age:</span>
                  <strong>{breakdown.accountAge}/20</strong>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Messaging Behavior:</span>
                  <strong>{breakdown.messagingBehavior}/25</strong>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Search Behavior:</span>
                  <strong>{breakdown.searchBehavior}/15</strong>
                </div>
                <div style={styles.breakdownItem}>
                  <span>Bio Content:</span>
                  <strong>{breakdown.bioContent}/10</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  alertContainer: (bgColor, borderColor) => ({
    backgroundColor: bgColor,
    border: `3px solid ${borderColor}`,
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "15px",
    width: "100%",
    boxSizing: "border-box"
  }),
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  predictionSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  predictionBadge: (color) => ({
    color: "white",
    backgroundColor: color,
    padding: "8px 14px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "14px"
  }),
  confidence: {
    fontWeight: "bold",
    fontSize: "13px",
    color: "#444"
  },
  scoreDisplay: {
    display: "flex",
    gap: "20px",
    minWidth: "300px"
  },
  scoreItem: {
    flex: 1
  },
  scoreLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#555",
    display: "block",
    marginBottom: "4px"
  },
  scoreBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#ddd",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "4px"
  },
  scoreBarFill: {
    height: "100%",
    transition: "width 0.3s ease"
  },
  percentage: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333"
  },
  detailsToggle: {
    width: "100%",
    padding: "10px",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    color: "#333",
    marginTop: "8px",
    transition: "all 0.3s ease"
  },
  detailsSection: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(0,0,0,0.1)"
  },
  categoryBox: {
    backgroundColor: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "10px"
  },
  categoryTitle: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  categoryScore: {
    backgroundColor: "#e0e0e0",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  detailsList: {
    margin: "0",
    paddingLeft: "20px",
    fontSize: "12px",
    color: "#555"
  },
  detailItem: {
    marginBottom: "6px",
    lineHeight: "1.4"
  },
  breakdownBox: {
    backgroundColor: "rgba(255,255,255,0.8)",
    border: "2px solid #ddd",
    borderRadius: "6px",
    padding: "12px",
    marginTop: "10px"
  },
  breakdownTitle: {
    margin: "0 0 10px 0",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333"
  },
  breakdownItems: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "8px"
  },
  breakdownItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 8px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    fontSize: "12px"
  }
};

export default FakeProfileAlert;
