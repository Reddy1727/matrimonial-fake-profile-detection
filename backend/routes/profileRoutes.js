import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  getProfile,
  updateProfile,
  getAllProfiles,
  sendMessage,
  getMessages,
  getConversations,
  deleteMessage,
  deleteConversation,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  checkFriendStatus,
  getFriends
} from "../controllers/profileController.js";

const router = express.Router();

// Profile endpoints
router.get("/profile/:userId", getProfile);
router.put("/profile/:userId", upload.single("photo"), updateProfile);
router.get("/profiles", getAllProfiles);

// Friend endpoints
router.get("/friends/:userId", getFriends);
router.post("/friend-request", sendFriendRequest);
router.get("/friend-requests/:userId", getFriendRequests);
router.put("/friend-request/:requestId/accept", acceptFriendRequest);
router.put("/friend-request/:requestId/reject", rejectFriendRequest);
router.get("/friend-status", checkFriendStatus);

// Messaging endpoints
router.post("/message", sendMessage);
router.get("/messages/:userId/:otherUserId", getMessages);
router.get("/conversations/:userId", getConversations);
router.delete("/message/:messageId", deleteMessage);
router.delete("/conversation/:userId/:otherUserId", deleteConversation);

export default router;