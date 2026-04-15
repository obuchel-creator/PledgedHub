# PledgeHub - API Documentation

Complete API reference for all AI and automation features.

**Base URL**: `http://localhost:5001`  
**Authentication**: JWT Bearer token - See [Authentication](#authentication)

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

Most endpoints require a valid JWT access token.

**How to get a token**:
- Register/login via `POST /api/auth/register` and `POST /api/auth/login`.
- Use the returned `token` as a Bearer token.

**RBAC note**: Many routes are role-protected (e.g. staff/admin). Common roles include: `donor`, `creator`, `support_staff`, `finance_admin`, `super_admin`.

**Public endpoints** (no auth):
- Auth bootstrap routes under `/api/auth/*`
- Guest fundraising routes under `/api/public/*`
- `GET /api/analytics/platform-stats`

**Headers Required**:
```http
Authorization: Bearer <token>
```

Unless an endpoint is explicitly documented as public, assume authentication is required.

---

## AI Integration API

All `/api/ai/*` endpoints require authentication + staff access.

### GET /api/ai/status
Check if AI service is available.

**Response**:
```json
{
  "success": true,
  "available": true,
  "provider": "Google Gemini",
  "model": "gemini-pro",
  "tier": "FREE",
  "message": "AI features are active and ready"
}
```

---

### POST /api/ai/enhance-message
Generate an AI-enhanced message.

**Request Body**:
```json
{
  "pledgeId": 1,
  "type": "3_days",
  "tone": "friendly",
  "language": "English",
  "maxLength": 160
}
```

**Response**:
```json
{
  "success": true,
  "message": "Hi John! 🙏 Your pledge of UGX 500,000 for School fees support is due in 3 days (15/11/2025). We really appreciate your support!",
  "aiGenerated": true,
  "pledge": {
    "id": 1,
    "donor_name": "John Doe",
    "amount": 500000,
    "purpose": "School fees support"
  }
}
```

---

### POST /api/ai/thank-you
Generate personalized thank you message.

**Request Body**:
```json
{
  "pledgeId": 5,
  "tone": "warm",
  "includeImpact": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dear Grace, thank you so much for your generous payment of UGX 1,500,000! Your support makes a real difference. 🙏💙",
  "aiGenerated": true,
  "pledge": {
    "id": 5,
    "donor_name": "Grace Namukasa",
    "amount": 1500000
  }
}
```

---

### GET /api/ai/insights
Analyze pledge data and generate insights.

**Response**:
```json
{
  "success": true,
  "available": true,
  "insights": [
    {
      "type": "info",
      "title": "Collection Rate",
      "message": "Your collection rate is 23%. Consider prioritizing overdue follow-ups."
    }
  ],
  "summary": {
    "total": 13,
    "totalAmount": 18600300,
    "paid": 3,
    "pending": 7,
    "overdue": 0,
    "collectionRate": 23
  },
  "timestamp": "2025-11-05T08:09:35.417Z"
}
```

---

### GET /api/ai/suggestions
Get actionable improvement suggestions.

**Response**:
```json
{
  "success": true,
  "stats": {
    "total": 13,
    "paid": 3,
    "pending": 7,
    "overdue": 0,
    "totalAmount": 18600300,
    "pendingAmount": 15700300,
    "collectionRate": 23
  },
  "suggestions": [
    {
      "title": "Send Timely Reminders",
      "description": "Use automated reminders 7 days and 3 days before due date",
      "priority": "high"
    },
    {
      "title": "Follow Up on Overdue",
      "description": "Contact overdue donors within 3 days",
      "priority": "medium"
    }
  ],
  "aiGenerated": true,
  "timestamp": "2025-11-05T08:09:35.417Z"
}
```

---

### POST /api/ai/chat
Ask general questions (includes a built-in fallback when AI is unavailable).

**Request Body**:
```json
{
  "message": "How do I send reminders?",
  "context": "Dashboard"
}
```

**Response**:
```json
{
  "success": true,
  "message": "You can send reminders from the dashboard by clicking on individual pledges...",
  "aiGenerated": false,
  "fallback": true
}
```

---

### POST /api/ai/finance-query
Ask finance/accounting questions.

**Request Body**:
```json
{
  "question": "What is our pending amount this month?"
}
```

**Response**:
```json
{
  "success": true,
  "response": "Here is a summary of pending amounts for the month..."
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
  "message": "AI is working! 🎉",
  "sampleMessage": "Hi John Doe, friendly reminder: your pledge of UGX 100,000 for Church Building Fund is due in 7 days...",
  "provider": "Google Gemini",
  "model": "gemini-pro",
  "tier": "FREE (1,500 requests/day)"
}
```

---

## Message Generation API

All `/api/messages/*` endpoints require authentication + staff access.

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
      "tones": ["warm", "professional", "casual"]
    },
    "followUp": {
      "approaches": ["gentle", "standard", "firm"]
    },
    "confirmation": {
      "styles": ["standard", "detailed"]
    }
  },
  "features": {
    "aiGeneration": true,
    "multiLanguage": ["English", "Luganda"],
    "customization": true,
    "bulkGeneration": true
  }
}
```

---

### POST /api/messages/reminder
Generate a reminder message.

**Request Body**:
```json
{
  "pledgeId": 1,
  "type": "3_days",
  "tone": "friendly",
  "useAI": true,
  "language": "English"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "text": "Hi John! 🙏 Your pledge of UGX 500,000 for School fees support is due in 3 days (15 November 2025). We really appreciate your support!",
    "html": "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">...",
    "source": "ai",
    "tone": "friendly",
    "type": "3_days"
  },
  "pledge": {
    "id": 1,
    "donor_name": "John Doe",
    "amount": 500000,
    "collection_date": "2025-11-15"
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
    "text": "Dear Grace, thank you so much for your generous payment of UGX 1,500,000 for Community center construction! 🙏💙",
    "html": "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">...",
    "source": "template",
    "tone": "warm"
  },
  "pledge": {
    "id": 5,
    "donor_name": "Grace Namukasa",
    "amount": 1500000
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
  "approach": "gentle",
  "useAI": false
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "text": "Hi Robert, we wanted to check in about your pledge of UGX 250,000 for your pledge. Is everything okay?",
    "html": "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">...",
    "source": "template",
    "approach": "gentle",
    "daysOverdue": 2
  },
  "pledge": {
    "id": 3,
    "donor_name": "Robert",
    "amount": 250000,
    "collection_date": "2025-11-01"
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
    "text": "Dear Tom, This confirms your pledge:\n\n💰 Amount: UGX 600,000\n📋 Purpose: School fees\n📅 Due Date: 15 November 2025\n\nThank you for your generous support!",
    "html": "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">...",
    "source": "template",
    "style": "detailed"
  },
  "pledge": {
    "id": 2,
    "donor_name": "Tom",
    "amount": 600000,
    "collection_date": "2025-11-15"
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
    "reminderType": "due_today",
    "useAI": true,
    "language": "English"
  }
}
```

**Response**:
```json
{
  "success": true,
  "total": 4,
  "successCount": 4,
  "failureCount": 0,
  "results": [
    {
      "pledgeId": 1,
      "success": true,
      "message": {
        "text": "Dear John Doe, This is to notify you that your pledge...",
        "html": "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">...",
        "source": "template",
        "tone": "professional",
        "type": "due_today"
      }
    }
  ]
}
```

---

## Analytics Dashboard API

All `/api/analytics/*` endpoints require authentication + staff access, except `GET /api/analytics/platform-stats` which is public.

### GET /api/analytics/platform-stats
Public platform-wide aggregate statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPledges": 0,
    "totalDonors": 0,
    "totalAmount": 0,
    "totalCollected": 0,
    "pendingPledges": 0,
    "totalCampaigns": 0,
    "totalOrganizations": 0,
    "collectionRate": 0
  }
}
```

---

### GET /api/analytics/overview
Get overall statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPledges": 13,
    "uniqueDonors": 11,
    "counts": {
      "paid": 3,
      "pending": 7,
      "cancelled": 0,
      "overdue": 0
    },
    "amounts": {
      "total": 18600300,
      "paid": 2900000,
      "pending": 15700300,
      "overdue": 0
    },
    "collectionRate": 23
  }
}
```

---

### GET /api/analytics/summary
Summary KPIs for a date range.

**Query Parameters**:
- `start`: `YYYY-MM-DD` (optional)
- `end`: `YYYY-MM-DD` (optional)

**Example**: `GET /api/analytics/summary?start=2025-10-01&end=2025-10-31`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPledges": 13,
    "totalAmount": 18600300,
    "paid": 3,
    "pending": 7,
    "overdue": 0,
    "collectionRate": 23
  }
}
```

---

### GET /api/analytics/trends
Get time-based trends.

**Query Parameters**:
- `start`: `YYYY-MM-DD` (optional)
- `end`: `YYYY-MM-DD` (optional)

**Example**: `GET /api/analytics/trends?start=2025-10-01&end=2025-10-31`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-10",
      "pledges": 13,
      "amount": 18600300
    }
  ]
}
```

---

### GET /api/analytics/campaigns
Campaign performance for a date range.

**Query Parameters**:
- `start`: `YYYY-MM-DD` (optional)
- `end`: `YYYY-MM-DD` (optional)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "campaign": "Back to School",
      "pledges": 10,
      "amount": 7500000,
      "paid": 6
    }
  ]
}
```

---

### GET /api/analytics/top-donors
Get top donors leaderboard.

**Query Parameters**:
- `limit`: Number of donors to return (default: `10`)
- `start`: `YYYY-MM-DD` (optional)
- `end`: `YYYY-MM-DD` (optional)

**Example**: `GET /api/analytics/top-donors?limit=5&start=2025-10-01&end=2025-10-31`

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
      "totalAmount": 15700000
    },
    "completed": {
      "count": 3,
      "totalAmount": 2900000
    },
    "pending": {
      "count": 3,
      "totalAmount": 300
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
  "count": 1,
  "data": [
    {
      "id": 4,
      "donorName": "Sarah Nakato",
      "amount": 2500000,
      "purpose": "Medical equipment",
      "collectionDate": "2025-11-10",
      "status": "active",
      "daysUntilDue": 0
    }
  ]
}
```

---

### GET /api/analytics/at-risk
Get pledges at risk (overdue or approaching with no contact).

**Response**:
```json
{
  "success": true,
  "total": 0,
  "byRiskLevel": {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 0
  },
  "data": []
}
```

---

### GET /api/analytics/insights
Get AI-powered insights (if AI available).

**Response**:
```json
{
  "success": true,
  "available": true,
  "data": {
    "stats": { "totalPledges": 13 },
    "recentTrend": [],
    "atRiskCount": 0,
    "atRiskAmount": 0
  },
  "recommendations": [
    {
      "type": "info",
      "title": "At-Risk Pledges",
      "message": "0 pledges need immediate attention"
    }
  ]
}
```

---

### GET /api/analytics/dashboard
Get complete dashboard data (all-in-one).

**Response**:
```json
{
  "success": true,
  "overview": { "totalPledges": 13 },
  "trends": [],
  "topDonors": [],
  "byStatus": {},
  "byPurpose": [],
  "upcoming": [],
  "atRisk": [],
  "generatedAt": "2025-11-05T08:09:35.417Z"
}
```

---

## Automated Reminders API

All `/api/reminders/*` endpoints require authentication + admin access.

### GET /api/reminders/status
Check reminder job status.

**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "name": "Daily Reminders",
      "schedule": "9:00 AM daily",
      "running": true
    },
    {
      "name": "Evening Reminders",
      "schedule": "5:00 PM daily",
      "running": true
    }
  ]
}
```

---

### GET /api/reminders/test
Run reminders manually.

**Response**:
```json
{
  "success": true,
  "message": "Reminders processed successfully",
  "results": {
    "timestamp": "2025-11-05T08:09:35.417Z",
    "reminders": [
      {
        "type": "7_days",
        "processed": 2,
        "successful": 2,
        "failed": 0
      }
    ]
  }
}
```

---

### GET /api/reminders/closures/preview
Preview campaign closures (dry-run).

**Response**:
```json
{
  "success": true,
  "preview": {
    "processed": 0,
    "messagesSent": 0,
    "errors": 0
  }
}
```

---

### POST /api/reminders/closures/run
Run campaign closures.

**Request Body**:
```json
{
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "processed": 1,
    "messagesSent": 10,
    "errors": 0
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
    "sevenDays": {
      "count": 2,
      "pledges": [
        {
          "id": 4,
          "donor_name": "Sarah Nakato",
          "amount": 2500000,
          "collection_date": "2025-11-12"
        }
      ]
    },
    "threeDays": {
      "count": 1,
      "pledges": []
    },
    "dueToday": {
      "count": 1,
      "pledges": []
    },
    "overdue": {
      "count": 0,
      "pledges": []
    }
  }
}
```

---

### POST /api/reminders/send/:pledgeId
Manually trigger reminder for a pledge.

**Request Body**:
```json
{
  "type": "3_days"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reminder sent",
  "result": {
    "pledgeId": 4,
    "type": "3_days",
    "sms": { "sent": true },
    "email": { "sent": false },
    "gracePeriod": false,
    "monetizationPhase": "LAUNCH"
  }
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

Many routes apply rate limiting middleware. Exact limits can vary by environment/config.

AI usage also depends on the upstream provider quota; use `GET /api/ai/status` to check availability.

---

## Testing

### Using cURL

**Test AI Status**:
```bash
curl -X GET http://localhost:5001/api/ai/status \
  -H "Authorization: Bearer <JWT>"
```

**Generate Reminder**:
```bash
curl -X POST http://localhost:5001/api/messages/reminder \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "pledgeId": 1,
    "type": "3_days",
    "tone": "friendly",
    "useAI": true,
    "language": "English"
  }'
```

**Get Analytics Overview**:
```bash
curl -X GET http://localhost:5001/api/analytics/overview \
  -H "Authorization: Bearer <JWT>"
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
  - POST {{baseUrl}}/api/ai/chat
  - POST {{baseUrl}}/api/ai/finance-query
   - POST {{baseUrl}}/api/ai/test

2. **Message Generation**
   - GET {{baseUrl}}/api/messages/templates
   - POST {{baseUrl}}/api/messages/reminder
   - POST {{baseUrl}}/api/messages/thank-you
   - POST {{baseUrl}}/api/messages/follow-up
   - POST {{baseUrl}}/api/messages/confirmation
   - POST {{baseUrl}}/api/messages/bulk

3. **Analytics**
  - GET {{baseUrl}}/api/analytics/platform-stats
   - GET {{baseUrl}}/api/analytics/overview
  - GET {{baseUrl}}/api/analytics/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
  - GET {{baseUrl}}/api/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD
  - GET {{baseUrl}}/api/analytics/campaigns?start=YYYY-MM-DD&end=YYYY-MM-DD
  - GET {{baseUrl}}/api/analytics/top-donors?limit=10&start=YYYY-MM-DD&end=YYYY-MM-DD
   - GET {{baseUrl}}/api/analytics/by-status
   - GET {{baseUrl}}/api/analytics/by-purpose
   - GET {{baseUrl}}/api/analytics/upcoming
  - GET {{baseUrl}}/api/analytics/at-risk?start=YYYY-MM-DD&end=YYYY-MM-DD
   - GET {{baseUrl}}/api/analytics/insights
   - GET {{baseUrl}}/api/analytics/dashboard

4. **Reminders**
  - GET {{baseUrl}}/api/reminders/test
   - GET {{baseUrl}}/api/reminders/status
  - GET {{baseUrl}}/api/reminders/closures/preview
  - POST {{baseUrl}}/api/reminders/closures/run
   - GET {{baseUrl}}/api/reminders/upcoming
  - POST {{baseUrl}}/api/reminders/send/:pledgeId

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

