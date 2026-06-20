# Quick Reference - Fake Profile Detection API

## Available Endpoints

### 1. **Analyze Single Profile** (Most Important)
```
POST /api/detection/analyze/:profileId
Authorization: Bearer TOKEN

Response (200):
{
  "success": true,
  "profileId": "507f1f77bcf86cd799439011",
  "analysis": {
    "timestamp": "2026-04-08T...",
    "overallFakeScore": 45.5,
    "riskLevel": "MEDIUM - POSSIBLY FAKE",
    "indicators": {
      "suspicious": ["Account only 2 days old", "Short bio"],
      "warnings": ["Low response rate to messages"],
      "positive": ["Profile well-completed"]
    },
    "detailedAnalysis": {
      "name": { "fakeScore": 5, "suspiciousPatterns": [], "positiveIndicators": [] },
      "email": { "fakeScore": 8, "emailType": "legitimate", "suspicions": [] },
      "profileCompleteness": { "score": 70, "missingFields": [] },
      "photo": { "fakeScore": 0 },
      "bio": { "fakeScore": 15, "length": 80, "redFlags": [] },
      "accountAge": { "fakeScore": 15, "daysSinceCreation": 2 },
      "messagingBehavior": { "patterns": { ... } },
      "messageContent": { "fakeScore": 5 },
      "mindset": { "category": "unknown" },
      "spammer": { "detected": false },
      "interactions": { "naturalPattern": true }
    }
  },
  "prediction": {
    "score": 45.5,
    "riskLevel": "MEDIUM",
    "mlPrediction": "Real",
    "confidence": { "ml": 72, "analysis": 68 }
  },
  "recommendation": {
    "action": "VERIFY_IDENTITY",
    "reason": "Profile shows some suspicious indicators",
    "redFlags": ["Account only 2 days old"],
    "requiredActions": [
      "Request additional verification",
      "Ask for phone verification",
      "Request photo with ID"
    ]
  },
  "status": "Suspicious"
}
```

### 2. **Bulk Analyze Multiple Profiles**
```
POST /api/detection/bulk-analyze
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  "profileIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}

Response:
{
  "success": true,
  "analyzed": 3,
  "failed": 0,
  "results": [
    {
      "profileId": "507f1f77bcf86cd799439011",
      "status": "analyzed",
      "fakeScore": 45.5,
      "riskLevel": "MEDIUM",
      "recommendation": "VERIFY_IDENTITY"
    },
    ...
  ],
  "errors": []
}
```

### 3. **Get Detailed Analysis Breakdown**
```
GET /api/detection/detailed/:profileId
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "profileId": "...",
  "detailedAnalysis": {
    "name": {
      "score": 5,
      "suspicions": ["Name pattern unusual"],
      "positives": ["Name is legitimate"]
    },
    "email": {
      "score": 8,
      "type": "legitimate",
      "format": "valid",
      "suspicions": []
    },
    "profile": {
      "completeness": 78,
      "missingFields": ["birth_date"]
    },
    "photo": {
      "score": 0,
      "anomalies": [],
      "suspicions": []
    },
    "bio": {
      "score": 15,
      "length": 120,
      "redFlags": ["Generic phrases detected"],
      "positives": ["Well-written bio"]
    },
    "account": {
      "ageScore": 15,
      "daysSinceCreation": 2,
      "riskIndicator": "MEDIUM"
    },
    "messaging": {
      "suspicions": ["Low engagement"],
      "patterns": {
        "totalMessages": 5,
        "sentMessages": 2,
        "responseRate": 0.4
      },
      "engagementScore": 40
    },
    "mindset": {
      "category": "unknown",
      "concerns": [],
      "indicators": {}
    },
    "spammer": {
      "detected": false,
      "level": "LOW",
      "indicators": []
    },
    "interactions": {
      "pattern": true,
      "anomalies": []
    }
  },
  "summary": {
    "overallScore": 45.5,
    "riskLevel": "MEDIUM",
    "keyRedFlags": ["Account only 2 days old"],
    "warnings": ["Low response rate"],
    "positiveFactors": ["Profile well-completed"]
  }
}
```

### 4. **Get Profiles Requiring Review**
```
GET /api/detection/profiles-for-review?riskLevel=HIGH&limit=50&offset=0
Authorization: Bearer TOKEN

Supported Risk Levels: CRITICAL, HIGH, MEDIUM

Response:
{
  "success": true,
  "riskLevel": "HIGH",
  "total": 247,
  "count": 50,
  "profiles": [
    {
      "profileId": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439010",
      "name": "John Doe",
      "email": "john@example.com",
      "fakeScore": 75.8,
      "status": "Suspicious",
      "createdAt": "2026-04-06T..."
    },
    ...
  ]
}
```

### 5. **Get Detection Statistics**
```
GET /api/detection/stats
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "statistics": {
    "total": 1024,
    "byStatus": {
      "real": 850,
      "fake": 125,
      "suspicious": 49
    },
    "averageFakeScore": 28.5,
    "scoreDistribution": [
      {
        "_id": "0-20",
        "count": 450
      },
      {
        "_id": "20-40",
        "count": 280
      },
      {
        "_id": "40-60",
        "count": 185
      },
      {
        "_id": "60-80",
        "count": 95
      },
      {
        "_id": "80-100",
        "count": 14
      }
    ]
  }
}
```

### 6. **Flag/Unflag Profile**
```
POST /api/detection/flag/:profileId
Authorization: Bearer TOKEN
Content-Type: application/json

Body:
{
  "action": "flag",  // or "unflag"
  "reason": "Confirmed fake through external source"
}

Response:
{
  "success": true,
  "profileId": "507f1f77bcf86cd799439011",
  "action": "flag",
  "newStatus": "Fake",
  "reason": "Confirmed fake through external source"
}
```

## Fake Score Interpretation

| Score Range | Risk Level | Status | Interpretation |
|------------|-----------|--------|-----------------|
| **80-100** | **CRITICAL** | **Fake** | Profile is very likely fake; immediate action needed |
| **60-79** | **HIGH** | **Suspicious** | Profile has high probability of being fake |
| **40-59** | **MEDIUM** | **Suspicious** | Profile shows suspicious indicators; verify |
| **20-39** | **LOW** | **Real** | Minor red flags but likely genuine |
| **0-19** | **MINIMAL** | **Real** | Profile appears authentic |

## Red Flag Categories

### Critical Red Flags (Each worth 15-25 points)
- ✗ Placeholder names (admin, test, user, bot, temp, demo, fake)
- ✗ Disposable emails (tempmail, guerrillamail, 10minutemail)
- ✗ Generic email patterns (test@, admin@, demo@)
- ✗ No profile photo
- ✗ Account created < 1 hour ago
- ✗ 50+ requests with 0 messages
- ✗ Identical messages to multiple users
- ✗ Celebrity/influencer photos

### Warning Flags (Each worth 5-12 points)
- ⚠ Placeholder bio (empty or generic)
- ⚠ Account < 7 days old
- ⚠ Request-to-message ratio > 3:1
- ⚠ Very slow response time (> 24 hours)
- ⚠ Only generic responses
- ⚠ Unrealistic profile claims
- ⚠ No messages despite accepted friends

### Positive Indicators (Reduce score)
- ✓ Complete profile (80%+)
- ✓ Established account (30+ days)
- ✓ Good response rate (> 50%)
- ✓ Long, personalized bio (> 200 chars)
- ✓ Natural message timing
- ✓ Diverse conversation partners
- ✓ Quality messages over quantity

## Error Responses

### 400 Bad Request
```json
{
  "message": "No profiles provided",
  "error": "profileIds array is required"
}
```

### 404 Not Found
```json
{
  "message": "Profile not found",
  "error": "Profile with given ID doesn't exist"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error analyzing profile",
  "error": "ML model execution failed"
}
```

## Implementation Examples

### JavaScript/Node.js
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/detection';
const token = 'your-auth-token';

async function analyzeProfile(profileId) {
  try {
    const response = await axios.post(
      `${API_BASE}/analyze/${profileId}`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('Analysis:', response.data);
    return response.data;
  } catch (error) {
    console.error('Analysis failed:', error.response.data);
  }
}

async function getStats() {
  const response = await axios.get(
    `${API_BASE}/stats`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
}

// Usage
const result = await analyzeProfile('507f1f77bcf86cd799439011');
if (result.prediction.score > 60) {
  console.log('⚠️ Profile is suspicious');
  console.log(result.recommendation.requiredActions);
}
```

### Python
```python
import requests
import json

API_BASE = 'http://localhost:5000/api/detection'
TOKEN = 'your-auth-token'
HEADERS = {'Authorization': f'Bearer {TOKEN}'}

def analyze_profile(profile_id):
    response = requests.post(
        f'{API_BASE}/analyze/{profile_id}',
        headers=HEADERS
    )
    return response.json()

def get_profiles_for_review(risk_level='HIGH', limit=50):
    response = requests.get(
        f'{API_BASE}/profiles-for-review',
        params={'riskLevel': risk_level, 'limit': limit},
        headers=HEADERS
    )
    return response.json()

# Usage
result = analyze_profile('507f1f77bcf86cd799439011')
print(f"Fake Score: {result['prediction']['score']}")
print(f"Risk Level: {result['prediction']['riskLevel']}")
```

### cURL
```bash
# Analyze profile
curl -X POST https://api.example.com/api/detection/analyze/PROFILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get stats
curl https://api.example.com/api/detection/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get high-risk profiles
curl "https://api.example.com/api/detection/profiles-for-review?riskLevel=HIGH&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Rate Limiting & Performance

- Single profile analysis: ~2-3 seconds
- Recommended batch size: 10-20 profiles
- Maximum request body: 10MB
- Response timeout: 60 seconds

## Webhook Events (Optional Future Enhancement)

```
POST /webhooks/profile-analysis
{
  "event": "profile.analyzed",
  "timestamp": "2026-04-08T...",
  "profileId": "...",
  "fakeScore": 75.8,
  "riskLevel": "HIGH",
  "recommendation": "FLAG_FOR_REVIEW"
}
```

---

For more details, see [DETECTION_SYSTEM_GUIDE.md](./DETECTION_SYSTEM_GUIDE.md)
