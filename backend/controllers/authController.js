import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, phone, gender, about, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = new User({
      name,
      email,
      phone,
      gender,
      about,
      password
    });

    await user.save();

    res.json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete User Account Permanently
export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Verify user exists and password is correct
    const user = await User.findOne({ _id: userId, password });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid password or user not found" });
    }

    // Delete all related data
    // 1. Delete user profile
    await Profile.deleteMany({ userId });

    // 2. Delete all messages (sent and received)
    await Message.deleteMany({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    // 3. Delete all friend requests (sent and received)
    await FriendRequest.deleteMany({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    // 4. Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: "Account deleted successfully",
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};