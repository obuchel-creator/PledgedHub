# Advanced Reminder System - Implementation Complete ✅

## Overview

The PledgeHub reminder system has been upgraded with **intelligent frequency-based scheduling** that automatically adjusts reminder frequency based on how close a pledge is to its collection date.

## Reminder Strategy

### Long-Term Reminders (2+ months away)
- **Frequency**: Once per week
- **Schedule**: Wednesdays at 2:00 PM (EAT)
- **Purpose**: Keep pledges on donors' radar without overwhelming them
- **Message Tone**: Friendly, low-pressure

### Mid-Term Reminders (30-60 days away)
- **Frequency**: Twice per week
- **Schedule**: Tuesdays and Fridays at 10:00 AM (EAT)
- **Purpose**: Increase awareness as the date approaches
- **Message Tone**: Warm, encouraging preparation

### Final Week Reminders (1-7 days away)
- **Frequency**: Daily
- **Schedule**: Every day at 9:00 AM (EAT)
- **Purpose**: Ensure donors are fully prepared
- **Message Tone**: Important, actionable

### Due Today Reminders
- **Frequency**: Once on collection day
- **Schedule**: 8:00 AM (EAT)
- **Purpose**: Final confirmation on the day of collection
- **Message Tone**: Friendly confirmation

### Overdue Reminders
- **Frequency**: Daily until resolved
- **Schedule**: 5:00 PM (EAT)
- **Purpose**: Follow up on missed collection dates
- **Message Tone**: Professional, action-required

### Balance Reminders
- **Frequency**: Daily
- **Schedule**: 10:00 AM (EAT)
- **Purpose**: Remind about partial payments with outstanding balances
- **Message Tone**: Informative, supportive

## Why These Days & Times?

### Weekly (Wednesday 2 PM)
- **Mid-week engagement**: Catches people during the work week when they're planning
- **Afternoon timing**: After lunch, before end-of-day rush
- **Single touchpoint**: Not intrusive for distant events

### Bi-Weekly (Tuesday & Friday 10 AM)
- **Tuesday**: Start of productive work week, good for planning
- **Friday**: End of week, good for weekend preparation
- **Morning timing**: Catches people at start of day for action
- **Balanced frequency**: Enough to maintain awareness without annoyance

### Daily Final Week (9 AM)
- **Consistent morning reminder**: Part of daily routine
- **Planning time**: Early enough to make same-day arrangements
- **High urgency**: Appropriate for imminent deadlines

### Due Today (8 AM)
- **Early morning**: First thing, maximum preparation time
- **Single touchpoint**: One reminder on the day

### Overdue (5 PM)
- **End of day**: Gives all day for action before evening reminder
- **Business hours**: Appropriate for financial follow-up
- **Daily persistence**: Necessary for overdue items

## Technical Implementation

### New Services

#### `backend/services/advancedReminderService.js`
Complete rewrite of reminder logic with:
- **Query Functions**: Get pledges by time-to-collection intervals
- **Message Generation**: Contextual messages for each category
- **Send Functions**: Process and send reminders with result tracking
- **Smart Filtering**: Prevents duplicate sends using `last_reminder_sent`

Key Functions:
```javascript
getPledgesNeedingWeeklyReminder()     // 60+ days away
getPledgesNeedingBiWeeklyReminder()   // 30-60 days away
getPledgesInFinalWeek()               // 1-7 days away
getPledgesDueToday()                  // Collection date = today
getOverduePledges()                   // Collection date < today

processWeeklyReminders()              // Send weekly reminders
processBiWeeklyReminders()            // Send bi-weekly reminders
processFinalWeekReminders()           // Send daily final week
processDueTodayReminders()            // Send due today
processOverdueReminders()             // Send overdue
```

#### `backend/services/advancedCronScheduler.js`
New cron job manager with 7 scheduled tasks:
- **Weekly**: Wednesdays 2 PM - Long-term pledges
- **Tuesday**: 10 AM - Bi-weekly for mid-term pledges
- **Friday**: 10 AM - Bi-weekly for mid-term pledges
- **Daily 9 AM**: Final week reminders
- **Daily 8 AM**: Due today reminders
- **Daily 5 PM**: Overdue reminders
- **Daily 10 AM**: Balance reminders

Functions:
```javascript
initializeJobs()          // Set up all cron jobs
startJobs()              // Start all jobs
stopJobs()               // Stop all jobs
getJobStatus()           // Get status of all jobs
runManually(jobType)     // Trigger specific job manually
testAllJobs()            // Test all reminder functions
displayScheduleSummary() // Show schedule overview
```

### Modified Files

#### `backend/server.js`
Updated to use advanced scheduler:
```javascript
const cronScheduler = require('./services/advancedCronScheduler');

// On server start:
cronScheduler.initializeJobs();
cronScheduler.startJobs();
```

### Test Script

#### `backend/scripts/test-advanced-reminders.js`
Comprehensive test suite that:
1. Creates 7 test pledges at different time intervals
2. Tests all query functions
3. Tests reminder sending
4. Displays comprehensive summary
5. Includes cleanup function

Run tests:
```powershell
node backend\scripts\test-advanced-reminders.js

# Cleanup test data:
node backend\scripts\test-advanced-reminders.js --cleanup
```

## Message Templates

### Long-Term (2+ months)
**SMS**: "Hi [Name], friendly reminder about your pledge of UGX [Amount] for [Purpose], due [Date]. Thank you for your commitment!"

**Email**: Professional template with pledge details, emphasizing future commitment

### Mid-Term (30-60 days)
**SMS**: "Hi [Name], your pledge of UGX [Amount] for [Purpose] is due in [X] days ([Date]). Please start preparing. Thank you!"

**Email**: Warm template encouraging preparation, with full pledge details

### Final Week (1-7 days)
**SMS**: "Hi [Name], IMPORTANT: Your pledge of UGX [Amount] for [Purpose] is due in [X] days ([Date]). Please be ready!"

**Email**: Urgent template highlighting imminent date, clear call to action

### Due Today
**SMS**: "Hi [Name], REMINDER: Your pledge of UGX [Amount] for [Purpose] is due TODAY ([Date]). Thank you!"

**Email**: Confirmation template for same-day collection

### Overdue
**SMS**: "Hi [Name], your pledge of UGX [Amount] for [Purpose] was due [Date] and is now [X] days overdue. Please contact us to arrange collection."

**Email**: Professional follow-up template with emphasis on action needed

## Database Schema

The system uses existing `pledges` table columns:
- `collection_date`: Used to calculate days until/overdue
- `last_reminder_sent`: Prevents duplicate sends (updated after each reminder)
- `status`: Filters out 'paid' and 'cancelled' pledges
- `deleted`: Excludes soft-deleted records

## Monitoring & Testing

### Check Reminder Schedule
Start the backend server and look for:
```
========================================
ADVANCED REMINDER SCHEDULE SUMMARY
========================================
Timezone: Africa/Kampala (EAT)

LONG-TERM REMINDERS (2+ months away):
  - Wednesdays at 2:00 PM

MONTHLY REMINDERS (30-60 days away):
  - Tuesdays at 10:00 AM
  - Fridays at 10:00 AM

FINAL WEEK REMINDERS (1-7 days away):
  - Daily at 9:00 AM

URGENT REMINDERS:
  - Due Today: Daily at 8:00 AM
  - Overdue: Daily at 5:00 PM

OTHER:
  - Balance Reminders: Daily at 10:00 AM
========================================
```

### Manual Trigger (for testing)
```javascript
const cronScheduler = require('./services/advancedCronScheduler');

// Trigger specific job type
await cronScheduler.runManually('weekly');
await cronScheduler.runManually('bi-weekly');
await cronScheduler.runManually('final-week');
await cronScheduler.runManually('due-today');
await cronScheduler.runManually('overdue');

// Test all jobs at once
await cronScheduler.testAllJobs();
```

### View Job Status
```javascript
const status = cronScheduler.getJobStatus();
console.log(status);
// Returns array with: name, schedule, description, running status
```

## Notification Channels

Each reminder attempts to send via:
1. **SMS**: Using Twilio or AfricasTalking (if configured)
2. **Email**: Using SMTP/Gmail (if configured)

Result tracking includes:
```javascript
{
  pledgeId: 123,
  category: 'weekly',
  sms: { sent: true },
  email: { sent: true, error: null }
}
```

## Configuration

### Environment Variables
```bash
# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# SMS (AfricasTalking)
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_key
AFRICASTALKING_SENDER_ID=PLEDGEHUB

# Email (Gmail SMTP)
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

### Timezone
All cron jobs use **Africa/Kampala (EAT)** timezone. This is hardcoded and should not be changed without updating all job definitions.

## Migration from Old System

The old `reminderService.js` used date-based triggers (7 days, 3 days, day of, overdue). The new system:

**Backward Compatible**: Old reminder routes still work
**Enhanced Logic**: Adds frequency-based scheduling
**Same Database**: Uses existing `pledges` table
**No Data Migration**: Works with current data immediately

To switch back (if needed):
```javascript
// In backend/server.js, change:
const cronScheduler = require('./services/cronScheduler'); // Old system
```

## Benefits of New System

✅ **Intelligent Frequency**: Adjusts reminders based on urgency
✅ **Optimal Engagement**: Best days/times for donor attention
✅ **Prevents Over-messaging**: Weekly for distant, daily for urgent
✅ **Better UX**: Contextual messages match urgency
✅ **Maintains Awareness**: Long-term pledges aren't forgotten
✅ **Actionable Urgency**: Final week gets daily attention
✅ **Professional Follow-up**: Consistent overdue handling

## Troubleshooting

### Reminders Not Sending

1. **Check Cron Jobs Running**:
   ```javascript
   const status = cronScheduler.getJobStatus();
   console.log(status); // All should show running: true
   ```

2. **Check SMS/Email Config**:
   - Verify environment variables are set
   - Test services independently

3. **Check Pledge Data**:
   ```sql
   SELECT id, donor_name, collection_date, status, last_reminder_sent
   FROM pledges
   WHERE status = 'pending' AND deleted = 0;
   ```

4. **Manual Test**:
   ```bash
   node backend\scripts\test-advanced-reminders.js
   ```

### Wrong Frequency

Check `last_reminder_sent` column:
- Weekly: Must be 7+ days since last reminder
- Bi-weekly: Must be 3+ days since last reminder
- Daily: Must be different date than last reminder

### Timezone Issues

All jobs use Africa/Kampala (EAT). If reminders fire at wrong times:
1. Verify server system time: `Get-Date`
2. Check Node.js timezone: `console.log(new Date().toString())`
3. Verify cron timezone setting in `advancedCronScheduler.js`

## Next Steps

After 2-day absence, verify:
1. ✅ Cron jobs are running: Check logs for job execution
2. ✅ Reminders sent successfully: Check `last_reminder_sent` updates
3. ✅ No errors in logs: Monitor console output
4. ✅ Donors receiving messages: Confirm delivery

## Support

For questions or issues:
- Review logs: `backend/logs/`
- Test manually: `node backend/scripts/test-advanced-reminders.js`
- Check job status: `cronScheduler.getJobStatus()`
- View schedule: `cronScheduler.displayScheduleSummary()`

---

**Implementation Date**: January 2025
**Status**: ✅ Complete and Active
**Next Review**: After 2-week operational period

