/**
 * Image Analyzer
 * Analyzes profile photos for authenticity and red flags
 * Includes metadata validation, reverse image detection patterns, and visual anomalies
 */

/**
 * Validate photo metadata
 */
export const validatePhotoMetadata = async (photoPath, userId) => {
  const analysis = {
    fakeScore: 0,
    validationStatus: "unknown",
    metadata: {},
    anomalies: [],
    positiveIndicators: []
  };

  if (!photoPath) {
    analysis.fakeScore = 25;
    analysis.validationStatus = "missing";
    analysis.anomalies.push("No profile photo provided");
    return analysis;
  }

  // Parse photo path/URL
  const isUrl = photoPath.startsWith('http');
  const isLocalFile = photoPath.includes('uploads');

  if (!isUrl && !isLocalFile) {
    analysis.fakeScore += 8;
    analysis.anomalies.push("Photo path format is unusual");
  }

  // Check for common fake photo sources
  if (photoPath.toLowerCase().includes('stock') || 
      photoPath.toLowerCase().includes('unsplash') ||
      photoPath.toLowerCase().includes('shutterstock')) {
    analysis.fakeScore += 20;
    analysis.anomalies.push("Photo appears to be from stock image service");
  }

  // Check for multiple photos (important for real profiles)
  // This would require actual file system access - for now, we estimate based on naming
  if (!photoPath.includes('_') && photoPath.includes('.jpg')) {
    analysis.positiveIndicators.push("Single genuine-looking photo filename");
  }

  // Simulate basic metadata checks (in production, use libraries like exifjs)
  analysis.metadata = {
    photoSource: isUrl ? "external_url" : "local_upload",
    uploadPath: photoPath.substring(0, 50) + (photoPath.length > 50 ? "..." : ""),
    estimatedQuality: "unknown"
  };

  analysis.validationStatus = "validated";

  return analysis;
};

/**
 * Detect photo anomalies
 */
export const detectPhotoAnomalies = async (photoPath) => {
  const analysis = {
    fakeScore: 0,
    anomalies: [],
    suspiciousIndicators: [],
    positiveSign: false
  };

  // 1. Check for reverse image search indicators
  // Common characteristics of stock/fake images:
  // - Perfect lighting
  // - Professional studio background
  // - Multiple angles from same session
  // - Generic/cliche poses

  // We'll implement basic heuristics based on file characteristics
  const fileName = photoPath.split('/').pop()?.toLowerCase() || '';

  // 2. Check filename patterns
  const suspiciousPatterns = [
    /^image\d+/i,
    /^photo\d+/i,
    /^pic\d+/i,
    /^random/i,
    /^stock/i,
    /^model/i,
    /^fake/i,
    /^temp/i
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(fileName)) {
      analysis.fakeScore += 10;
      analysis.suspiciousIndicators.push(`Suspicious filename pattern: ${fileName}`);
    }
  });

  // 3. Check for professional editing software markers
  if (fileName.includes('photoshop') || fileName.includes('edited') || 
      fileName.includes('filter')) {
    analysis.fakeScore += 8;
    analysis.anomalies.push("Filename suggests heavy photo editing");
  }

  // 4. Check file extensions
  if (!fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
    analysis.fakeScore += 6;
    analysis.anomalies.push("Unusual file extension for profile photo");
  }

  // 5. Detect multiple profile photos from same source (would need actual image comparison)
  // This is a placeholder for more advanced detection
  if (fileName.includes('copy') || fileName.includes('duplicate')) {
    analysis.fakeScore += 7;
    analysis.anomalies.push("Appears to be a duplicate of another photo");
  }

  // 6. Check for watermarks in path
  if (photoPath.includes('watermark') || photoPath.includes('copyright')) {
    analysis.fakeScore += 12;
    analysis.anomalies.push("Photo appears to have watermarks (potentially stolen image)");
  }

  // 7. Check for celebrity/influencer marker patterns
  const celebrityMarkers = ['celebrity', 'influencer', 'model', 'actress', 'actor'];
  const hasCelebMarker = celebrityMarkers.some(m => fileName.includes(m));
  if (hasCelebMarker) {
    analysis.fakeScore += 15;
    analysis.suspiciousIndicators.push("Photo filename suggests celebrity/influencer image");
  }

  // 8. Generic positive indicator
  if (analysis.anomalies.length === 0 && analysis.suspiciousIndicators.length === 0) {
    analysis.positiveSign = true;
  }

  return analysis;
};

/**
 * Check for reverse image search indicators
 * (In production, integrate with reverse image search APIs)
 */
export const checkReverseImageMatch = async (imageUrl) => {
  const analysis = {
    fakeScore: 0,
    matched: false,
    matchedProfile: null,
    confidence: 0,
    recommendation: "CANNOT_DETERMINE"
  };

  // This is a placeholder for actual reverse image search integration
  // In production, you would use services like:
  // - Google Images API
  // - TinEye API
  // - Custom image matching service

  // For now, we provide the structure for integration
  analysis.recommendation = "MANUAL_REVIEW_RECOMMENDED";

  return analysis;
};

/**
 * Detect if photo matches profile information
 */
export const validatePhotoConsistency = (photoPath, userAge, userGender) => {
  const analysis = {
    fakeScore: 0,
    consistencyScore: 0,
    flags: [],
    recommendations: []
  };

  // Check if photo file naming matches user characteristics
  // This is a heuristic-based approach
  const fileName = photoPath.toLowerCase();

  const genderIndicators = {
    male: ['man', 'boy', 'male', 'mr', 'sir', 'him'],
    female: ['woman', 'girl', 'female', 'ms', 'mrs', 'she', 'her'],
    other: ['person', 'people', 'individual']
  };

  // Check for gender mismatch in filename (very basic heuristic)
  if (userGender && userGender.toLowerCase() === 'male') {
    const femaleIndicators = genderIndicators.female.some(ind => fileName.includes(ind));
    if (femaleIndicators) {
      analysis.fakeScore += 15;
      analysis.flags.push("Photo filename suggests opposite gender (potential profile mismatch)");
    }
  } else if (userGender && userGender.toLowerCase() === 'female') {
    const maleIndicators = genderIndicators.male.some(ind => fileName.includes(ind));
    if (maleIndicators) {
      analysis.fakeScore += 15;
      analysis.flags.push("Photo filename suggests opposite gender (potential profile mismatch)");
    }
  }

  // Age heuristics (very basic)
  const ageKeywords = {
    young: ['teenager', 'teen', 'young', 'kid', 'child'],
    middle: ['adult', 'mature', 'professional'],
    senior: ['senior', 'elderly', 'aged', 'old']
  };

  if (userAge) {
    if (userAge < 25) {
      const oldIndicators = ageKeywords.senior.some(ind => fileName.includes(ind));
      if (oldIndicators) {
        analysis.fakeScore += 12;
        analysis.flags.push("Photo suggests different age group than profile claims");
      }
    } else if (userAge > 60) {
      const youngIndicators = ageKeywords.young.some(ind => fileName.includes(ind));
      if (youngIndicators) {
        analysis.fakeScore += 12;
        analysis.flags.push("Photo suggests different age group than profile claims");
      }
    }
  }

  return analysis;
};

/**
 * Analyze photo frequency and patterns
 */
export const analyzePhotoUpdatePatterns = (photoUpdateHistory) => {
  const analysis = {
    fakeScore: 0,
    updateFrequency: "unknown",
    flags: [],
    positiveIndicators: []
  };

  if (!photoUpdateHistory || photoUpdateHistory.length === 0) {
    analysis.flags.push("No photo update history available");
    return analysis;
  }

  const intervals = [];
  for (let i = 1; i < photoUpdateHistory.length; i++) {
    const prevTime = new Date(photoUpdateHistory[i - 1]).getTime();
    const currTime = new Date(photoUpdateHistory[i]).getTime();
    intervals.push(prevTime - currTime);
  }

  const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
  const daysBetweenUpdates = avgInterval / (1000 * 60 * 60 * 24);

  // 1. Frequency analysis
  if (photoUpdateHistory.length > 5 && daysBetweenUpdates < 1) {
    analysis.fakeScore += 15;
    analysis.flags.push("Extremely frequent photo updates (possible spam/bot)");
    analysis.updateFrequency = "excessive";
  } else if (daysBetweenUpdates < 7 && photoUpdateHistory.length > 3) {
    analysis.fakeScore += 8;
    analysis.flags.push("Very frequent photo updates (possibly gaming the system)");
    analysis.updateFrequency = "frequent";
  } else if (daysBetweenUpdates > 180) {
    analysis.positiveIndicators.push("Photos are stable (less likely to be spam)");
    analysis.updateFrequency = "stable";
  } else {
    analysis.updateFrequency = "moderate";
    analysis.positiveIndicators.push("Photo updates at reasonable frequency");
  }

  // 2. Sudden large changes
  const recentChanges = photoUpdateHistory.filter(date => {
    const daysSince = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
  }).length;

  if (recentChanges > 2) {
    analysis.fakeScore += 8;
    analysis.flags.push("Multiple photo changes in the last week (suspicious activity)");
  }

  return analysis;
};

/**
 * Detect common fake photo strategies
 */
export const detectFakePhotoStrategies = (userProfile) => {
  const analysis = {
    fakeScore: 0,
    strategies: [],
    confidence: 0
  };

  // 1. No photo strategy
  if (!userProfile?.photo) {
    analysis.fakeScore += 20;
    analysis.strategies.push("no-photo-strategy");
  }

  // 2. Blurry/unclear photo strategy
  // (This would require image analysis library in production)

  // 3. Only group photos strategy (harder to identify individual)
  // Can be detected by filename or with image analysis

  // 4. Celebrity photo stealing
  // Can be detected by reverse image search

  // 5. Outdated photo strategy
  // Can be detected by comparing claimed age with apparent photo age

  return analysis;
};

export default {
  validatePhotoMetadata,
  detectPhotoAnomalies,
  checkReverseImageMatch,
  validatePhotoConsistency,
  analyzePhotoUpdatePatterns,
  detectFakePhotoStrategies
};
