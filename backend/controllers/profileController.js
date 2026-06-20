import User from "../models/User.js";
import Profile from "../models/Profile.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import { calculateFakeScore } from "./detectionController.js";
import { filterProfanity, isTooOffensive } from "../utils/profanityFilter.js";

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-password");
    const profile = await Profile.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fakeAnalysis = await calculateFakeScore(user, profile);

    res.json({ 
      user, 
      profile,
      fakeScore: fakeAnalysis.fakeScore,
      genuineScore: fakeAnalysis.genuineScore,
      prediction: fakeAnalysis.prediction,
      confidence: fakeAnalysis.confidence,
      riskLevel: fakeAnalysis.riskLevel,
      analysis: fakeAnalysis.analysis,
      breakdown: fakeAnalysis.breakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { age, bio } = req.body;
    let photo = req.body.photo;

    // If a file was uploaded, use its path
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    const updateData = {
      ...(age && { age: parseInt(age) }),
      ...(bio && { bio }),
      ...(photo && { photo })
    };

    const profile = await Profile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );

    res.json({ message: "Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all profiles
export const getAllProfiles = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    // Get all users except the current user
    const users = await User.find({ _id: { $ne: userId } }).select("-password");
    
    // Get their profiles with fake score analysis
    const profiles = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id });
        const fakeAnalysis = await calculateFakeScore(user, profile);
        return { 
          user: user.toObject(), 
          profile,
          fakeScore: fakeAnalysis.fakeScore,
          genuineScore: fakeAnalysis.genuineScore,
          prediction: fakeAnalysis.prediction,
          confidence: fakeAnalysis.confidence,
          riskLevel: fakeAnalysis.riskLevel,
          analysis: fakeAnalysis.analysis,
          breakdown: fakeAnalysis.breakdown
        };
      })
    );

    res.json({ profiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      fromUser: fromUserId,
      toUser: toUserId
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    const friendRequest = new FriendRequest({
      fromUser: fromUserId,
      toUser: toUserId
    });

    await friendRequest.save();
    res.json({ message: "Friend request sent", friendRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    const requests = await FriendRequest.find({ toUser: userId, status: "pending" })
      .populate("fromUser", "-password");

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true }
    );

    res.json({ message: "Friend request accepted", friendRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    await FriendRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" }
    );

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { fromUserId, toUserId, content } = req.body;

    // Check and filter profanity
    const profanityCheck = filterProfanity(content);
    
    // If message is too offensive, reject it
    if (isTooOffensive(content)) {
      return res.status(400).json({ 
        error: "Your message contains too much inappropriate language and cannot be sent.",
        warning: true
      });
    }

    // Save message with filtered content
    const message = new Message({
      fromUser: fromUserId,
      toUser: toUserId,
      content: profanityCheck.text, // Use censored content
      hasViolation: profanityCheck.hasViolation,
      violations: profanityCheck.violations
    });

    await message.save();
    
    // Return response with warning if violations were found
    res.json({ 
      message: "Message sent",
      data: message,
      warning: profanityCheck.hasViolation ? "Your message contained inappropriate language and has been censored." : null,
      violationCount: profanityCheck.violationCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const [messages, otherUser, otherProfile] = await Promise.all([
      Message.find({
        $or: [
          { fromUser: userId, toUser: otherUserId },
          { fromUser: otherUserId, toUser: userId }
        ]
      }).sort({ createdAt: 1 }),
      User.findById(otherUserId).select("-password"),
      Profile.findOne({ userId: otherUserId })
    ]);

    // Calculate the most up-to-date fake score for the chat partner
    const fakeAnalysis = await calculateFakeScore(otherUser, otherProfile);

    res.json({ 
      messages,
      otherUser: {
        ...otherUser?.toObject(),
        profile: otherProfile,
        fakeAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const messages = await Message.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    // Get unique conversation partners
    const partners = new Set();
    messages.forEach(msg => {
      if (msg.fromUser.toString() === userId) {
        partners.add(msg.toUser.toString());
      } else {
        partners.add(msg.fromUser.toString());
      }
    });

    // Get user details for each partner with fake analysis
    const conversations = await Promise.all(
      Array.from(partners).map(async (partnerId) => {
        const user = await User.findById(partnerId).select("-password");
        const profile = await Profile.findOne({ userId: partnerId });
        const fakeAnalysis = await calculateFakeScore(user, profile);
        const lastMessage = messages
          .filter(
            msg =>
              (msg.fromUser.toString() === userId && msg.toUser.toString() === partnerId) ||
              (msg.fromUser.toString() === partnerId && msg.toUser.toString() === userId)
          )
          .pop();

        return { 
          user, 
          profile, 
          lastMessage,
          fakeScore: fakeAnalysis.fakeScore,
          genuineScore: fakeAnalysis.genuineScore,
          prediction: fakeAnalysis.prediction,
          confidence: fakeAnalysis.confidence,
          riskLevel: fakeAnalysis.riskLevel,
          analysis: fakeAnalysis.analysis,
          breakdown: fakeAnalysis.breakdown
        };
      })
    );

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if users are friends
export const checkFriendStatus = async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;

    const friendRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: userId1, toUser: userId2 },
        { fromUser: userId2, toUser: userId1 }
      ]
    });

    res.json({ 
      isFriend: friendRequest?.status === "accepted",
      status: friendRequest?.status || "none"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.fromUser.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete entire conversation
export const deleteConversation = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Validate parameters
    if (!userId || userId === "undefined") {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (!otherUserId || otherUserId === "undefined") {
      return res.status(400).json({ error: "Invalid other user ID" });
    }

    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { fromUser: userId, toUser: otherUserId },
        { fromUser: otherUserId, toUser: userId }
      ]
    });

    res.json({ message: "Entire conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get accepted friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.params.userId;

    const acceptedRequests = await FriendRequest.find({
      status: "accepted",
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    }).populate("fromUser toUser", "-password");

    // Get unique friends
    const friends = acceptedRequests.map(request => {
      return request.fromUser._id.toString() === userId 
        ? request.toUser 
        : request.fromUser;
    });

    // Get friend profiles with fake analysis
    const friendsWithProfiles = await Promise.all(
      friends.map(async (friend) => {
        const profile = await Profile.findOne({ userId: friend._id });
        const fakeAnalysis = await calculateFakeScore(friend, profile);
        return {
          user: friend.toObject(),
          profile,
          fakeScore: fakeAnalysis.fakeScore,
          genuineScore: fakeAnalysis.genuineScore,
          prediction: fakeAnalysis.prediction,
          confidence: fakeAnalysis.confidence,
          riskLevel: fakeAnalysis.riskLevel,
          analysis: fakeAnalysis.analysis,
          breakdown: fakeAnalysis.breakdown
        };
      })
    );

    res.json({ friends: friendsWithProfiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};