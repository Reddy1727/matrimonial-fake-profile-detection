import { exec } from "child_process";
import { performAdvancedAnalysis } from "./advancedAnalyzer.js";

/**
 * Call ML model with advanced features for prediction
 */
export const predictProfileWithAdvancedAnalysis = async (user, profile) => {
  try {
    // Perform comprehensive analysis
    const analysis = await performAdvancedAnalysis(user, profile);

    // Extract features for ML model
    const features = extractFeaturesForML(analysis);

    // Call Python ML model with features
    const mlResult = await callMLModel(features);

    return {
      status: "success",
      analysis,
      mlResult,
      overallScore: calculateFinalScore(analysis, mlResult),
      recommendation: generateRecommendation(analysis, mlResult)
    };
  } catch (error) {
    console.error("ML Prediction Error:", error);
    return {
      status: "error",
      message: error.message,
      analysis: null,
      mlResult: null
    };
  }
};

/**
 * Extract features from detailed analysis for ML model
 */
const extractFeaturesForML = (analysis) => {
  const { detailedAnalysis } = analysis;

  return {
    // Profile Completeness
    profile_completeness_score: detailedAnalysis.profileCompleteness?.score || 0,

    // Name & Email Analysis
    name_suspicion_score: detailedAnalysis.name?.fakeScore || 0,
    email_suspicion_score: detailedAnalysis.email?.fakeScore || 0,

    // Photo Analysis
    has_photo: detailedAnalysis.photo ? 1 : 0,
    photo_anomaly_score: detailedAnalysis.photoAnomalies?.fakeScore || 0,

    // Bio Analysis
    bio_length: analysis.detailedAnalysis.bio?.bioMetrics?.characterCount || 0,
    bio_generic_phrases_count: detailedAnalysis.bio?.redFlags?.length || 0,
    bio_red_flags_count: detailedAnalysis.bio?.redFlags?.length || 0,
    bio_suspicion_score: detailedAnalysis.bio?.fakeScore || 0,

    // Account Age
    days_since_creation: detailedAnalysis.accountAge?.daysSinceCreation || 0,
    account_age_suspicion_score: detailedAnalysis.accountAge?.fakeScore || 0,

    // Messaging Behavior
    total_messages: detailedAnalysis.messagingBehavior?.patterns?.totalMessages || 0,
    sent_messages: detailedAnalysis.messagingBehavior?.patterns?.sentMessages || 0,
    response_rate: parseFloat(detailedAnalysis.messagingBehavior?.patterns?.responseRate || 0),
    message_to_request_ratio: calculateMessageToRequestRatio(detailedAnalysis),
    message_content_suspicion_score: detailedAnalysis.messageContent?.fakeScore || 0,

    // Friend Request Patterns
    total_friend_requests: detailedAnalysis.messagingBehavior?.patterns?.totalFriendRequests || 0,
    accepted_friends: detailedAnalysis.messagingBehavior?.patterns?.acceptedConnections || 0,
    request_acceptance_rate: calculateRequestAcceptanceRate(detailedAnalysis),

    // Behavior Patterns
    activity_consistency_score: detailedAnalysis.interactions?.fakeScore || 0,
    interaction_diversity: calculateInteractionDiversity(detailedAnalysis),
    messaging_behavior_suspicion_score: detailedAnalysis.messagingBehavior?.fakeScore || 0,

    // Spammer Indicators
    spammer_indicators_score: detailedAnalysis.spammerIndicators?.fakeScore || 0,

    // Mindset Analysis
    mindset_suspicion_score: detailedAnalysis.mindset?.fakeScore || 0,

    // Photo Consistency
    photo_consistency_score: detailedAnalysis.photo?.fakeScore || 0
  };
};

/**
 * Call Python ML model for prediction
 */
const callMLModel = (features) => {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";
    const modelPath = process.env.ML_MODEL_PATH || "../ml-model/predict.py";
    const featuresJson = JSON.stringify(features);

    // Escape JSON for shell
    const escapedJson = featuresJson.replace(/"/g, '\\"');
    const command = `${pythonPath} ${modelPath} "${escapedJson}"`;

    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error("ML Model Error:", error);
        return reject(new Error("ML model execution failed"));
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        console.error("ML Output Parse Error:", parseError, "Output:", stdout);
        reject(new Error("Failed to parse ML model output"));
      }
    });
  });
};

/**
 * Calculate final fake score combining analysis and ML prediction
 */
const calculateFinalScore = (analysis, mlResult) => {
  // Weight: 40% ML prediction, 60% detailed analysis
  const mlScore = mlResult?.fakeScore || 0;
  const analysisScore = analysis?.overallFakeScore || 0;

  const finalScore = mlScore * 0.4 + analysisScore * 0.6;

  return {
    mlPredictionScore: mlScore,
    detailedAnalysisScore: analysisScore,
    combinedFakeScore: finalScore,
    riskLevel: getRiskLevelFromScore(finalScore),
    confidence: {
      ml: mlResult?.confidence || 0,
      analysis: Math.abs(analysisScore - 50) * 2 // Convert to 0-100 scale
    }
  };
};

/**
 * Generate actionable recommendation
 */
const generateRecommendation = (analysis, mlResult) => {
  const score = analysis.overallFakeScore;
  const topRedFlags = analysis.indicators.suspicious.slice(0, 5);

  let recommendation = {
    action: "UNKNOWN",
    reason: "",
    redFlags: topRedFlags,
    requiredActions: []
  };

  if (score >= 80) {
    recommendation.action = "BLOCK";
    recommendation.reason = "Profile has critical indicators of being fake";
    recommendation.requiredActions = [
      "Block profile immediately",
      "Flag for admin review",
      "Add to spam list",
      "Prevent from contacting other users"
    ];
  } else if (score >= 60) {
    recommendation.action = "FLAG_FOR_REVIEW";
    recommendation.reason = "Profile has high probability of being fake";
    recommendation.requiredActions = [
      "Manual review by moderator",
      "Verify identity with secondary proof",
      "Limit messaging capabilities temporarily",
      "Monitor activity closely"
    ];
  } else if (score >= 40) {
    recommendation.action = "VERIFY_IDENTITY";
    recommendation.reason = "Profile shows some suspicious indicators";
    recommendation.requiredActions = [
      "Request additional verification",
      "Ask for phone verification",
      "Request photo with ID",
      "Monitor for 14 days"
    ];
  } else if (score >= 20) {
    recommendation.action = "MONITOR";
    recommendation.reason = "Profile has minor red flags";
    recommendation.requiredActions = [
      "Regular monitoring",
      "Flag if suspicious activity detected",
      "Ask user to complete profile"
    ];
  } else {
    recommendation.action = "APPROVE";
    recommendation.reason = "Profile appears to be genuine";
    recommendation.requiredActions = []
  }

  return recommendation;
};

/**
 * Get risk level string from score
 */
const getRiskLevelFromScore = (score) => {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "MINIMAL";
};

/**
 * Helper: Calculate message to request ratio
 */
const calculateMessageToRequestRatio = (analysis) => {
  const messages = analysis.messagingBehavior?.patterns?.totalMessages || 1;
  const requests = analysis.messagingBehavior?.patterns?.totalFriendRequests || 1;
  return messages / requests;
};

/**
 * Helper: Calculate request acceptance rate
 */
const calculateRequestAcceptanceRate = (analysis) => {
  const accepted = analysis.messagingBehavior?.patterns?.acceptedConnections || 0;
  const total = analysis.messagingBehavior?.patterns?.totalFriendRequests || 1;
  return total > 0 ? (accepted / total) : 0;
};

/**
 * Helper: Calculate interaction diversity score
 */
const calculateInteractionDiversity = (analysis) => {
  // This would be calculated based on unique users interacted with
  // For now, returning a base value
  return 50; // Default moderate diversity
};

export { performAdvancedAnalysis };

export default {
  predictProfileWithAdvancedAnalysis
};