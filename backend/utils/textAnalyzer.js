/**
 * Text Analyzer
 * Analyzes bio, messages, and behavior patterns to detect fake profiles
 * Includes mindset analysis, writing consistency, and behavioral indicators
 */

import Message from "../models/Message.js";

/**
 * Comprehensive bio analysis
 */
export const analyzeBio = (bio, userName) => {
  const analysis = {
    fakeScore: 0,
    redFlags: [],
    positiveIndicators: [],
    bioMetrics: {},
    writingStyle: {}
  };

  if (!bio || bio.trim().length === 0) {
    analysis.fakeScore += 18;
    analysis.redFlags.push("Bio is empty or missing - profile lacks personal information");
    return analysis;
  }

  const bioLength = bio.length;
  const bioWords = bio.trim().split(/\s+/).length;
  const bioSentences = bio.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  // 1. Bio Length Analysis
  if (bioLength < 10) {
    analysis.fakeScore += 15;
    analysis.redFlags.push("Bio is extremely short (less than 10 characters)");
  } else if (bioLength < 50) {
    analysis.fakeScore += 8;
    analysis.redFlags.push("Bio is quite short - minimal personal information");
  } else if (bioLength > 500 && bioLength < 1000) {
    analysis.positiveIndicators.push("Bio length is reasonable and detailed");
  } else if (bioLength > 3000) {
    analysis.fakeScore += 10;
    analysis.redFlags.push("Bio is excessively long - might contain spam or bot text");
  }

  // 2. Word and Sentence Analysis
  analysis.bioMetrics = {
    characterCount: bioLength,
    wordCount: bioWords,
    sentenceCount: bioSentences,
    avgWordsPerSentence: bioSentences > 0 ? (bioWords / bioSentences).toFixed(2) : 0,
    avgCharPerWord: bioWords > 0 ? (bioLength / bioWords).toFixed(2) : 0
  };

  // 3. Detect copy-paste or generic content
  const genericPhrases = [
    "looking for a life partner",
    "simple living high thinking",
    "seeking true love",
    "want someone who understands me",
    "likes traveling",
    "family oriented",
    "gym and yoga",
    "netflix and chill",
    /love(s)? to (travel|read|cook)/i,
    /looking for (someone|a person)/i
  ];

  let genericPhraseCount = 0;
  genericPhrases.forEach(phrase => {
    if (phrase instanceof RegExp) {
      if (phrase.test(bio)) genericPhraseCount++;
    } else if (bio.toLowerCase().includes(phrase.toLowerCase())) {
      genericPhraseCount++;
    }
  });

  if (genericPhraseCount > 3) {
    analysis.fakeScore += 10;
    analysis.redFlags.push(
      `Bio contains ${genericPhraseCount} generic/copy-paste phrases - likely not personalized`
    );
  }

  // 4. Detect overly perfect or unrealistic bios
  const perfectPhrases = [
    "perfect partner",
    "ideal woman/man",
    "dream girl/boy",
    "instagram model",
    "miss universe",
    "5 star hotel",
    "luxury lifestyle"
  ];

  let perfectCount = perfectPhrases.filter(p => bio.toLowerCase().includes(p)).length;
  if (perfectCount > 2) {
    analysis.fakeScore += 12;
    analysis.redFlags.push("Bio claims unrealistic/overly perfect characteristics");
  }

  // 5. Detect suspicious keywords
  const suspiciousKeywords = [
    "bitcoin", "cryptocurrency", "business opportunity", "work from home",
    "earn money fast", "investment", "guaranteed returns", "no risk",
    "upwork", "fiverr", "freelance", "chat only", "online only",
    "premium membership", "send money", "western union", "money transfer"
  ];

  let suspiciousCount = 0;
  suspiciousKeywords.forEach(keyword => {
    if (bio.toLowerCase().includes(keyword)) {
      suspiciousCount++;
    }
  });

  if (suspiciousCount > 1) {
    analysis.fakeScore += 15;
    analysis.redFlags.push(`Bio contains ${suspiciousCount} suspicious financial keywords`);
  }

  // 6. Detect overly flattering or seduction language
  const flatteringKeywords = [
    "will do anything for you",
    "love at first sight",
    "you are my dream",
    "marry you immediately",
    "will buy you anything",
    "can't live without you"
  ];

  const flatteningCount = flatteringKeywords.filter(k => bio.toLowerCase().includes(k)).length;
  if (flatteningCount > 0) {
    analysis.fakeScore += 8;
    analysis.redFlags.push(`Bio contains ${flatteningCount} overly flattering/seductive phrases`);
  }

  // 7. Writing style analysis
  analysis.writingStyle = analyzeWritingStyle(bio);
  if (analysis.writingStyle.suspiciousScore > 15) {
    analysis.fakeScore += analysis.writingStyle.suspiciousScore / 2;
  }

  // 8. Detect name mentions consistency
  if (userName && bioLength > 20) {
    const nameMentions = (bio.match(new RegExp(userName, "gi")) || []).length;
    if (nameMentions === 0) {
      analysis.positiveIndicators.push("Bio written in first person (natural style)");
    }
  }

  // 9. Detect language consistency
  const languageMetrics = detectLanguageQuality(bio);
  if (languageMetrics.isLowQuality) {
    analysis.fakeScore += 6;
    analysis.redFlags.push("Bio contains poor grammar, spelling, or language issues");
  }

  // 10. Emoji and special character analysis
  const emojiCount = (bio.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const specialCharCount = (bio.match(/[^a-zA-Z0-9\s.!?,]/g) || []).length;

  if (emojiCount > 10) {
    analysis.fakeScore += 6;
    analysis.redFlags.push("Bio contains excessive emojis (bot-like behavior)");
  }

  if (specialCharCount > bioLength * 0.1) {
    analysis.fakeScore += 5;
    analysis.redFlags.push("Bio contains excessive special characters");
  }

  // Positive indicators
  if (bioLength > 100 && bioLength < 500) {
    analysis.positiveIndicators.push("Bio is detailed and personal");
  }

  if (genericPhraseCount < 2 && perfectCount === 0) {
    analysis.positiveIndicators.push("Bio appears personalized and authentic");
  }

  return analysis;
};

/**
 * Analyze behavior patterns from user's messages
 */
export const analyzeBehaviorFromMessages = async (userId) => {
  const analysis = {
    fakeScore: 0,
    messagePatterns: {},
    redFlags: [],
    positiveIndicators: [],
    suspiciousPatterns: []
  };

  try {
    const messages = await Message.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(100);

    if (messages.length === 0) {
      analysis.redFlags.push("No messaging activity found");
      return analysis;
    }

    const sentMessages = messages.filter(m => m.fromUser.toString() === userId.toString());
    const receivedMessages = messages.filter(m => m.toUser.toString() === userId.toString());

    // 1. Message frequency analysis
    analysis.messagePatterns = {
      totalMessages: messages.length,
      sentCount: sentMessages.length,
      receivedCount: receivedMessages.length,
      responseRate: receivedMessages.length > 0 
        ? (sentMessages.length / receivedMessages.length).toFixed(2) 
        : 0
    };

    // 2. Check for copy-paste behavior
    const messageTexts = sentMessages.map(m => m.content?.toLowerCase() || "");
    const uniqueMessages = new Set(messageTexts).size;
    const duplicateRatio = 1 - (uniqueMessages / sentMessages.length);

    if (duplicateRatio > 0.5 && sentMessages.length > 10) {
      analysis.fakeScore += 15;
      analysis.suspiciousPatterns.push(
        `${(duplicateRatio * 100).toFixed(0)}% of messages are duplicates (bot-like)`
      );
    }

    // 3. Check for message timing patterns (bot behavior)
    const timingAnalysis = analyzeMessageTiming(sentMessages);
    if (timingAnalysis.suspiciousPattern) {
      analysis.fakeScore += 10;
      analysis.suspiciousPatterns.push(timingAnalysis.description);
    }

    // 4. Analyze message length patterns
    const avgMessageLength = sentMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / 
                            (sentMessages.length || 1);
    
    if (avgMessageLength < 5 && sentMessages.length > 20) {
      analysis.fakeScore += 8;
      analysis.redFlags.push("Very short messages (bot-like behavior)");
    }

    // 5. Check for generic responses
    const genericResponses = [
      "hi", "hello", "ok", "fine", "yes", "no", "lol", "haha",
      "nice", "good", "thanks", "what's up"
    ];

    const genericCount = sentMessages.filter(m => 
      genericResponses.includes((m.content?.toLowerCase() || "").trim())
    ).length;

    if (sentMessages.length > 5 && genericCount > sentMessages.length * 0.5) {
      analysis.fakeScore += 12;
      analysis.suspiciousPatterns.push("Predominantly generic/one-word responses");
    }

    // Positive indicators
    if (analysis.messagePatterns.responseRate > 0.5) {
      analysis.positiveIndicators.push("Maintains good conversation responsiveness");
    }

    if (uniqueMessages > sentMessages.length * 0.7) {
      analysis.positiveIndicators.push("Messages show variety and personalization");
    }

  } catch (error) {
    console.error("Error analyzing message behavior:", error);
  }

  return analysis;
};

/**
 * Detect mindset indicators from bio and messages
 */
export const detectMindsetIndicators = async (userId, bio) => {
  const analysis = {
    fakeScore: 0,
    concerns: [],
    indicators: {},
    mindsetCategory: "unknown"
  };

  const combinedText = `${bio || ""}`.toLowerCase();

  // 1. Financial Interest Analysis
  const financialKeywords = [
    "money", "rich", "expensive", "luxury", "investment", "business",
    "earn", "income", "wealthy", "gold", "jewelry", "designer"
  ];

  const financialCount = financialKeywords.filter(k => 
    combinedText.includes(k)
  ).length;

  if (financialCount > 3) {
    analysis.fakeScore += 10;
    analysis.concerns.push("Excessive focus on money/wealth indicators");
    analysis.mindsetCategory = "money-focused";
  }

  // 2. Romantic Desperation Indicators
  const desperationKeywords = [
    "desperate", "lonely", "alone", "heartbroken", "sad", "depressed",
    "need love", "hurting", "suffering", "painful"
  ];

  const desperationCount = desperationKeywords.filter(k => 
    combinedText.includes(k)
  ).length;

  if (desperationCount > 0) {
    analysis.fakeScore += 8;
    analysis.concerns.push("Shows signs of emotional desperation");
  }

  // 3. Trust Issues / Over-caution
  const cautionKeywords = [
    "no scammers", "genuine only", "serious inquiries",
    "trust issues", "verified", "authentic", "real person"
  ];

  const cautionCount = cautionKeywords.filter(k => 
    combinedText.includes(k)
  ).length;

  if (cautionCount > 2) {
    analysis.concerns.push("Expressed distrust/wariness (possibly from past scams)");
  }

  // 4. Aggressive or Demanding Tone
  if (combinedText.includes("must") || combinedText.includes("have to") || 
      combinedText.includes("always")) {
    analysis.fakeScore += 5;
    analysis.concerns.push("Uses demanding or controlling language");
  }

  // 5. Over-promising or Unrealistic Expectations
  if (combinedText.includes("perfect") || combinedText.includes("ideal") ||
      combinedText.includes("flawless")) {
    analysis.fakeScore += 6;
    analysis.concerns.push("Has unrealistic or perfectionist mindset");
  }

  // 6. Health/Fitness Obsession
  if ((combinedText.match(/gym|fitness|diet|nutrition|protein|workout/g) || []).length > 3) {
    analysis.indicators.healthFocused = true;
  }

  // 7. Travel/Adventure Focus
  if ((combinedText.match(/travel|adventure|explore|backpack|hike/g) || []).length > 3) {
    analysis.indicators.adventureFocused = true;
  }

  // 8. Family Orientation
  if ((combinedText.match(/family|parent|child|marriage|culture|tradition|values/g) || []).length > 3) {
    analysis.indicators.familyOriented = true;
    analysis.positiveIndicators = ["Shows family values"];
  }

  // 9. Intellectual/Career Focus
  if ((combinedText.match(/study|career|professional|business|education|skill/g) || []).length > 3) {
    analysis.indicators.careerFocused = true;
    analysis.positiveIndicators = ["Shows career ambition"];
  }

  return analysis;
};

/**
 * Calculate writing consistency across messages
 */
export const calculateWritingConsistency = (messages) => {
  if (!messages || messages.length < 2) {
    return { score: 0, consistency: "unknown" };
  }

  const vocabularySizes = messages.map(msg => 
    new Set(msg.toLowerCase().split(/\s+/)).size
  );

  const avgVocab = vocabularySizes.reduce((a, b) => a + b, 0) / vocabularySizes.length;
  const variance = vocabularySizes.reduce((sum, v) => sum + Math.pow(v - avgVocab, 2), 0) / 
                  vocabularySizes.length;
  const stdDev = Math.sqrt(variance);

  // Low variance = more consistent writing
  const consistency = Math.max(0, 100 - (stdDev * 5));

  return {
    score: consistency,
    consistency: consistency > 80 ? "highly consistent" : 
                 consistency > 60 ? "moderately consistent" :
                 consistency > 40 ? "somewhat variable" : "highly variable",
    details: {
      vocabularyVariance: stdDev.toFixed(2),
      avgVocabularySize: avgVocab.toFixed(0)
    }
  };
};

/**
 * Helper: Analyze writing style for red flags
 */
const analyzeWritingStyle = (text) => {
  const analysis = {
    suspiciousScore: 0,
    style: "unknown",
    flags: []
  };

  // Check for ALL CAPS sections
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    analysis.suspiciousScore += 8;
    analysis.flags.push("Excessive use of CAPITAL LETTERS");
  }

  // Check for excessive punctuation
  const punctCount = (text.match(/[!?]{2,}/g) || []).length;
  if (punctCount > 3) {
    analysis.suspiciousScore += 5;
    analysis.flags.push("Excessive exclamation marks or question marks");
  }

  // Check for coherence
  const words = text.split(/\s+/);
  if (words.length > 20) {
    const uniqueRatio = new Set(words).size / words.length;
    if (uniqueRatio < 0.2) {
      analysis.suspiciousScore += 8;
      analysis.flags.push("Low word diversity (repetitive, bot-like)");
    }
  }

  return analysis;
};

/**
 * Helper: Detect language quality
 */
const detectLanguageQuality = (text) => {
  const analysis = {
    isLowQuality: false,
    issues: []
  };

  // Check for common spelling errors
  const commonMisspellings = [
    { wrong: "teh", right: "the" },
    { wrong: "recieve", right: "receive" },
    { wrong: "occured", right: "occurred" },
    { wrong: "thier", right: "their" }
  ];

  let errorCount = 0;
  commonMisspellings.forEach(({ wrong, right }) => {
    if (text.toLowerCase().includes(wrong)) {
      errorCount++;
      analysis.issues.push(`Misspelling: "${wrong}" (should be "${right}")`);
    }
  });

  if (errorCount > 0) {
    analysis.isLowQuality = true;
  }

  return analysis;
};

/**
 * Helper: Analyze message timing patterns
 */
const analyzeMessageTiming = (messages) => {
  if (messages.length < 5) {
    return { suspiciousPattern: false };
  }

  const timestamps = messages.map(m => new Date(m.createdAt).getTime());
  const intervals = [];

  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i - 1] - timestamps[i]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Very consistent timing suggests automation
  if (stdDev < avgInterval * 0.1 && avgInterval < 60000) {
    return {
      suspiciousPattern: true,
      description: "Highly regular message timing pattern (possible automation)"
    };
  }

  // All messages within seconds
  if (avgInterval < 1000 && messages.length > 10) {
    return {
      suspiciousPattern: true,
      description: "Messages sent in rapid succession (possible bot/spam)"
    };
  }

  return { suspiciousPattern: false };
};

export default {
  analyzeBio,
  analyzeBehaviorFromMessages,
  detectMindsetIndicators,
  calculateWritingConsistency
};
