import express from "express";
import { detectFakeProfile, analyzeProfileBehavior, testAnalyzeProfile } from "../controllers/detectionController.js";

const router = express.Router();

// Fake Detection
router.post("/detect", detectFakeProfile);

// Analyze profile behavior and get fake score
router.get("/analyze/:userId", analyzeProfileBehavior);

// Test endpoint for raw profile data
router.post("/test-analyze", testAnalyzeProfile);

export default router;