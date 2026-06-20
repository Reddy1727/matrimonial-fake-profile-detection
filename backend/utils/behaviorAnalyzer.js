/**
 * Behavior Analyzer
 * Analyzes user interaction patterns, messaging behavior, and detects spammer/bot activity
 */

import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";

/**
 * Comprehensive behavior pattern analysis
 */
export const analyzeBehaviorPatterns = async (userId) => {
  const analysis = {
    fakeScore: 0,
    isActive: false,
    warnings: [],
    positiveIndicators: [],
    patterns: {},
    engagementScore: 0
  };

  try {
    // Get all messages and friend requests
    const [messages, friendRequests, receivedRequests] = await Promise.all([
      Message.find({
        $or: [{ fromUser: userId }, { toUser: userId }]
      }).sort({ createdAt: -1 }).limit(500),
      FriendRequest.find({ fromUser: userId }).sort({ createdAt: -1 }).limit(500),
      FriendRequest.find({ toUser: userId }).sort({ createdAt: -1 }).limit(500)
    ]);

    const sentMessages = messages.filter(m => m.fromUser.toString() === userId.toString());
    const receivedMessages = messages.filter(m => m.toUser.toString() === userId.toString());
    const acceptedRequests = await FriendRequest.countDocuments({
      $or: [
        { fromUser: userId, status: "accepted" },
        { toUser: userId, status: "accepted" }
      ]
    });

    analysis.patterns = {
      totalMessages: messages.length,
      sentMessages: sentMessages.length,
      receivedMessages: receivedMessages.length,
      totalFriendRequests: friendRequests.length + receivedRequests.length,
      sentRequests: friendRequests.length,
      receivedRequests: receivedRequests.length,
      acceptedConnections: acceptedRequests
    };

    // 1. Overall activity level
    analysis.isActive = messages.length > 0 || friendRequests.length > 0;

    // 2. Message engagement analysis
    if (sentMessages.length > 0) {
      const responseRate = receivedMessages.length > 0 
        ? sentMessages.length / receivedMessages.length 
        : 0;

      if (responseRate > 1.5) {
        analysis.warnings.push("Sends more messages than receives (possibly pushy)");
        analysis.fakeScore += 5;
      } else if (responseRate > 0.3) {
        analysis.positiveIndicators.push("Good message engagement ratio");
        analysis.engagementScore += 20;
      } else if (responseRate < 0.1 && receivedMessages.length > 10) {
        analysis.fakeScore += 8;
        analysis.warnings.push("Low response rate to incoming messages");
      }
    }

    // 3. Friend request patterns
    if (friendRequests.length > 0) {
      const requestToMessageRatio = friendRequests.length / (sentMessages.length || 1);
      
      if (requestToMessageRatio > 10 && sentMessages.length < 5) {
        analysis.fakeScore += 15;
        analysis.warnings.push(
          `Sends ${friendRequests.length} requests but has ${sentMessages.length} messages (spammer pattern)`
        );
      } else if (requestToMessageRatio > 3) {
        analysis.fakeScore += 8;
        analysis.warnings.push("High friend request to message ratio (possible bot behavior)");
      }
    }

    // 4. Acceptance rate
    if (analysis.patterns.totalFriendRequests > 0) {
      const acceptanceRate = analysis.patterns.receivedRequests > 0 ? acceptedRequests / analysis.patterns.receivedRequests : 0;
      if (acceptanceRate > 0.7) {
        analysis.positiveIndicators.push("High acceptance rate of incoming requests");
      }
    }

    // 5. Conversation completion analysis
    if (sentMessages.length > 0 && receivedMessages.length > 0) {
      const avgReplyTime = calculateAvgReplyTime(sentMessages, receivedMessages);
      if (avgReplyTime && avgReplyTime < 3600000) { // Less than 1 hour
        analysis.positiveIndicators.push("Quick response times to messages");
      } else if (avgReplyTime && avgReplyTime > 86400000) { // More than 24 hours
        analysis.fakeScore += 5;
        analysis.warnings.push("Very slow response time to messages");
      }
    }

    // 6. Account activity timing
    if (messages.length > 0) {
      const activityTiming = analyzeActivityTiming(messages);
      if (activityTiming.isRobotic) {
        analysis.fakeScore += 10;
        analysis.warnings.push("Activity pattern suggests bot or automated behavior");
      } else if (activityTiming.isSpread) {
        analysis.positiveIndicators.push("Natural activity spread across different times");
      }
    }

    // 7. Network analysis
    const uniqueConversationPartners = new Set([
      ...sentMessages.map(m => m.toUser.toString()),
      ...receivedMessages.map(m => m.fromUser.toString())
    ]).size;

    if (uniqueConversationPartners > friendRequests.length && uniqueConversationPartners > 10) {
      analysis.positiveIndicators.push("Interacts with diverse set of users");
    }

    // 8. Message quality over quantity
    const avgMessageLength = sentMessages.reduce((sum, m) => 
      sum + (m.content?.length || 0), 0) / (sentMessages.length || 1);

    if (avgMessageLength > 50) {
      analysis.positiveIndicators.push("Messages contain substantial content");
      analysis.engagementScore += 15;
    } else if (avgMessageLength < 5 && sentMessages.length > 20) {
      analysis.fakeScore += 8;
      analysis.warnings.push("Very short messages (possible bot)");
    }

    return analysis;

  } catch (error) {
    console.error("Behavior analysis error:", error);
    analysis.error = error.message;
  }

  return analysis;
};

/**
 * Comprehensive spammer behavior detection
 */
export const detectSpammerBehavior = async (userId) => {
  const analysis = {
    fakeScore: 0,
    detected: false,
    indicators: [],
    spamScore: 0,
    spamLevel: "UNKNOWN"
  };

  try {
    const [sentRequests, sentMessages, recentActivity] = await Promise.all([
      FriendRequest.countDocuments({ fromUser: userId }),
      Message.countDocuments({ fromUser: userId }),
      Message.find({ fromUser: userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .exec()
    ]);

    // 1. Rapid friend request spam
    if (sentRequests > 50) {
      analysis.fakeScore += 20;
      analysis.indicators.push(`Sent ${sentRequests} friend requests (mass outreach)`);
      analysis.spamScore += 30;
    } else if (sentRequests > 20) {
      analysis.fakeScore += 12;
      analysis.indicators.push(`Sent ${sentRequests} friend requests`);
      analysis.spamScore += 15;
    }

    // 2. Mass message spam (time-based)
    const last24HourMessages = recentActivity.filter(m => {
      const hoursSince = (new Date() - new Date(m.createdAt)) / (1000 * 60 * 60);
      return hoursSince < 24;
    }).length;

    if (last24HourMessages > 50) {
      analysis.fakeScore += 18;
      analysis.indicators.push(`Sent ${last24HourMessages} messages in 24 hours (mass messaging)`);
      analysis.spamScore += 25;
    } else if (last24HourMessages > 20) {
      analysis.fakeScore += 10;
      analysis.indicators.push(`High message volume in 24 hours: ${last24HourMessages}`);
      analysis.spamScore += 12;
    }

    // 3. Message content spam detection
    const spamKeywords = [
      "click here", "visit link", "earn money", "work from home",
      "investment opportunity", "send money", "western union",
      "guaranteed returns", "no experience needed", "free money"
    ];

    const spamMessageCount = recentActivity.filter(m => {
      const content = (m.content || "").toLowerCase();
      return spamKeywords.some(keyword => content.includes(keyword));
    }).length;

    if (spamMessageCount > 0) {
      analysis.fakeScore += 15;
      analysis.indicators.push(`${spamMessageCount} messages contain suspicious spam keywords`);
      analysis.spamScore += 20;
    }

    // 4. Copy-paste message detection
    const messageContents = recentActivity.map(m => m.content?.toLowerCase() || "");
    const uniqueMessages = new Set(messageContents).size;
    const copyPasteRatio = 1 - (uniqueMessages / recentActivity.length);

    if (recentActivity.length > 20 && copyPasteRatio > 0.6) {
      analysis.fakeScore += 20;
      analysis.indicators.push(
        `${(copyPasteRatio * 100).toFixed(0)}% of recent messages are duplicates (copy-paste)`
      );
      analysis.spamScore += 30;
    }

    // 5. Rapid repeated interactions with same users
    const targetUsers = recentActivity.map(m => m.toUser.toString());
    const userCounts = {};
    targetUsers.forEach(uid => {
      userCounts[uid] = (userCounts[uid] || 0) + 1;
    });

    const topTarget = Math.max(...Object.values(userCounts));
    if (topTarget > 10) {
      analysis.fakeScore += 8;
      analysis.indicators.push(
        `Sends multiple messages to same user repeatedly (${topTarget} messages)`
      );
      analysis.spamScore += 10;
    }

    // 6. Pattern-based spam scoring
    if (analysis.spamScore >= 60) {
      analysis.detected = true;
      analysis.spamLevel = "CRITICAL - LIKELY SPAMMER";
    } else if (analysis.spamScore >= 40) {
      analysis.detected = true;
      analysis.spamLevel = "HIGH - PROBABLE SPAMMER";
    } else if (analysis.spamScore >= 20) {
      analysis.spamLevel = "MEDIUM - POSSIBLE SPAMMER";
    } else {
      analysis.spamLevel = "LOW - UNLIKELY SPAMMER";
    }

    return analysis;

  } catch (error) {
    console.error("Spammer detection error:", error);
  }

  return analysis;
};

/**
 * Analyze interaction patterns for natural vs artificial behavior
 */
export const analyzeInteractionPatterns = async (userId) => {
  const analysis = {
    fakeScore: 0,
    naturalPattern: true,
    patterns: [],
    anomalies: []
  };

  try {
    const allActivity = await FriendRequest.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(500);

    if (allActivity.length === 0) {
      analysis.patterns.push("No interaction history");
      return analysis;
    }

    // 1. Distribution analysis
    const timeDistribution = analyzeTimeDistribution(allActivity);
    if (timeDistribution.isUneven) {
      analysis.fakeScore += 8;
      analysis.anomalies.push("Activity concentrated in specific time periods");
      analysis.naturalPattern = false;
    } else {
      analysis.patterns.push("Activity spread naturally across time");
    }

    // 2. Interaction diversity
    const targetUsers = allActivity
      .filter(a => a.fromUser.toString() === userId.toString())
      .map(a => a.toUser.toString());

    const uniqueTargets = new Set(targetUsers).size;
    const concentrationRatio = uniqueTargets > 0 ? targetUsers.length / uniqueTargets : 0;

    if (concentrationRatio < 1.5) {
      analysis.patterns.push("Interacts with diverse set of persons");
    } else if (concentrationRatio > 3) {
      analysis.fakeScore += 6;
      analysis.anomalies.push("Focused interactions with same few people");
    }

    // 3. Request acceptance analysis
    const sentRequests = allActivity.filter(a => a.fromUser.toString() === userId.toString());
    const receivedRequests = allActivity.filter(a => a.toUser.toString() === userId.toString());

    if (sentRequests.length > 0 && receivedRequests.length > 0) {
      const ratio = receivedRequests.length / sentRequests.length;
      if (ratio > 0.3) {
        analysis.patterns.push("Balanced send-receive ratio");
      } else if (ratio < 0.05 && sentRequests.length > 20) {
        analysis.fakeScore += 10;
        analysis.anomalies.push("Almost all requests are outgoing (possible bot)");
        analysis.naturalPattern = false;
      }
    }

    // 4. Temporal patterns
    const temporalAnalysis = analyzeTemporalPatterns(allActivity);
    if (temporalAnalysis.isConsistent) {
      analysis.patterns.push("Consistent activity pattern (user is established)");
    } else if (temporalAnalysis.isBursty) {
      analysis.fakeScore += 5;
      analysis.anomalies.push("Sporadic burst activity pattern (possible bot awakening)");
      analysis.naturalPattern = false;
    }

    return analysis;

  } catch (error) {
    console.error("Interaction pattern analysis error:", error);
  }

  return analysis;
};

/**
 * Helper: Calculate average reply time
 */
const calculateAvgReplyTime = (sentMessages, receivedMessages) => {
  if (sentMessages.length === 0 || receivedMessages.length === 0) return null;

  let totalReplyTime = 0;
  let replyCount = 0;

  // Find patterns of sent -> received to estimate reply time
  const received = receivedMessages.map(m => new Date(m.createdAt).getTime());
  
  sentMessages.forEach(sent => {
    const sentTime = new Date(sent.createdAt).getTime();
    const nextReceived = received.find(r => r > sentTime);
    
    if (nextReceived) {
      totalReplyTime += nextReceived - sentTime;
      replyCount++;
    }
  });

  return replyCount > 0 ? totalReplyTime / replyCount : null;
};

/**
 * Helper: Analyze activity timing for robotic patterns
 */
const analyzeActivityTiming = (messages) => {
  const analysis = {
    isRobotic: false,
    isSpread: false,
    hoursActive: new Set(),
    avgInterval: 0
  };

  // Get hours of activity
  messages.forEach(msg => {
    const hour = new Date(msg.createdAt).getHours();
    analysis.hoursActive.add(hour);
  });

  // Calculate intervals between messages
  const intervals = [];
  const timestamps = messages.map(m => new Date(m.createdAt).getTime());
  
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i - 1] - timestamps[i]);
  }

  if (intervals.length > 0) {
    analysis.avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Very regular intervals suggest bot
    const variance = intervals.reduce((sum, i) => 
      sum + Math.pow(i - analysis.avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < analysis.avgInterval * 0.05) {
      analysis.isRobotic = true;
    }
  }

  // Activity spread
  analysis.isSpread = analysis.hoursActive.size > 12;

  return analysis;
};

/**
 * Helper: Analyze time distribution
 */
const analyzeTimeDistribution = (activities) => {
  const hourCounts = {};
  
  activities.forEach(activity => {
    const hour = new Date(activity.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const hours = Object.values(hourCounts);
  const avgCount = hours.reduce((a, b) => a + b, 0) / hours.length;
  const variance = hours.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / hours.length;
  const stdDev = Math.sqrt(variance);

  return {
    isUneven: stdDev > avgCount * 0.5,
    hoursActive: Object.keys(hourCounts).length,
    variance: stdDev
  };
};

/**
 * Helper: Analyze temporal patterns
 */
const analyzeTemporalPatterns = (activities) => {
  if (activities.length < 10) {
    return { isConsistent: true, isBursty: false };
  }

  const intervals = [];
  const timestamps = activities.map(a => new Date(a.createdAt).getTime()).sort((a, b) => b - a);
  
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i - 1] - timestamps[i]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  return {
    isConsistent: stdDev < avgInterval * 0.3,
    isBursty: stdDev > avgInterval * 1.5
  };
};

export default {
  analyzeBehaviorPatterns,
  detectSpammerBehavior,
  analyzeInteractionPatterns
};
