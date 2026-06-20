/**
 * Detection Controller
 * Comprehensive fake profile detection using advanced analysis and ML
 */

import Profile from "../models/Profile.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";
import { predictProfileWithAdvancedAnalysis } from "../utils/mlService.js";
import { performAdvancedAnalysis } from "../utils/advancedAnalyzer.js";

/**
 * Analyze a specific profile with comprehensive detection
 */
export const analyzeProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Get profile and user data
    const profile = await Profile.findById(profileId).populate("userId");
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const user = profile.userId;

    // Perform prediction with advanced analysis
    const result = await predictProfileWithAdvancedAnalysis(user, profile);

    if (result.status !== "success") {
      return res.status(500).json({ 
        message: "Analysis failed",
        error: result.message 
      });
    }

    // Update profile with detection results
    profile.fakeScore = result.overallScore.combinedFakeScore;
    profile.status = getProfileStatusFromScore(result.overallScore.combinedFakeScore);
    await profile.save();

    return res.json({
      success: true,
      profileId,
      analysis: result.analysis,
      prediction: {
        score: result.overallScore.combinedFakeScore,
        riskLevel: result.overallScore.riskLevel,
        mlPrediction: result.mlResult?.prediction,
        confidence: result.overallScore.confidence
      },
      recommendation: result.recommendation,
      status: profile.status
    });

  } catch (error) {
    console.error("Profile analysis error:", error);
    res.status(500).json({ 
      message: "Error analyzing profile",
      error: error.message 
    });
  }
};

/**
 * Bulk analyze multiple profiles
 */
export const bulkAnalyzeProfiles = async (req, res) => {
  try {
    const { profileIds } = req.body;

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ message: "No profiles provided" });
    }

    const results = [];
    const errors = [];

    for (const profileId of profileIds) {
      try {
        const profile = await Profile.findById(profileId).populate("userId");
        if (!profile) {
          errors.push({ profileId, error: "Profile not found" });
          continue;
        }

        const user = profile.userId;
        const result = await predictProfileWithAdvancedAnalysis(user, profile);

        if (result.status === "success") {
          profile.fakeScore = result.overallScore.combinedFakeScore;
          profile.status = getProfileStatusFromScore(result.overallScore.combinedFakeScore);
          await profile.save();

          results.push({
            profileId,
            status: "analyzed",
            fakeScore: result.overallScore.combinedFakeScore,
            riskLevel: result.overallScore.riskLevel,
            recommendation: result.recommendation.action
          });
        } else {
          errors.push({ profileId, error: result.message });
        }
      } catch (error) {
        errors.push({ profileId, error: error.message });
      }
    }

    res.json({
      success: true,
      analyzed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Bulk analysis error:", error);
    res.status(500).json({ 
      message: "Bulk analysis failed",
      error: error.message 
    });
  }
};

/**
 * Get comprehensive analysis breakdown for a profile
 */
export const getDetailedAnalysis = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId).populate("userId");
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const user = profile.userId;
    const analysis = await performAdvancedAnalysis(user, profile);

    return res.json({
      success: true,
      profileId,
      detailedAnalysis: {
        name: {
          score: analysis.detailedAnalysis.name?.fakeScore,
          suspicions: analysis.detailedAnalysis.name?.suspiciousPatterns,
          positives: analysis.detailedAnalysis.name?.positiveIndicators
        },
        email: {
          score: analysis.detailedAnalysis.email?.fakeScore,
          type: analysis.detailedAnalysis.email?.emailType,
          format: analysis.detailedAnalysis.emailValidation?.format,
          suspicions: analysis.detailedAnalysis.email?.suspiciousPatterns
        },
        profile: {
          completeness: analysis.detailedAnalysis.profileCompleteness?.completenessPercentage,
          missingFields: analysis.detailedAnalysis.profileCompleteness?.missingFields
        },
        photo: {
          score: analysis.detailedAnalysis.photo?.fakeScore,
          anomalies: analysis.detailedAnalysis.photoAnomalies?.anomalies,
          suspicions: analysis.detailedAnalysis.photoAnomalies?.suspiciousIndicators
        },
        bio: {
          score: analysis.detailedAnalysis.bio?.fakeScore,
          length: analysis.detailedAnalysis.bio?.bioMetrics?.characterCount,
          redFlags: analysis.detailedAnalysis.bio?.redFlags,
          positives: analysis.detailedAnalysis.bio?.positiveIndicators
        },
        account: {
          ageScore: analysis.detailedAnalysis.accountAge?.fakeScore,
          daysSinceCreation: analysis.detailedAnalysis.accountAge?.daysSinceCreation,
          riskIndicator: analysis.detailedAnalysis.accountAge?.riskIndicator
        },
        messaging: {
          suspicions: analysis.detailedAnalysis.messagingBehavior?.warnings,
          patterns: analysis.detailedAnalysis.messagingBehavior?.patterns,
          engagementScore: analysis.detailedAnalysis.messagingBehavior?.engagementScore
        },
        mindset: {
          category: analysis.detailedAnalysis.mindset?.mindsetCategory,
          concerns: analysis.detailedAnalysis.mindset?.concerns,
          indicators: analysis.detailedAnalysis.mindset?.indicators
        },
        spammer: {
          detected: analysis.detailedAnalysis.spammerIndicators?.detected,
          level: analysis.detailedAnalysis.spammerIndicators?.spamLevel,
          indicators: analysis.detailedAnalysis.spammerIndicators?.indicators
        },
        interactions: {
          pattern: analysis.detailedAnalysis.interactions?.naturalPattern,
          anomalies: analysis.detailedAnalysis.interactions?.anomalies
        }
      },
      summary: {
        overallScore: analysis.overallFakeScore,
        riskLevel: analysis.riskLevel,
        keyRedFlags: analysis.indicators.suspicious,
        warnings: analysis.indicators.warnings,
        positiveFactors: analysis.indicators.positive
      }
    });

  } catch (error) {
    console.error("Detailed analysis error:", error);
    res.status(500).json({
      message: "Error retrieving detailed analysis",
      error: error.message
    });
  }
};

/**
 * Get profiles that need review (by risk level)
 */
export const getProfilesNeedingReview = async (req, res) => {
  try {
    const { riskLevel = "HIGH", limit = 50, offset = 0 } = req.query;

    const fakeScoreThreshold = riskLevel === "CRITICAL" ? 80 :
                              riskLevel === "HIGH" ? 60 :
                              40;

    const profiles = await Profile.find({
      fakeScore: { $gte: fakeScoreThreshold }
    })
      .populate("userId", "name email phone")
      .sort({ fakeScore: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Profile.countDocuments({
      fakeScore: { $gte: fakeScoreThreshold }
    });

    return res.json({
      success: true,
      riskLevel,
      total,
      count: profiles.length,
      profiles: profiles.map(p => ({
        profileId: p._id,
        userId: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        fakeScore: p.fakeScore,
        status: p.status,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error("Error fetching profiles for review:", error);
    res.status(500).json({
      message: "Error retrieving profiles",
      error: error.message
    });
  }
};

/**
 * Get detection statistics
 */
export const getDetectionStats = async (req, res) => {
  try {
    const totalProfiles = await Profile.countDocuments();
    const realProfiles = await Profile.countDocuments({ status: "Real" });
    const fakeProfiles = await Profile.countDocuments({ status: "Fake" });
    const suspiciousProfiles = await Profile.countDocuments({ status: "Suspicious" });

    // Get score distribution
    const avgFakeScore = await Profile.collection.aggregate([
      { $group: { _id: null, avg: { $avg: "$fakeScore" } } }
    ]).toArray();

    const distribution = await Profile.collection.aggregate([
      {
        $bucket: {
          groupBy: "$fakeScore",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "Other",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    return res.json({
      success: true,
      statistics: {
        total: totalProfiles,
        byStatus: {
          real: realProfiles,
          fake: fakeProfiles,
          suspicious: suspiciousProfiles
        },
        averageFakeScore: avgFakeScore[0]?.avg || 0,
        scoreDistribution: distribution
      }
    });

  } catch (error) {
    console.error("Error getting statistics:", error);
    res.status(500).json({
      message: "Error retrieving statistics",
      error: error.message
    });
  }
};

/**
 * Flag or unflag a profile as fake
 */
export const flagProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { action, reason } = req.body;

    if (!["flag", "unflag"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (action === "flag") {
      profile.status = "Fake";
      profile.fakeScore = 100; // Manually flagged as fake
    } else {
      profile.status = "Real";
      profile.fakeScore = 0; // Manually unflagged
    }

    await profile.save();

    return res.json({
      success: true,
      profileId,
      action,
      newStatus: profile.status,
      reason
    });

  } catch (error) {
    console.error("Error flagging profile:", error);
    res.status(500).json({
      message: "Error flagging profile",
      error: error.message
    });
  }
};

/**
 * Helper: Get profile status from fake score
 */
const getProfileStatusFromScore = (score) => {
  if (score >= 80) return "Fake";
  if (score >= 60) return "Suspicious";
  return "Real";
};

/**
 * Legacy: Calculate comprehensive fake profile score based on behavior
 */
export const calculateFakeScore = async (user, profile) => {
  const analysis = {
    profileCompleteness: { score: 0, maxScore: 50, details: [] },
    accountAge: { score: 0, maxScore: 10, details: [] },
    messagingBehavior: { score: 0, maxScore: 10, details: [] },
    searchBehavior: { score: 0, maxScore: 5, details: [] },
    bioContent: { score: 0, maxScore: 65, details: [] }
  };

  // 1. Profile Completeness Check (0-30 points)
  // Missing profile photo (major red flag combined with other indicators)
  if (!profile?.photo) {
    analysis.profileCompleteness.score += 20;
    analysis.profileCompleteness.details.push("Missing profile photo (major red flag)");
  } else {
    analysis.profileCompleteness.details.push("Profile photo present");
  }

  // Age check
  if (!profile?.age || profile.age < 18 || profile.age > 100) {
    analysis.profileCompleteness.score += 8;
    analysis.profileCompleteness.details.push("Missing or invalid age");
  } else {
    analysis.profileCompleteness.details.push("Valid age provided");
  }

  // Bio check
  const bioLength = profile?.bio?.length || 0;
  if (bioLength < 10) {
    analysis.profileCompleteness.score += 15;
    analysis.profileCompleteness.details.push("Very short bio (less than 10 characters) - red flag");
  } else if (bioLength < 50) {
    analysis.profileCompleteness.score += 5;
    analysis.profileCompleteness.details.push("Short bio (could be more detailed)");
  } else {
    analysis.profileCompleteness.details.push("Detailed bio provided");
  }

  // Phone check
  if (!user?.phone || user.phone.length < 5) {
    analysis.profileCompleteness.score += 4;
    analysis.profileCompleteness.details.push("Phone number not provided");
  } else {
    analysis.profileCompleteness.details.push("Valid phone number provided");
  }

  // 2. Account Age Check (0-20 points)
  const createdAt = new Date(user?.createdAt);
  const daysSinceCreation = (new Date() - createdAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 1) {
    analysis.accountAge.score += 20;
    analysis.accountAge.details.push("Account created today (red flag)");
  } else if (daysSinceCreation < 7) {
    analysis.accountAge.score += 12;
    analysis.accountAge.details.push(`Account only ${Math.floor(daysSinceCreation)} day(s) old`);
  } else if (daysSinceCreation < 30) {
    analysis.accountAge.score += 5;
    analysis.accountAge.details.push(`Account ${Math.floor(daysSinceCreation)} days old (relatively new)`);
  } else {
    analysis.accountAge.details.push(`Account ${Math.floor(daysSinceCreation)} days old (established)`);
  }

  // 3. Messaging Behavior Analysis (0-25 points)
  try {
    const totalMessages = await Message.countDocuments({
      $or: [{ fromUser: user._id }, { toUser: user._id }]
    });

    const sentMessages = await Message.countDocuments({ fromUser: user._id });
    const receivedMessages = await Message.countDocuments({ toUser: user._id });

    const totalFriendRequests = await FriendRequest.countDocuments({
      $or: [{ fromUser: user._id }, { toUser: user._id }]
    });

    const sentRequests = await FriendRequest.countDocuments({ fromUser: user._id });
    const acceptedFriends = await FriendRequest.countDocuments({
      $or: [{ fromUser: user._id, status: "accepted" }, { toUser: user._id, status: "accepted" }]
    });

    // Calculate messaging patterns
    const messageToRequestRatio = totalFriendRequests > 0 ? totalMessages / totalFriendRequests : 0;
    const responseRate = (sentMessages + receivedMessages) > 0 ? sentMessages / (sentMessages + receivedMessages) : 0;

    analysis.messagingBehavior.details.push(
      `Total messages sent: ${sentMessages}`,
      `Total messages received: ${receivedMessages}`,
      `Total friend requests: ${totalFriendRequests}`,
      `Accepted connections: ${acceptedFriends}`
    );

    // Patterns detection
    if (totalFriendRequests > 20 && totalMessages < 5) {
      analysis.messagingBehavior.score += 15;
      analysis.messagingBehavior.details.push("⚠️ Many friend requests with minimal messaging (possible spammer)");
    } else if (messageToRequestRatio > 5) {
      analysis.messagingBehavior.details.push("✓ Good engagement with matched connections");
    } else if (messageToRequestRatio > 1) {
      analysis.messagingBehavior.score += 3;
      analysis.messagingBehavior.details.push("Low messaging engagement relative to friend requests");
    }

    if (totalMessages === 0 && totalFriendRequests > 15) {
      analysis.messagingBehavior.score += 10;
      analysis.messagingBehavior.details.push("⚠️ No messages sent despite multiple friend requests");
    }

    if (acceptedFriends > 0 && totalMessages === 0) {
      analysis.messagingBehavior.score += 8;
      analysis.messagingBehavior.details.push("⚠️ Accepted connections but never initiated conversations");
    }

    // Response consistency
    if (responseRate > 0.7) {
      analysis.messagingBehavior.details.push("✓ Active in conversations");
    } else if (responseRate < 0.2 && totalMessages > 0) {
      analysis.messagingBehavior.score += 5;
      analysis.messagingBehavior.details.push("Low response rate to messages");
    }
  } catch (error) {
    console.log("Error checking message behavior:", error.message);
  }

  // 4. Search & Discovery Behavior (0-15 points)
  try {
    // Check if user has interacted with many profiles recently
    const interactions = await FriendRequest.find({ fromUser: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    if (interactions.length > 0) {
      const recentInteractions = interactions.filter(
        r => (new Date() - r.createdAt) < 24 * 60 * 60 * 1000
      ).length;

      analysis.searchBehavior.details.push(
        `Profile searches/interactions in last 24h: ${recentInteractions}`,
        `Total recent interactions: ${interactions.length}`
      );

      if (recentInteractions > 10) {
        analysis.searchBehavior.score += 10;
        analysis.searchBehavior.details.push("⚠️ Excessive search activity (bot-like behavior)");
      } else if (recentInteractions > 5) {
        analysis.searchBehavior.score += 5;
        analysis.searchBehavior.details.push("High search activity compared to average users");
      }
    } else {
      analysis.searchBehavior.details.push("No recent search activity");
    }
  } catch (error) {
    console.log("Error checking search behavior:", error.message);
  }

  // 5. Bio Content Analysis (0-10 points)
  const bio = profile?.bio || "";
  const suspiciousKeywords = [
    "bitcoin", "crypto", "ethereum", "investment", "roi",
    "money", "wealthy", "rich", "business opportunity",
    "click here", "link in bio", "dm me",
    "whatsapp", "telegram", "viber",
    "meet outside", "hotel", "lonely", "desperate"
  ];

  const foundKeywords = suspiciousKeywords.filter(keyword =>
    bio.toLowerCase().includes(keyword)
  );

  if (foundKeywords.length > 0) {
    analysis.bioContent.score += Math.min(foundKeywords.length * 3, 10);
    analysis.bioContent.details.push(`⚠️ Suspicious keywords found: ${foundKeywords.join(", ")}`);
  } else {
    analysis.bioContent.details.push("✓ Bio content appears genuine");
  }

  // Generic/placeholder bio detection
  const genericBios = ["hello", "hi", "hey", "test", "xyz", "abc", "no info", "n/a", "na"];
  const bioLower = bio.toLowerCase().trim();
  
  if (genericBios.includes(bioLower)) {
    analysis.bioContent.score += 25;
    analysis.bioContent.details.push("🚨 CRITICAL: Placeholder/generic bio detected");
  }

  // Name validation
  const name = user?.name || "";
  
  // Detect placeholder names
  const placeholderNames = ["test user", "test", "user", "admin", "text user", "temp", "fake", "default", "sample", "demo"];
  const nameLower = name.toLowerCase().trim();
  
  if (placeholderNames.includes(nameLower)) {
    analysis.bioContent.score += 20;
    analysis.bioContent.details.push("🚨 CRITICAL: Placeholder name detected (likely test/dummy account)");
  } else if (name.length < 3 || name.length > 50) {
    analysis.bioContent.score += 4;
    analysis.bioContent.details.push("Unusual name length");
  }

  if (/\d{3,}/.test(name)) {
    analysis.bioContent.score += 4;
    analysis.bioContent.details.push("Name contains many numbers");
  }

  // Email validation
  const email = user?.email || "";
  const placeholderEmails = ["test@", "admin@", "demo@", "dummy@", "faker@", "fake@", "temp@", "sample@"];
  const emailLower = email.toLowerCase();
  
  if (placeholderEmails.some(pattern => emailLower.includes(pattern))) {
    analysis.profileCompleteness.score += 20;
    analysis.profileCompleteness.details.push("🚨 CRITICAL: Placeholder/test email address detected");
  }
  
  // Generic email patterns (text@email, user@email, etc.)
  if (/^(text|user|admin|test|demo|sample|fake|temp|no-reply|noreply)\@/.test(emailLower)) {
    analysis.profileCompleteness.score += 18;
    analysis.profileCompleteness.details.push("🚨 CRITICAL: Generic/placeholder email pattern detected");
  }

  // Multiple Red Flags Detection - if account has many placeholder indicators, it's highly suspicious
  const hasPlaceholderName = placeholderNames.includes(nameLower);
  const hasGenericEmail = /^(text|user|admin|test|demo|sample|fake|temp|no-reply|noreply)\@/.test(emailLower);
  const hasGenericBio = genericBios.includes(bioLower);
  const hasMissingPhoto = !profile?.photo;
  
  const redFlagCount = [hasPlaceholderName, hasGenericEmail, hasGenericBio, hasMissingPhoto].filter(Boolean).length;
  
  if (redFlagCount >= 3) {
    // Multiple critical flags suggest this is definitely a fake/test account
    analysis.bioContent.score += 10;
    analysis.bioContent.details.push("🚨 CRITICAL: Multiple red flags detected (strong fake profile indicator)");
  }

  // Calculate total scores
  const totalFakeScore = Object.values(analysis).reduce((sum, cat) => sum + cat.score, 0);
  const maxTotalScore = Object.values(analysis).reduce((sum, cat) => sum + cat.maxScore, 0);
  
  const fakeScore = Math.round((totalFakeScore / maxTotalScore) * 100);
  const genuineScore = 100 - fakeScore;

  // Determine prediction
  let prediction = "GENUINE";
  let confidence = 0;

  if (fakeScore >= 75) {
    prediction = "LIKELY FAKE";
    confidence = Math.min(fakeScore, 95);
  } else if (fakeScore >= 60) {
    prediction = "SUSPICIOUS";
    confidence = fakeScore;
  } else if (fakeScore >= 40) {
    prediction = "UNCERTAIN";
    confidence = 50;
  } else {
    prediction = "GENUINE";
    confidence = genuineScore;
  }

  return {
    fakeScore,
    genuineScore,
    prediction,
    confidence: Math.round(confidence),
    riskLevel: fakeScore >= 75 ? "High" : fakeScore >= 50 ? "Medium" : "Low",
    analysis,
    breakdown: {
      profileCompleteness: analysis.profileCompleteness.score,
      accountAge: analysis.accountAge.score,
      messagingBehavior: analysis.messagingBehavior.score,
      searchBehavior: analysis.searchBehavior.score,
      bioContent: analysis.bioContent.score
    }
  };
};

/**
 * Legacy: Detect Fake Profile (for backward compatibility)
 */
export const detectFakeProfile = (req, res) => {
  try {
    const { age, bio, activity } = req.body;

    if (!age || !bio || activity === undefined) {
      return res.status(400).json({ 
        message: "Missing required fields: age, bio, activity" 
      });
    }

    // Basic scoring for backward compatibility
    let score = 0;

    // Age check
    if (age < 18 || age > 100) {
      score += 15;
    }

    // Bio check
    if (bio.length < 10) {
      score += 20;
    } else if (bio.length > 500) {
      score += 5;
    }

    // Activity check
    if (activity === 0) {
      score += 20;
    } else if (activity < 5) {
      score += 10;
    }

    res.json({
      success: true,
      result: score >= 30 ? "Fake" : "Real",
      fakeScore: Math.min(score, 100),
      reason: "Legacy detection - use advanced analysis for better results"
    });

  } catch (error) {
    console.error("Detection error:", error);
    res.status(500).json({ 
      message: "Error in detection",
      error: error.message 
    });
  }
};

/**
 * Legacy: Analyze profile behavior (for backward compatibility)
 */
export const analyzeProfileBehavior = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await Profile.findOne({ userId });

    const analysis = await calculateFakeScore(user, profile);

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing profile:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test endpoint: Analyze profile with raw data (for testing)
 */
export const testAnalyzeProfile = async (req, res) => {
  try {
    const { name, email, gender, age, phoneNumber, bio, profileCompleteness, hasProfilePhoto } = req.body;

    // Create mock user and profile objects
    const mockUser = {
      _id: "test-user",
      name: name || "",
      email: email || "",
      phone: phoneNumber || "",
      gender: gender || "",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    };

    const mockProfile = {
      _id: "test-profile",
      userId: mockUser,
      bio: bio || "",
      age: age || 0,
      profileCompleteness: profileCompleteness || 0,
      hasProfilePhoto: hasProfilePhoto || false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };

    // Use the prediction function
    const result = await predictProfileWithAdvancedAnalysis(mockUser, mockProfile);

    if (result.status !== "success") {
      return res.status(500).json({
        message: "Analysis failed",
        error: result.message
      });
    }

    return res.json({
      success: true,
      testData: { name, email, gender, age, phoneNumber, bio, profileCompleteness, hasProfilePhoto },
      analysis: result.analysis,
      prediction: {
        score: result.overallScore.combinedFakeScore,
        riskLevel: result.overallScore.riskLevel,
        confidence: result.overallScore.confidence
      },
      recommendation: result.recommendation
    });

  } catch (error) {
    console.error("Test analysis error:", error);
    res.status(500).json({
      message: "Error in test analysis",
      error: error.message
    });
  }
};

export default {
  analyzeProfile,
  bulkAnalyzeProfiles,
  getDetailedAnalysis,
  getProfilesNeedingReview,
  getDetectionStats,
  flagProfile,
  calculateFakeScore,
  detectFakeProfile,
  analyzeProfileBehavior,
  testAnalyzeProfile
};