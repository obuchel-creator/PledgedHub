# Campaign Closure Testing Guide

## Overview

Campaign closures are automated checks that trigger when a campaign's `end_date` is reached.

## Test Harness

I've provided a test harness that previews intended closures and writes them to a file for admin review.

```bash
node backend/scripts/campaign-closures-harness.js
```

Output file: `backend/scripts/campaign-closures-preview.json`

This contains the closure dry-run result showing which campaigns would be affected, donors to contact, etc.

## Admin API Endpoints

### Preview Closures (Dry-Run)

```
GET /api/reminders/closures/preview
Authorization: Bearer {admin-token}
```

Response: JSON with dry-run preview (no messages sent).

### Run Closures

```
POST /api/reminders/closures/run
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "dryRun": false
}
```

- `dryRun: true` — preview without sending
- `dryRun: false` — send messages (respects `SEND_CLOSURE_MESSAGES` env var)

## Manual CLI

```bash
# Dry-run (preview only)
node backend/scripts/run-campaign-closures.js --dry-run

# Production (sends if configured)
node backend/scripts/run-campaign-closures.js
```

## Scheduled Run

- **When**: Daily at 06:30 Africa/Kampala
- **Location**: `backend/services/advancedCronScheduler.js`
- **Job**: Calls `advancedReminderService.processCampaignClosures()`

## Test Data

To test, create a campaign with an `end_date` in the past:

```sql
INSERT INTO campaigns (title, description, goal_amount, end_date, status)
VALUES ('Test Drive', 'Testing closures', 1000000, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'active');
```

Then run the harness or API to preview. Database updates (status, last_reminder_sent) are applied regardless of send success/failure.

## Result JSON

```json
{
  "processed": 1,
  "messagesSent": 5,
  "errors": 0
}
```

- `processed`: Campaigns closed
- `messagesSent`: Total SMS + emails attempted
- `errors`: Send failures (logged separately)
