import express from "express";
import { register, login, deleteAccount } from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Delete Account
router.delete("/delete/:userId", deleteAccount);

export default router;