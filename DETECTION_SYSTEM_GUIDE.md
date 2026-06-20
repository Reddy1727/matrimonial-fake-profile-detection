# Matrimonial Fake Profile Detection System - Comprehensive Enhancement Documentation

## Overview

This project has been significantly enhanced with comprehensive advanced analysis capabilities for detecting fake profiles. The system now analyzes profiles across multiple dimensions using machine learning and behavioral analysis.

## New Analysis Dimensions

### 1. **Name & Email Pattern Analysis** (`dataPatternAnalyzer.js`)

#### Name Analysis Features:
- **Length validation**: Checks for suspiciously short or long names
- **Character patterns**: Detects unusual consonant sequences, number-heavy patterns
- **Consistency checks**: Compares name with email username for coherence
- **Fake pattern detection**: Identifies common placeholder names (admin, test, user, bot, dummy, etc.)
- **Character diversity**: Analyzes the variety of characters used in name

#### Email Analysis Features:
- **Format validation**: RFC-compliant email verification
- **Domain reputation**: Distinguishes between legitimate (gmail, yahoo, outlook) and disposable (tempmail, guerrillamail) domains
- **Username patterns**: Detects suspicious patterns in email local part
- **Special character analysis**: Identifies excessive or suspicious special characters

### 2. **Text & Behavioral Analysis** (`textAnalyzer.js`)

#### Bio Analysis:
- **Length metrics**: Character count, word count, sentence analysis
- **Generic content detection**: Identifies copy-paste phrases and clichés
- **Suspicious keywords**: Detects financial, spam, and seduction-related terms
- **Language quality**: Checks for grammar/spelling errors
- **Emoji analysis**: Detects bot-like emoji usage patterns
- **Writing style**: Analyzes capitalization, punctuation, word diversity

#### Message Behavior Analysis:
- **Copy-paste detection**: Identifies duplicated messages suggesting automation
- **Message timing**: Detects robotic message patterns and rapid-fire behavior
- **Generic responses**: Identifies one-word or generic answers
- **Messaging patterns**: Analyzes response rates and engagement quality
- **Writing consistency**: Tracks vocabulary variance across messages

#### Mindset Indicators:
- **Financial focus**: Detects money-oriented language
- **Desperation markers**: Identifies lonely/vulnerable language
- **Trust issues**: Detects wariness from past scam experiences
- **Aggressive tone**: Identifies demanding or controlling language
- **Health/Fitness obsession**: Detects excessive gym/fitness focus
- **Travel/Adventure focus**: Identifies adventure-seeking patterns
- **Family orientation**: Recognizes family-focused values
- **Career/Professional focus**: Detects ambition and career focus

### 3. **Photo & Image Analysis** (`imageAnalyzer.js`)

#### Photo Validation:
- **Source detection**: Identifies stock image service markers
- **Metadata validation**: Checks photo upload metadata
- **Filename pattern analysis**: Detects suspicious naming patterns
- **Reverse image markers**: Identifies likely stolen/celebrity photos
- **Photo consistency**: Validates photo matches claimed gender/age
- **Edit detection**: Identifies signs of heavy edited content

#### Photo Anomaly Detection:
- **Watermark detection**: Identifies potentially stolen images
- **Generic quality markers**: Detects professional studio photos
- **Frequency analysis**: Monitors unusual photo update patterns
- **Celebrity indicators**: Flags potentially famous people photos

### 4. **Behavior Pattern Analysis** (`behaviorAnalyzer.js`)

#### User Interaction Patterns:
- **Message engagement**: Response rates, conversation quality
- **Friend request patterns**: Ratio of requests to actual messaging
- **Network diversity**: Interaction with unique users
- **Activity timing**: Natural vs robotic activity patterns
- **Message length**: Quality and substance of communications

#### Spammer Detection:
- **Mass messaging**: Detects bulk message sending
- **Spam keywords**: Identifies financial scams, MLM, crypto scams
- **Copy-paste spam**: Detects repeated identical messages
- **Repeated targeting**: Identifies focus on specific users
- **Request flooding**: Detects excessive friend requests

#### Natural Pattern Analysis:
- **Time distribution**: Activity spread across different hours
- **Interaction diversity**: Variety in conversation partners
- **Temporal consistency**: Regular vs burst activity
- **Response patterns**: Natural conversation flow

### 5. **Advanced ML Model** (`train.py`, `predict.py`)

The new ML model uses **20+ enhanced features** instead of just 3:

**Feature Categories:**
1. **Profile Completeness** (1 feature)
2. **Name & Email** (2 features)
3. **Photo Analysis** (2 features)
4. **Bio Features** (4 features)
5. **Account Age** (2 features)
6. **Messaging Behavior** (5 features)
7. **Friend Requests** (3 features)
8. **Behavior Patterns** (3 features)
9. **Spammer Indicators** (1 feature)
10. **Mindset Analysis** (1 feature)
11. **Photo Consistency** (1 feature)

**ML Algorithms:**
- Random Forest Classifier (200 estimators)
- Gradient Boosting Classifier (150 estimators)
- Automatic model selection based on accuracy
- Feature scaling for better predictions

### 6. **Integration Layer** (`mlService.js`)

The ML service orchestrates all analysis:
- **Advanced analysis execution**: Runs all 11 analysis modules
- **Feature extraction**: Converts detailed analysis into ML features
- **Python model integration**: Seamless Python/Node.js communication
- **Score combination**: Weights analysis (60%) and ML prediction (40%)
- **Recommendation generation**: Provides actionable next steps

## API Endpoints

### 1. Analyze Single Profile
```
POST /api/detection/analyze/:profileId
Response:
{
  success: true,
  profileId: "...",
  analysis: { ...comprehensive analysis... },
  prediction: {
    score: 0-100,
    riskLevel: "CRITICAL|HIGH|MEDIUM|LOW|MINIMAL",
    mlPrediction: "Real|Fake",
    confidence: 0-100
  },
  recommendation: {
    action: "BLOCK|FLAG_FOR_REVIEW|VERIFY_IDENTITY|MONITOR|APPROVE",
    reason: "...",
    redFlags: [...],
    requiredActions: [...]
  },
  status: "Real|Fake|Suspicious"
}
```

### 2. Bulk Analyze Profiles
```
POST /api/detection/bulk-analyze
Body: { profileIds: ["id1", "id2", ...] }
Response: { success: true, analyzed: 50, failed: 2, results: [...], errors: [...] }
```

### 3. Get Detailed Analysis
```
GET /api/detection/detailed/:profileId
Response: {
  success: true,
  detailedAnalysis: {
    name, email, profile, photo, bio, account, messaging, 
    mindset, spammer, interactions
  },
  summary: { overallScore, riskLevel, keyRedFlags, warnings, positiveFactors }
}
```

### 4. Get Profiles for Review
```
GET /api/detection/profiles-for-review?riskLevel=HIGH&limit=50&offset=0
Response: { success: true, riskLevel, total, count, profiles: [...] }
```

### 5. Get Statistics
```
GET /api/detection/stats
Response: {
  success: true,
  statistics: {
    total, byStatus: {real, fake, suspicious},
    averageFakeScore, scoreDistribution
  }
}
```

### 6. Flag/Unflag Profile
```
POST /api/detection/flag/:profileId
Body: { action: "flag|unflag", reason: "..." }
Response: { success: true, profileId, action, newStatus, reason }
```

## Risk Level Classification

| Score | Risk Level | Status | Action |
|-------|-----------|--------|--------|
| 80+ | CRITICAL | Fake | Block immediately |
| 60-79 | HIGH | Suspicious | Flag for review |
| 40-59 | MEDIUM | Suspicious | Verify identity |
| 20-39 | LOW | Real | Monitor |
| 0-19 | MINIMAL | Real | Approve |

## Key Detection Patterns

### Critical Red Flags (High Confidence):
1. ✗ Placeholder/test names (admin, user, test, fake, etc.)
2. ✗ Generic email patterns (test@, admin@, demo@, etc.)
3. ✗ Disposable email services (tempmail, guerrillamail, etc.)
4. ✗ No profile photo
5. ✗ Empty or placeholder bio
6. ✗ Account created within last hour
7. ✗ 50+ requests with 0 messages (spam pattern)
8. ✗ Duplicate identical messages to multiple users
9. ✗ Celebrity/influencer photo markers
10. ✗ Multiple spam keywords (crypto, money transfer, etc.)

### Warning Signs:
- Very short bio (< 50 characters)
- Account < 7 days old
- High request-to-message ratio (> 3:1)
- Very long response time (> 24 hours)
- Only generic responses
- Unrealistic profile claims
- No message activity despite accepted friends

### Positive Indicators:
- Complete profile (80%+)
- Established account (30+ days)
- Good response rate (> 50%)
- Long, personalized bio (> 200 chars)
- Natural message timing
- Diverse conversation partners
- Quality over quantity in messages

## Setup Instructions

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install ML Dependencies
```bash
cd ml-model
pip install -r requirements.txt
```

### 3. Update Environment Variables
```bash
# backend/.env
ML_MODEL_PATH=../ml-model/predict.py
PYTHON_PATH=python  # or python3 depending on system
```

### 4. Train ML Model (First Time)
```bash
cd ml-model
python train.py
```

The model will:
- Load profile dataset from `dataset/profiles.csv`
- Extract 20+ features
- Train Random Forest and Gradient Boosting models
- Save best model to `model/model.pkl`
- Save scaler to `model/scaler.pkl`
- Save feature columns to `model/feature_columns.pkl`

### 5. Start Backend Server
```bash
cd backend
npm start
```

## Data Requirements for ML Model

The training dataset (`ml-model/dataset/profiles.csv`) should include:

**Required columns:**
- `fake` or `is_fake` or `label`: Target variable (0=Real, 1=Fake)

**Feature columns (optional - auto-fills if missing):**
- Profile completeness score (0-100)
- Name suspicion score (0-25)
- Email suspicion score (0-25)
- Has photo (0/1)
- Photo anomaly score (0-25)
- Bio length (characters)
- Generic phrases count
- Red flags count
- Bio suspicion score (0-25)
- Days since account creation
- Account age suspicion score (0-25)
- Total messages
- Sent messages
- Response rate (0-1)
- Message to request ratio
- Message content suspicion score
- Total friend requests
- Accepted friends
- Request acceptance rate
- Activity consistency score (0-100)
- Interaction diversity (0-100)
- Messaging behavior suspicion score
- Spammer indicators score
- Mindset suspicion score
- Photo consistency score

## Example Usage

### Analyze a Single Profile
```javascript
import { analyzeProfile } from './controllers/detectionController.js';

// Called via API endpoint
const result = await analyzeProfile(req, res);
// Result includes comprehensive analysis and recommendation
```

### Bulk Analyze Profiles
```javascript
const profiles = [
  "profile_id_1",
  "profile_id_2",
  "profile_id_3"
];

// Analyzes all profiles and returns results with any errors
const results = await bulkAnalyzeProfiles(profiles);
```

### Get Statistical Overview
```javascript
// Get organization-wide fake profile statistics
const stats = await getDetectionStats();
// Returns total profiles, breakdown by status, avg score, distribution
```

## Performance Considerations

- **Single profile analysis**: ~2-3 seconds
- **Batch processing**: 50-100 profiles in ~60-120 seconds
- **Database optimization**: Index on `fakeScore` and `status` for faster queries
- **Caching**: Consider caching analysis results for unchanged profiles

## Future Enhancements

1. **Computer Vision Integration**
   - Real image analysis with OpenCV/TensorFlow
   - Face recognition for duplicate detection
   - Reverse image search API integration

2. **Advanced NLP**
   - Sentiment analysis for bio/messages
   - Language detection for authenticity
   - Named entity recognition

3. **Network Analysis**
   - Social graph anomaly detection
   - Cluster analysis for organized spam rings
   - Temporal network analysis

4. **Real-time Monitoring**
   - Streaming analysis of new registrations
   - Alert system for suspicious activities
   - Automated blocking workflows

5. **Explainability**
   - SHAP values for feature importance
   - Decision tree visualization
   - Per-feature contribution explanations

## Troubleshooting

### Python Model Not Found
- Check ML_MODEL_PATH environment variable
- Verify model files exist in `ml-model/model/`
- Ensure Python executable is in PATH

### Feature Mismatch
- Delete existing model files in `ml-model/model/`
- Re-run training: `python train.py`
- Verify dataset has required columns

### Low Accuracy
- Collect more training data
- Balance fake/real samples in dataset
- Adjust feature engineering thresholds
- Retrain model: `python train.py`

## References

- Random Forest: https://scikit-learn.org/stable/modules/ensemble.html#random-forests
- Gradient Boosting: https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting
- Feature Scaling: https://scikit-learn.org/stable/modules/preprocessing.html
- Model Evaluation: https://scikit-learn.org/stable/modules/model_evaluation.html

## License

This comprehensive detection system enhancement is part of the Matrimonial Fake Profile Detection project.

---

**Version**: 2.0
**Last Updated**: April 2026
**Status**: Production Ready
