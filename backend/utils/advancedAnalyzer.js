/**
 * Advanced Profile Analysis Service
 * Performs comprehensive analysis on multiple aspects of a profile
 * to accurately detect fake profiles
 */

import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";
import {
  analyzeEmailPatterns,
  analyzeNamePatterns,
  validateEmailFormat
} from "./dataPatternAnalyzer.js";
import {
  analyzeBio,
  analyzeBehaviorFromMessages,
  detectMindsetIndicators,
  calculateWritingConsistency
} from "./textAnalyzer.js";
import {
  validatePhotoMetadata,
  detectPhotoAnomalies
} from "./imageAnalyzer.js";
import {
  analyzeBehaviorPatterns,
  detectSpammerBehavior,
  analyzeInteractionPatterns
} from "./behaviorAnalyzer.js";

/**
 * Comprehensive profile analysis combining all detection methods
 */
export const performAdvancedAnalysis = async (user, profile) => {
  const analysis = {
    timestamp: new Date(),
    userId: user._id,
    overallFakeScore: 0,
    riskLevel: "UNKNOWN",
    indicators: {
      suspicious: [],
      warnings: [],
      positive: []
    },
    detailedAnalysis: {},
    recommendations: []
  };

  try {
    // 1. Name Analysis
    analysis.detailedAnalysis.name = await analyzeNamePatterns(user.name, user.email);

    // 2. Email Analysis
    analysis.detailedAnalysis.email = analyzeEmailPatterns(user.email);
    analysis.detailedAnalysis.emailValidation = validateEmailFormat(user.email);

    // 3. Profile Completeness
    analysis.detailedAnalysis.profileCompleteness = analyzeProfileCompleteness(user, profile);

    // 4. Photo Analysis
    if (profile?.photo) {
      analysis.detailedAnalysis.photo = await validatePhotoMetadata(profile.photo, user._id);
      analysis.detailedAnalysis.photoAnomalies = await detectPhotoAnomalies(profile.photo);
    } else {
      analysis.indicators.suspicious.push("Missing profile photo - major red flag");
    }

    // 5. Bio Analysis
    analysis.detailedAnalysis.bio = analyzeBio(profile?.bio, user.name);

    // 6. Account Age Analysis
    analysis.detailedAnalysis.accountAge = analyzeAccountAge(user.createdAt);

    // 7. Messaging Behavior Analysis
    analysis.detailedAnalysis.messagingBehavior = await analyzeBehaviorPatterns(user._id);

    // 8. Message Content Analysis (Mindset & Behavior from actual messages)
    analysis.detailedAnalysis.messageContent = await analyzeBehaviorFromMessages(user._id);

    // 9. Mindset Indicators
    analysis.detailedAnalysis.mindset = await detectMindsetIndicators(user._id, profile?.bio);

    // 10. Interaction Pattern Analysis
    analysis.detailedAnalysis.interactions = await analyzeInteractionPatterns(user._id);

    // 11. Spammer Behavior Detection
    analysis.detailedAnalysis.spammerIndicators = await detectSpammerBehavior(user._id);

    // Calculate overall score based on all analyses
    analysis.overallFakeScore = calculateOverallScore(analysis.detailedAnalysis);
    analysis.riskLevel = getRiskLevel(analysis.overallFakeScore);

    // Compile indicators
    compileIndicators(analysis);

    return analysis;
  } catch (error) {
    console.error("Advanced Analysis Error:", error);
    analysis.error = error.message;
    return analysis;
  }
};

/**
 * Analyze profile completeness
 */
const analyzeProfileCompleteness = (user, profile) => {
  const completeness = {
    score: 0,
    maxScore: 100,
    completenessPercentage: 0,
    missingFields: [],
    details: []
  };

  let filledFields = 0;
  let totalFields = 0;

  // Required fields
  const fields = [
    { name: "name", value: user?.name, weight: 15 },
    { name: "email", value: user?.email, weight: 15 },
    { name: "phone", value: user?.phone, weight: 15 },
    { name: "age", value: profile?.age, weight: 15 },
    { name: "gender", value: profile?.gender, weight: 10 },
    { name: "bio", value: profile?.bio, weight: 20 },
    { name: "photo", value: profile?.photo, weight: 10 }
  ];

  fields.forEach(field => {
    totalFields += field.weight;
    if (field.value && field.value.toString().trim().length > 0) {
      filledFields += field.weight;
      completeness.details.push(`✓ ${field.name} provided`);
    } else {
      completeness.missingFields.push(field.name);
      completeness.details.push(`✗ ${field.name} missing`);
    }
  });

  completeness.completenessPercentage = Math.round((filledFields / totalFields) * 100);
  completeness.score = filledFields;

  return completeness;
};

/**
 * Analyze account age and creation patterns
 */
const analyzeAccountAge = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const daysSinceCreation = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  const hoursSinceCreation = Math.floor((now - created) / (1000 * 60 * 60));

  let ageScore = 0;
  let riskIndicator = "UNKNOWN";
  const analysis = [];

  if (hoursSinceCreation < 1) {
    ageScore = 25;
    riskIndicator = "CRITICAL";
    analysis.push("Account created less than 1 hour ago - CRITICAL RED FLAG");
  } else if (daysSinceCreation < 1) {
    ageScore = 20;
    riskIndicator = "HIGH";
    analysis.push("Account created today - suspicious new account");
  } else if (daysSinceCreation < 3) {
    ageScore = 15;
    riskIndicator = "MEDIUM";
    analysis.push(`Account only ${daysSinceCreation} days old - very new`);
  } else if (daysSinceCreation < 7) {
    ageScore = 8;
    riskIndicator = "LOW";
    analysis.push(`Account ${daysSinceCreation} days old - relatively new`);
  } else if (daysSinceCreation < 30) {
    ageScore = 3;
    analysis.push(`Account ${daysSinceCreation} days old - moderately established`);
  } else {
    ageScore = 0;
    analysis.push(`Account ${daysSinceCreation} days old - well established`);
  }

  return {
    fakeScore: ageScore,
    daysSinceCreation,
    hoursSinceCreation,
    riskIndicator,
    analysis
  };
};

/**
 * Calculate overall fake score from all analyses
 * Uses critical red flags multiplier for more accurate detection
 */
const calculateOverallScore = (analyses) => {
  // Weighted scoring based on importance
  const weights = {
    name: 0.18,              // Critical indicator
    email: 0.18,             // Critical indicator
    profileCompleteness: 0.14, // Critical for legitimacy
    photo: 0.14,             // Critical indicator
    bio: 0.12,
    accountAge: 0.05,
    messagingBehavior: 0.08,
    messageContent: 0.06,
    mindset: 0.03,
    interactions: 0.03,
    spammerIndicators: 0.06
  };

  let totalScore = 0;
  let totalWeight = 0;
  let criticalRedFlags = 0;

  // Lower thresholds for critical red flags detection
  // One single critical issue should count
  if (analyses.name?.fakeScore >= 12) criticalRedFlags++;
  if (analyses.email?.fakeScore >= 12) criticalRedFlags++;
  if (analyses.profileCompleteness?.score <= 25) criticalRedFlags++;
  if (analyses.photo?.fakeScore >= 15 || !analyses.photo) criticalRedFlags++;
  if (analyses.bio?.fakeScore >= 15) criticalRedFlags++;
  if (analyses.accountAge?.fakeScore >= 12) criticalRedFlags++;

  Object.keys(analyses).forEach(key => {
    const analysis = analyses[key];
    const weight = weights[key] || 0;
    
    if (!analysis) return;
    
    // Handle different types of scores
    if (key === 'profileCompleteness' && analysis.score !== undefined) {
      // inverted score - lower completeness = higher fake score
      const completenessScore = Math.max(0, 100 - (analysis.score / 100) * 100);
      totalScore += completenessScore * weight;
      totalWeight += weight;
    } else if (key === 'photo' && !analysis) {
      // Missing photo = maximum fake score for this category
      totalScore += 100 * weight;
      totalWeight += weight;
    } else if (analysis.fakeScore !== undefined) {
      // Standard fake score handling
      totalScore += analysis.fakeScore * weight;
      totalWeight += weight;
    }
  });

  let baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Apply multiplier for multiple critical red flags
  // More aggressive multipliers for fake detection
  let multiplier = 1;
  let additionalBonus = 0;
  
  if (criticalRedFlags >= 5) {
    multiplier = 3.5;  // Very likely fake with 5+ critical flags
    additionalBonus = 15;  // Plus additional boost
  } else if (criticalRedFlags >= 4) {
    multiplier = 3.0;
    additionalBonus = 12;
  } else if (criticalRedFlags >= 3) {
    multiplier = 2.5;
    additionalBonus = 8;
  } else if (criticalRedFlags >= 2) {
    multiplier = 2.0;
    additionalBonus = 5;
  } else if (criticalRedFlags >= 1) {
    multiplier = 1.3;
  }

  // Calculate final score with multiplier and bonus
  const finalScore = Math.min(baseScore * multiplier + additionalBonus, 100);

  return finalScore;
};

/**
 * Determine risk level based on score
 * More decisive classification to avoid "UNCERTAIN"
 */
const getRiskLevel = (score) => {
  if (score >= 85) return "CRITICAL - DEFINITELY FAKE";
  if (score >= 70) return "HIGH - VERY LIKELY FAKE";
  if (score >= 55) return "MEDIUM - LIKELY FAKE";
  if (score >= 40) return "SUSPICIOUS - NEEDS VERIFICATION";
  if (score >= 20) return "LOW - MINOR CONCERNS";
  return "MINIMAL - LIKELY GENUINE";
};

/**
 * Compile all indicators from analyses
 */
const compileIndicators = (analysis) => {
  const { detailedAnalysis, indicators } = analysis;

  // Extract suspicious indicators
  if (detailedAnalysis.name?.suspiciousPatterns?.length > 0) {
    indicators.suspicious.push(...detailedAnalysis.name.suspiciousPatterns);
  }

  if (detailedAnalysis.email?.suspiciousPatterns?.length > 0) {
    indicators.suspicious.push(...detailedAnalysis.email.suspiciousPatterns);
  }

  if (detailedAnalysis.photo?.anomalies?.length > 0) {
    indicators.suspicious.push(...detailedAnalysis.photo.anomalies);
  }

  if (detailedAnalysis.bio?.redFlags?.length > 0) {
    indicators.suspicious.push(...detailedAnalysis.bio.redFlags);
  }

  if (detailedAnalysis.accountAge?.riskIndicator === "CRITICAL" || 
      detailedAnalysis.accountAge?.riskIndicator === "HIGH") {
    indicators.suspicious.push(...detailedAnalysis.accountAge.analysis);
  }

  if (detailedAnalysis.spammerIndicators?.detected) {
    indicators.suspicious.push(...detailedAnalysis.spammerIndicators.indicators);
  }

  // Extract warnings
  if (detailedAnalysis.messagingBehavior?.warnings?.length > 0) {
    indicators.warnings.push(...detailedAnalysis.messagingBehavior.warnings);
  }

  if (detailedAnalysis.mindset?.concerns?.length > 0) {
    indicators.warnings.push(...detailedAnalysis.mindset.concerns);
  }

  // Extract positive indicators
  if (detailedAnalysis.profileCompleteness?.completenessPercentage > 80) {
    indicators.positive.push("Profile is well-completed");
  }

  if (detailedAnalysis.accountAge?.daysSinceCreation > 30) {
    indicators.positive.push("Account is well-established");
  }

  if (detailedAnalysis.messagingBehavior?.isActive) {
    indicators.positive.push("Active in messaging");
  }

  if (detailedAnalysis.interactions?.naturalPattern) {
    indicators.positive.push("Natural interaction patterns detected");
  }
};

export default performAdvancedAnalysis;
