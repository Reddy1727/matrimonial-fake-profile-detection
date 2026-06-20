// Bad words/profanity filter
const badWords = [
  // Curse words
  "fuck", "shit", "ass", "bitch", "bastard", "crap", "damn", "hell",
  "piss", "dick", "cock", "pussy", "dildo", "douche", "tit", "asshole",
  "motherfucker", "goddamn", "sonofabitch", "whore", "slut", "cunt",
  
  // Abuse/Hate related
  "gay", "homo", "faggot", "nigger", "nigga", "racist", "sexist",
  "retard", "stupid", "idiot", "moron", "dumbass", "loser", "worthless",
  
  // Sexual
  "porn", "xxx", "sex", "porn", "orgy", "prostitute", "pimp",
  
  // Drugs/Illegal
  "cocaine", "heroin", "meth", "weed", "marijuana", "cannabis", "drug dealer",
  
  // Violence
  "kill", "murder", "rape", "assault", "violence", "gun", "bomb",
  
  // Spam/Scam related
  "money laundering", "fraud", "scam", "ponzi", "pyramid scheme"
];

// Censor a word by replacing with asterisks
const censorWord = (word) => {
  return "*".repeat(word.length);
};

// Check and filter profanity in text
export const filterProfanity = (text) => {
  if (!text) return { text, hasViolation: false, violations: [] };

  let filteredText = text;
  const violations = [];
  const regex = new RegExp(`\\b(${badWords.join("|")})\\b`, "gi");

  const matches = text.match(regex);
  if (matches) {
    matches.forEach(match => {
      violations.push(match.toLowerCase());
      const regex = new RegExp(`\\b${match}\\b`, "gi");
      filteredText = filteredText.replace(regex, censorWord(match));
    });
  }

  return {
    text: filteredText,
    hasViolation: violations.length > 0,
    violations: [...new Set(violations.map(v => v.toLowerCase()))], // unique violations
    violationCount: violations.length
  };
};

// Check if content is too offensive (multiple violations)
export const isTooOffensive = (text) => {
  const { violations } = filterProfanity(text);
  // Block message if more than 3 profanities found
  return violations.length > 3;
};

// Get warning message
export const getWarningMessage = (violationCount) => {
  if (violationCount === 0) return null;
  if (violationCount === 1) return "⚠️ Your message contains inappropriate language and has been censored.";
  if (violationCount <= 3) return "⚠️ Your message contains multiple inappropriate words and has been censored.";
  return "❌ Your message contains too much inappropriate language and cannot be sent.";
};

export default { filterProfanity, isTooOffensive, getWarningMessage };
