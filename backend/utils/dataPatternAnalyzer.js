/**
 * Data Pattern Analyzer
 * Analyzes name and email patterns for consistency, authenticity, and red flags
 */

/**
 * Analyze name patterns for red flags and authenticity
 */
export const analyzeNamePatterns = async (name, email) => {
  const analysis = {
    fakeScore: 0,
    suspiciousPatterns: [],
    positiveIndicators: [],
    details: []
  };

  if (!name || name.trim().length === 0) {
    analysis.fakeScore += 15;
    analysis.suspiciousPatterns.push("Name is empty or missing");
    return analysis;
  }

  const nameParts = name.trim().split(/\s+/);
  const nameLength = name.length;
  const emailUsername = email.split("@")[0];

  // 1. Check for suspicious name lengths
  if (nameLength < 3) {
    analysis.fakeScore += 20;
    analysis.suspiciousPatterns.push("Name too short (less than 3 characters)");
  } else if (nameLength === 3 && nameParts.length === 1) {
    // Single 3-letter name like "abc", "xyz" is suspiciously short
    analysis.fakeScore += 18;
    analysis.suspiciousPatterns.push("Name is suspiciously short (single 3-letter name)");
  } else if (nameLength < 5 && nameParts.length === 1) {
    // Very short single names are suspicious
    analysis.fakeScore += 12;
    analysis.suspiciousPatterns.push("Very short single-word name (suspicious)");
  } else if (nameLength > 100) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Name unusually long (more than 100 characters)");
  } else if (nameLength >= 5 && nameLength <= 50 && nameParts.length >= 2) {
    analysis.positiveIndicators.push("Name length is reasonable (multi-part name)");
  }

  // 2. Check for excessive spaces or special formatting
  if (name.includes("  ")) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Multiple consecutive spaces in name");
  }

  // 3. Check for only numbers or only special characters
  if (/^\d+$/.test(name.replace(/\s/g, ""))) {
    analysis.fakeScore += 15;
    analysis.suspiciousPatterns.push("Name consists only of numbers");
  }

  if (/^[^a-zA-Z\s]+$/.test(name)) {
    analysis.fakeScore += 15;
    analysis.suspiciousPatterns.push("Name contains no alphabetic characters");
  }

  // 4. Check for random character sequences (bot-like names)
  const hasConsecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(name);
  if (hasConsecutiveConsonants) {
    analysis.fakeScore += 6;
    analysis.suspiciousPatterns.push("Name contains unusual consonant sequences");
  }

  // 5. Name-Email Consistency Check
  const emailNameMatch = calculateStringSimilarity(
    nameToInitials(name),
    emailUsername.toLowerCase().substring(0, 3)
  );

  if (emailNameMatch > 0.7) {
    analysis.positiveIndicators.push("Name and email show good consistency");
  } else if (emailNameMatch < 0.2 && emailUsername.length > 3) {
    analysis.fakeScore += 6;
    analysis.suspiciousPatterns.push("Name and email username don't match (potential inconsistency)");
  }

  // 6. Check for common fake name patterns
  const suspiciousPatterns = [
    /^admin$/i,
    /^test$/i,
    /^user\d+$/i,
    /^fake/i,
    /^bot/i,
    /^spam/i,
    /^dummy/i,
    /^temp/i,
    /^anonymous/i,
    /^\d+user/i,
    /^[a-z]{3}$/i,  // Exactly 3 letters like abc, xyz, def, etc.
    /^sample$/i,
    /^demo$/i,
    /^placeholder/i,
    /^noname/i
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(name.trim())) {
      // Extra penalty for 3-letter generic names
      const penalty = /^[a-z]{3}$/i.test(name.trim()) ? 25 : 20;
      analysis.fakeScore += penalty;
      analysis.suspiciousPatterns.push(`Name matches suspicious pattern: ${pattern}`);
    }
  });

  // 7. Check for repeated characters
  const maxRepeatedChar = getMaxRepeatedCharacters(name);
  if (maxRepeatedChar > 3) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push(`Name has excessive repeated characters (${maxRepeatedChar} times)`);
  }

  // 8. Check for name part count (typically real names have 2-3 parts)
  if (nameParts.length === 1 && nameLength > 10) {
    analysis.positiveIndicators.push("Single name part accepted (could be actual name style)");
  } else if (nameParts.length > 5) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Name has too many parts (suspicious formatting)");
  }

  // 9. Check for character diversity
  const uniqueChars = new Set(name.toLowerCase().replace(/\s/g, "")).size;
  const charDiversity = uniqueChars / name.replace(/\s/g, "").length;
  if (charDiversity < 0.4) {
    analysis.fakeScore += 5;
    analysis.suspiciousPatterns.push("Name has low character diversity (repetitive pattern)");
  }

  // 10. Check for common real name indicators
  if (isCommonName(nameParts[0])) {
    analysis.positiveIndicators.push("First name is common/legitimate");
  }

  analysis.details = [
    `Name length: ${nameLength} characters`,
    `Number of parts: ${nameParts.length}`,
    `Email-Name consistency: ${(emailNameMatch * 100).toFixed(1)}%`,
    `Character diversity: ${(charDiversity * 100).toFixed(1)}%`
  ];

  return analysis;
};

/**
 * Analyze email patterns for red flags
 */
export const analyzeEmailPatterns = (email) => {
  const analysis = {
    fakeScore: 0,
    suspiciousPatterns: [],
    positiveIndicators: [],
    emailType: "unknown",
    details: []
  };

  if (!email || email.trim().length === 0) {
    analysis.fakeScore += 30;
    analysis.suspiciousPatterns.push("Email is empty or missing");
    return analysis;
  }

  // Check for spaces in email (major red flag)
  if (email.includes(" ")) {
    analysis.fakeScore += 35;
    analysis.suspiciousPatterns.push("Email contains spaces (clearly invalid)");
    return analysis;
  }

  // Check for valid @ symbol and domain structure
  const [username, domain] = email.toLowerCase().split("@");

  // 1. Check for valid format
  if (!email.includes("@") || !email.includes(".")) {
    analysis.fakeScore += 35; // Increased from 20
    analysis.suspiciousPatterns.push("Email missing @ or . - clearly invalid format");
    return analysis;
  }

  // 2. Check for suspicious email domains (disposable, temporary)
  const disposableDomains = [
    "tempmail", "guerrillamail", "mailinator", "10minutemail",
    "throwaway", "fakeinbox", "trashmail", "yopmail",
    "temp-mail", "temporary-email"
  ];

  const isDomainDisposable = disposableDomains.some(d => domain.includes(d));
  if (isDomainDisposable) {
    analysis.fakeScore += 25;
    analysis.suspiciousPatterns.push("Email uses temporary/disposable email service");
    analysis.emailType = "disposable";
  }

  // 3. Check for common legitimate domains
  const legitimateDomains = [
    "gmail", "yahoo", "outlook", "hotmail", "icloud",
    "protonmail", "aol"
  ];

  const isLegitimate = legitimateDomains.some(d => domain.includes(d));
  if (isLegitimate) {
    analysis.positiveIndicators.push("Email uses legitimate domain");
    analysis.emailType = "legitimate";
  } else if (domain.length > 30) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Unusual email domain (very long)");
  }

  // 4. Check username patterns
  if (/^\d+$/.test(username)) {
    analysis.fakeScore += 10;
    analysis.suspiciousPatterns.push("Email username contains only numbers");
  }

  if (username.length < 3) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Email username too short");
  }

  if (username.length > 64) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Email username too long");
  }

  // 5. Check for suspicious username patterns
  const suspiciousUsernames = [
    /^admin/i, /^test/i, /^user\d/i, /^fake/i, /^bot/i,
    /^[a-z]\.{5,}/i, /xyz{3,}/i
  ];

  suspiciousUsernames.forEach(pattern => {
    if (pattern.test(username)) {
      analysis.fakeScore += 12;
      analysis.suspiciousPatterns.push(`Email username matches suspicious pattern`);
    }
  });

  // 6. Check for excessive special characters
  const specialCharCount = (username.match(/[._-]/g) || []).length;
  if (specialCharCount > 5) {
    analysis.fakeScore += 8;
    analysis.suspiciousPatterns.push("Email username has excessive special characters");
  }

  // 7. Check for repeated characters
  const maxRepeated = getMaxRepeatedCharacters(username);
  if (maxRepeated > 4) {
    analysis.fakeScore += 7;
    analysis.suspiciousPatterns.push("Email username has excessive repeated characters");
  }

  analysis.details = [
    `Domain: ${domain}`,
    `Email type: ${analysis.emailType}`,
    `Username length: ${username.length}`,
    `Domain reputation: ${isLegitimate ? "Good" : "Unknown"}`
  ];

  return analysis;
};

/**
 * Validate email format
 */
export const validateEmailFormat = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = regex.test(email);

  return {
    isValid,
    format: isValid ? "valid" : "invalid",
    hasAtSymbol: email.includes("@"),
    hasDotInDomain: email.split("@")[1]?.includes(".") || false,
    fakeScore: isValid ? 0 : 20
  };
};

/**
 * Helper: Convert name to initials
 */
const nameToInitials = (name) => {
  return name
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .toLowerCase();
};

/**
 * Helper: Calculate similarity between two strings (0-1)
 */
const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Helper: Levenshtein distance for string similarity
 */
const getEditDistance = (s1, s2) => {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Helper: Get max repeated consecutive characters
 */
const getMaxRepeatedCharacters = (str) => {
  if (!str) return 0;
  let max = 1;
  let current = 1;
  
  for (let i = 1; i < str.length; i++) {
    if (str[i].toLowerCase() === str[i - 1].toLowerCase()) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
};

/**
 * Helper: Check if name is common/legitimate
 */
const isCommonName = (firstName) => {
  const commonNames = [
    "john", "jane", "james", "mary", "robert", "patricia", "michael", "jennifer",
    "william", "linda", "david", "barbara", "richard", "susan", "joseph", "jessica",
    "charles", "sarah", "thomas", "karen", "christopher", "nancy", "daniel", "betty",
    "matthew", "margaret", "anthony", "sandra", "donald", "ashley", "mark", "kimberly",
    "priya", "amit", "rajesh", "neha", "arjun", "pooja", "rohan", "anjali",
    "mohammed", "fatima", "ali", "ayesha", "hassan", "zainab", "ahmed", "hana"
  ];

  return commonNames.includes(firstName.toLowerCase());
};

export default {
  analyzeNamePatterns,
  analyzeEmailPatterns,
  validateEmailFormat
};
