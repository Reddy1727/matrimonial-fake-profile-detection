import React, { useState, useEffect } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import FakeProfileAlert from "../components/FakeProfileAlert";
import { useParams, useNavigate } from "react-router-dom";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showConversations, setShowConversations] = useState(false);
  const [fakeScore, setFakeScore] = useState(null);
  const [genuineScore, setGenuineScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const { otherUserId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchConversations(parsedUser._id);
      if (otherUserId) {
        fetchMessages(parsedUser._id, otherUserId);
        fetchOtherUser(otherUserId);
      }
    }
  }, [otherUserId]);

  const fetchConversations = async (userId) => {
    try {
      const res = await API.get(`/conversations/${userId}`);
      setConversations(res.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (userId, other) => {
    try {
      const res = await API.get(`/messages/${userId}/${other}`);
      setMessages(res.data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchOtherUser = async (userId) => {
    try {
      const res = await API.get(`/profile/${userId}`);
      setOtherUser(res.data.user);
      setFakeScore(res.data.fakeScore || 0);
      setGenuineScore(res.data.genuineScore || 0);
      setRiskLevel(res.data.riskLevel || "Low");
      setPrediction(res.data.prediction || "GENUINE");
      setConfidence(res.data.confidence || 0);
      setAnalysis(res.data.analysis || null);
      setBreakdown(res.data.breakdown || null);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await API.post("/message", {
        fromUserId: user._id,
        toUserId: otherUserId,
        content: newMessage
      });
      
      setNewMessage("");
      fetchMessages(user._id, otherUserId);
      
      // Show warning if bad language was detected and censored
      if (response.data.warning) {
        alert("⚠️ " + response.data.warning);
      }
    } catch (error) {
      // Check if error is due to too offensive language
      if (error.response?.status === 400 && error.response?.data?.warning) {
        alert("❌ " + error.response.data.error);
      } else {
        alert("Error sending message: " + error.message);
      }
    }
  };

  const handleSelectConversation = (conv) => {
    navigate(`/messages/${conv.user._id}`);
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      await API.delete(`/message/${messageId}`, {
        data: { userId: user._id }
      });
      alert("Message deleted successfully");
      fetchMessages(user._id, otherUserId);
    } catch (error) {
      alert("❌ Error deleting message: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteConversation = async () => {
    // Validate that a valid otherUserId is selected
    if (!otherUserId || otherUserId === "undefined" || otherUserId.length < 12) {
      alert("❌ Error: No user selected for conversation");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete the entire conversation with " + otherUser?.name + "? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await API.delete(`/conversation/${user._id}/${otherUserId}`);
      alert("✓ Conversation deleted successfully");
      fetchConversations(user._id);
      navigate("/messages");
    } catch (error) {
      alert("❌ Error deleting conversation: " + (error.response?.data?.error || error.message));
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.layout}>
          <div style={styles.conversationsList}>
            <h3>Conversations</h3>
            <button 
              onClick={() => setShowConversations(!showConversations)}
              style={styles.toggleButton}
            >
              {showConversations ? "Hide" : "Show"} Conversations
            </button>
            {showConversations && (
              <div style={styles.conversationsScroll}>
                {conversations.length === 0 ? (
                  <p>No conversations yet</p>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.user._id}
                      style={{
                        ...styles.conversationItem,
                        backgroundColor: otherUserId === conv.user._id ? "#FFD0D8" : "white",
                        border: conv.riskLevel === "High" ? "2px solid #f44336" : conv.riskLevel === "Medium" ? "2px solid #ff9800" : "1px solid #ddd"
                      }}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div style={styles.conversationHeader}>
                        <strong>{conv.user.name}</strong>
                      </div>
                      <p style={styles.lastMessage}>
                        {conv.lastMessage?.content.substring(0, 50) || "No messages"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={styles.messagesArea}>
            {otherUser ? (
              <>
                <div style={styles.header}>
                  <div style={styles.headerTop}>
                    <h2>{otherUser.name}</h2>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                      <button 
                        onClick={handleDeleteConversation}
                        style={styles.deleteConversationButton}
                        title="Delete entire conversation"
                      >
                        🗑️ Delete Chat
                      </button>
                    </div>
                  </div>
                  <FakeProfileAlert 
                    fakeScore={fakeScore}
                    genuineScore={genuineScore}
                    riskLevel={riskLevel}
                    prediction={prediction}
                    confidence={confidence}
                    analysis={analysis}
                    breakdown={breakdown}
                  />
                </div>
                <div style={styles.messagesContainer}>
                  {messages.length === 0 ? (
                    <p style={styles.noMessages}>No messages yet. Start a conversation!</p>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.messageWrapper,
                          alignSelf: msg.fromUser === user._id ? "flex-end" : "flex-start"
                        }}
                      >
                        <div
                          style={{
                            ...styles.message,
                            backgroundColor:
                              msg.fromUser === user._id ? "#FF4472" : "#e0e0e0",
                            color: msg.fromUser === user._id ? "white" : "black"
                          }}
                        >
                          {msg.content}
                        </div>
                        {msg.fromUser === user._id && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            style={styles.deleteMessageButton}
                            title="Delete message"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div style={styles.messageInput}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                    style={styles.input}
                  />
                  <button onClick={handleSendMessage} style={styles.sendButton}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.noChat}>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  layout: {
    display: "flex",
    gap: "20px",
    height: "600px"
  },
  conversationsList: {
    flex: "0 0 250px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column"
  },
  toggleButton: {
    padding: "8px 12px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "10px"
  },
  conversationsScroll: {
    flex: 1,
    overflowY: "auto"
  },
  conversationItem: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "4px",
    cursor: "pointer",
    border: "1px solid #ddd"
  },
  conversationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  fakeIndicator: {
    fontSize: "10px",
    color: "white",
    padding: "2px 6px",
    borderRadius: "3px",
    fontWeight: "bold"
  },
  lastMessage: {
    fontSize: "12px",
    color: "#888",
    margin: "5px 0 0 0"
  },
  messagesArea: {
    flex: 1,
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f9f9f9"
  },
  header: {
    padding: "15px",
    borderBottom: "1px solid #ddd",
    backgroundColor: "white"
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  deleteConversationButton: {
    padding: "8px 12px",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s"
  },
  friendRequestButton: {
    padding: "8px 12px",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  messagesContainer: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  message: {
    padding: "10px 15px",
    borderRadius: "8px",
    maxWidth: "70%",
    wordWrap: "break-word"
  },
  messageWrapper: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end"
  },
  deleteMessageButton: {
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    padding: "0",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s"
  },
  noMessages: {
    textAlign: "center",
    color: "#888",
    marginTop: "20px"
  },
  messageInput: {
    display: "flex",
    gap: "10px",
    padding: "15px",
    borderTop: "1px solid #ddd",
    backgroundColor: "white"
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px"
  },
  sendButton: {
    padding: "10px 20px",
    backgroundColor: "#FF4472",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  noChat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#ccc"
  }
};

export default Messages;
