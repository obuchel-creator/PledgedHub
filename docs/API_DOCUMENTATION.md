# PledgeHub - API Documentation

Complete API reference for all AI and automation features.

**Base URL**: `http://localhost:5001`  
**Authentication**: Simple token-based (temporary) - See [Authentication](#authentication)

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI Integration API](#ai-integration-api)
3. [Message Generation API](#message-generation-api)
4. [Analytics Dashboard API](#analytics-dashboard-api)
5. [Automated Reminders API](#automated-reminders-api)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)

---

## Authentication

Currently using `simpleAuth` middleware (temporary, open access for development).

**Headers Required**:
```http
Authorization: Bearer <token>
```

For production, replace with proper JWT validation.

---

## AI Integration API

### GET /api/ai/status
Check if AI service is available.

**Response**:
```json
{
  "available": true,
  "provider": "gemini",
  "model": "gemini-pro",
  "tier": "FREE",
  "dailyLimit": 1500,
  "features": [
    "Enhanced message generation",
    "Pledge data analysis",
    "Smart suggestions",
    "Thank you messages"
  ]
}
```

---

### POST /api/ai/enhance-message
Generate an AI-enhanced message.

**Request Body**:
```json
{
  "pledgeData": {
    "donorName": "John Doe",
    "amount": 500000,
    "purpose": "School fees support",
    "collectionDate": "2025-11-15"
  },
  "messageType": "reminder",
  "tone": "friendly"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Hi John! 😊 Hope you're doing well...",
  "source": "ai",
  "enhanced": true
}
```

---

### POST /api/ai/thank-you
Generate personalized thank you message.

**Request Body**:
```json
{
  "donorName": "Grace Namukasa",
  "amount": 1500000,
  "purpose": "Community center construction",
  "tone": "warm"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dear Grace, we are deeply grateful for your generous contribution...",
  "source": "ai"
}
```

---

### GET /api/ai/insights
Analyze pledge data and generate insights.

**Response**:
```json
{
  "success": true,
  "insights": {
    "summary": "13 total pledges with 23% collection rate",
    "patterns": [
      "Most pledges are for community development projects",
      "Higher completion rate for pledges under UGX 1M"
    ],
    "recommendations": [
      "Send reminders 3-5 days before due date",
      "Focus on pledges over UGX 500K"
    ]
  }
}
```

---

### GET /api/ai/suggestions
Get actionable improvement suggestions.

**Response**:
```json
{
  "success": true,
  "suggestions": [
    {
      "category": "collection_timing",
      "suggestion": "Send reminders during business hours",
      "priority": "high"
    },
    {
      "category": "donor_engagement",
      "suggestion": "Thank donors within 24 hours of payment",
      "priority": "medium"
    }
  ]
}
```

---

### POST /api/ai/test
Test AI functionality with sample data.

**Request Body**:
```json
{
  "testType": "full"
}
```

**Response**:
```json
{
  "success": true,
  "aiAvailable": true,
  "testMessage": "AI test successful",
  "sampleOutput": "Hi Test User, this is a sample AI-generated message..."
}
```

---

## Message Generation API

### GET /api/messages/templates
View all available message templates.

**Response**:
```json
{
  "success": true,
  "templates": {
    "reminder": {
      "types": ["7_days", "3_days", "due_today", "overdue"],
      "tones": ["friendly", "professional", "urgent"]
    },
    "thankYou": {
      "tones": ["warm", "formal", "enthusiastic"]
    },
    "followUp": {
      "approaches": ["gentle", "firm"]
    },
    "confirmation": {
      "styles": ["brief", "detailed"]
    }
  },
  "totalTemplates": 12
}
```

---

### POST /api/messages/reminder
Generate a reminder message.

**Request Body**:
```json
{
  "pledgeId": 1,
  "tone": "friendly",
  "reminderType": "3_days"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "subject": "Friendly Reminder: Your Pledge",
    "text": "Hi John! Just a gentle reminder...",
    "html": "<html><body style='font-family: Arial'>...</body></html>",
    "source": "template"
  },
  "pledge": {
    "id": 1,
    "donorName": "John Doe",
    "amount": 500000
  }
}
```

---

### POST /api/messages/thank-you
Generate thank you message.

**Request Body**:
```json
{
  "pledgeId": 5,
  "tone": "warm"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "subject": "Thank You for Your Generous Support",
    "text": "Dear Grace, your contribution makes a real difference...",
    "html": "<html>...</html>",
    "source": "template"
  }
}
```

---

### POST /api/messages/follow-up
Generate follow-up message.

**Request Body**:
```json
{
  "pledgeId": 3,
  "approach": "gentle"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "subject": "Following Up on Your Pledge",
    "text": "Hi Robert, we wanted to check in...",
    "html": "<html>...</html>",
    "source": "template"
  }
}
```

---

### POST /api/messages/confirmation
Generate confirmation message.

**Request Body**:
```json
{
  "pledgeId": 2,
  "style": "detailed"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "subject": "Pledge Confirmation",
    "text": "Dear Tom, this confirms your pledge of UGX 600,000...",
    "html": "<html>...</html>",
    "source": "template"
  }
}
```

---

### POST /api/messages/bulk
Generate messages for multiple pledges.

**Request Body**:
```json
{
  "pledgeIds": [1, 2, 3, 4],
  "messageType": "reminder",
  "options": {
    "tone": "professional",
    "reminderType": "due_today"
  }
}
```

**Response**:
```json
{
  "success": true,
  "generated": 4,
  "failed": 0,
  "messages": [
    {
      "pledgeId": 1,
      "donorName": "John Doe",
      "message": {
        "subject": "Pledge Reminder",
        "text": "...",
        "html": "..."
      }
    }
  ]
}
```

---

## Analytics Dashboard API

### GET /api/analytics/overview
Get overall statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPledges": 13,
    "uniqueDonors": 11,
    "totalAmount": 18600300,
    "paidAmount": 2900000,
    "pendingAmount": 15700300,
    "collectionRate": 23,
    "averagePledge": 1430792,
    "statusCounts": {
      "active": 7,
      "completed": 3,
      "pending": 3
    }
  }
}
```

---

### GET /api/analytics/trends
Get time-based trends.

**Query Parameters**:
- `period`: `week`, `month`, or `year` (default: `month`)

**Example**: `GET /api/analytics/trends?period=month`

**Response**:
```json
{
  "success": true,
  "period": "month",
  "data": [
    {
      "period": "2025-10",
      "pledgeCount": 13,
      "totalAmount": 18600300,
      "paidAmount": 2900000,
      "collectionRate": 23,
      "label": "Oct 2025"
    }
  ]
}
```

---

### GET /api/analytics/top-donors
Get top donors leaderboard.

**Query Parameters**:
- `limit`: Number of donors to return (default: `10`)

**Example**: `GET /api/analytics/top-donors?limit=5`

**Response**:
```json
{
  "success": true,
  "limit": 5,
  "data": [
    {
      "name": "Grace Namukasa",
      "email": "grace@example.com",
      "phone": "+256700000001",
      "pledgeCount": 1,
      "totalPledged": 1500000,
      "totalPaid": 1500000,
      "paidCount": 1,
      "fulfillmentRate": 100
    },
    {
      "name": "Robert Lubega",
      "email": "robert@example.com",
      "phone": "+256700000002",
      "pledgeCount": 1,
      "totalPledged": 800000,
      "totalPaid": 800000,
      "paidCount": 1,
      "fulfillmentRate": 100
    }
  ]
}
```

---

### GET /api/analytics/by-status
Get pledge distribution by status.

**Response**:
```json
{
  "success": true,
  "data": {
    "active": {
      "count": 7,
      "amount": 15700000
    },
    "completed": {
      "count": 3,
      "amount": 2900000
    },
    "pending": {
      "count": 3,
      "amount": 300
    }
  }
}
```

---

### GET /api/analytics/by-purpose
Get pledges grouped by purpose.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "purpose": "School fees support",
      "count": 2,
      "totalAmount": 3000000,
      "paidAmount": 1500000,
      "collectionRate": 50
    },
    {
      "purpose": "Community center construction",
      "count": 1,
      "totalAmount": 1500000,
      "paidAmount": 1500000,
      "collectionRate": 100
    }
  ]
}
```

---

### GET /api/analytics/upcoming
Get upcoming collections (next 30 days).

**Response**:
```json
{
  "success": true,
  "daysAhead": 30,
  "data": {
    "count": 7,
    "totalExpected": 15700000,
    "collections": [
      {
        "id": 4,
        "donorName": "Sarah Nakato",
        "amount": 2500000,
        "purpose": "Medical equipment",
        "collectionDate": "2025-11-10",
        "daysUntilDue": 5,
        "status": "active"
      }
    ]
  }
}
```

---

### GET /api/analytics/at-risk
Get pledges at risk (overdue or approaching with no contact).

**Response**:
```json
{
  "success": true,
  "data": {
    "count": 0,
    "riskLevels": {
      "high": 0,
      "medium": 0,
      "low": 0
    },
    "pledges": []
  }
}
```

**Risk Levels**:
- **High**: Overdue by 7+ days
- **Medium**: Overdue by 1-6 days
- **Low**: Due within 7 days, no recent contact

---

### GET /api/analytics/insights
Get AI-powered insights (if AI available).

**Response**:
```json
{
  "success": true,
  "insights": {
    "available": true,
    "analysis": "Based on 13 pledges with 23% collection rate...",
    "patterns": [...],
    "recommendations": [...]
  }
}
```

---

### GET /api/analytics/dashboard
Get complete dashboard data (all-in-one).

**Response**:
```json
{
  "success": true,
  "generatedAt": "2025-11-05T08:09:35.417Z",
  "dashboard": {
    "overview": { ... },
    "trends": [ ... ],
    "topDonors": [ ... ],
    "statusBreakdown": { ... },
    "purposeAnalysis": [ ... ],
    "upcomingCollections": { ... },
    "atRiskPledges": { ... },
    "insights": { ... }
  }
}
```

---

## Automated Reminders API

### GET /api/reminders/status
Check reminder job status.

**Response**:
```json
{
  "success": true,
  "cronJobs": {
    "dailyReminders": {
      "schedule": "0 9 * * *",
      "timezone": "Africa/Kampala",
      "running": true,
      "nextRun": "2025-11-06T09:00:00Z"
    },
    "eveningReminders": {
      "schedule": "0 17 * * *",
      "timezone": "Africa/Kampala",
      "running": true,
      "nextRun": "2025-11-05T17:00:00Z"
    }
  }
}
```

---

### GET /api/reminders/upcoming
Get pledges needing reminders.

**Response**:
```json
{
  "success": true,
  "reminders": {
    "7_days": 2,
    "3_days": 1,
    "due_today": 1,
    "overdue": 0,
    "total": 4
  },
  "pledges": [
    {
      "id": 4,
      "donorName": "Sarah Nakato",
      "amount": 2500000,
      "collectionDate": "2025-11-12",
      "reminderType": "7_days",
      "lastReminderSent": null
    }
  ]
}
```

---

### POST /api/reminders/send
Manually trigger reminder for a pledge.

**Request Body**:
```json
{
  "pledgeId": 4,
  "reminderType": "3_days"
}
```

**Response**:
```json
{
  "success": true,
  "sent": true,
  "pledge": {
    "id": 4,
    "donorName": "Sarah Nakato",
    "email": "sarah@example.com"
  },
  "message": "Reminder sent successfully"
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common HTTP Status Codes**:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Example Error**:
```json
{
  "success": false,
  "error": "Pledge not found",
  "details": "No pledge with ID 999"
}
```

---

## Rate Limits

**AI API (Google Gemini)**:
- **Daily Limit**: 1,500 requests
- **Tier**: FREE
- **Recommended**: Cache AI responses, use templates as fallback

**General API**:
- No rate limits currently (development)
- Production: Implement rate limiting (e.g., 100 requests/minute per IP)

---

## Testing

### Using cURL

**Test AI Status**:
```bash
curl -X GET http://localhost:5001/api/ai/status
```

**Generate Reminder**:
```bash
curl -X POST http://localhost:5001/api/messages/reminder \
  -H "Content-Type: application/json" \
  -d '{
    "pledgeId": 1,
    "tone": "friendly",
    "reminderType": "3_days"
  }'
```

**Get Analytics Overview**:
```bash
curl -X GET http://localhost:5001/api/analytics/overview
```

### Using Test Scripts

```bash
# Test all features
node backend/scripts/test-all-features.js

# Test analytics specifically
node backend/scripts/test-analytics.js

# Quick AI test
node backend/scripts/quick-ai-test.js
```

---

## Postman Collection

Import the following endpoints into Postman:

1. **AI Integration**
   - GET {{baseUrl}}/api/ai/status
   - POST {{baseUrl}}/api/ai/enhance-message
   - POST {{baseUrl}}/api/ai/thank-you
   - GET {{baseUrl}}/api/ai/insights
   - GET {{baseUrl}}/api/ai/suggestions
   - POST {{baseUrl}}/api/ai/test

2. **Message Generation**
   - GET {{baseUrl}}/api/messages/templates
   - POST {{baseUrl}}/api/messages/reminder
   - POST {{baseUrl}}/api/messages/thank-you
   - POST {{baseUrl}}/api/messages/follow-up
   - POST {{baseUrl}}/api/messages/confirmation
   - POST {{baseUrl}}/api/messages/bulk

3. **Analytics**
   - GET {{baseUrl}}/api/analytics/overview
   - GET {{baseUrl}}/api/analytics/trends?period=month
   - GET {{baseUrl}}/api/analytics/top-donors?limit=10
   - GET {{baseUrl}}/api/analytics/by-status
   - GET {{baseUrl}}/api/analytics/by-purpose
   - GET {{baseUrl}}/api/analytics/upcoming
   - GET {{baseUrl}}/api/analytics/at-risk
   - GET {{baseUrl}}/api/analytics/insights
   - GET {{baseUrl}}/api/analytics/dashboard

4. **Reminders**
   - GET {{baseUrl}}/api/reminders/status
   - GET {{baseUrl}}/api/reminders/upcoming
   - POST {{baseUrl}}/api/reminders/send

**Environment Variable**:
```
baseUrl = http://localhost:5001
```

---

## Best Practices

1. **AI Usage**:
   - Check AI availability before generating AI messages
   - Always have template fallback
   - Monitor daily request quota

2. **Message Generation**:
   - Validate pledgeId before generating messages
   - Use appropriate tone for context
   - Test HTML rendering before sending

3. **Analytics**:
   - Cache dashboard data (refresh every 5-10 minutes)
   - Use specific endpoints instead of `/dashboard` when possible
   - Monitor at-risk pledges daily

4. **Reminders**:
   - Let cron jobs handle scheduled reminders
   - Use manual send only for urgent cases
   - Track reminder counts to avoid spam

---

**Last Updated**: November 5, 2025  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready

