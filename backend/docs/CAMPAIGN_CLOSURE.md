Campaign Closure Automation

Overview

When a campaign's `end_date` is reached (<= today) the system can:
- Send a closing message (SMS + email) to all donors associated with that campaign
- Mark the campaign status as `completed`
- Stop future reminders for pledges in the campaign by setting `pledges.last_reminder_sent = NOW()`

Configuration

- To disable external sends globally set in your `.env`:

  SEND_CLOSURE_MESSAGES=false

  This will prevent SMS/email sends but will still update campaign `status` and pledge `last_reminder_sent`.

Dry-run

- You can test without sending messages by running the CLI with `--dry-run` (or `-d`).

  ```powershell
  node backend\scripts\run-campaign-closures.js --dry-run
  ```

- Dry-run logs intended recipients and does not call external SMS/email providers.

Cron

- The scheduler runs the closure job daily at 06:30 Africa/Kampala.
- File: `backend/services/advancedCronScheduler.js` registers the job.

Manual Run

- To run immediately (production sends):

  ```powershell
  node backend\scripts\run-campaign-closures.js
  ```

- To run in dry-run mode:

  ```powershell
  node backend\scripts\run-campaign-closures.js --dry-run
  ```

Troubleshooting

- If external sends fail, check SMS/SMTP credentials in `.env` (e.g., AFRICASTALKING_KEY, SMTP_USER/SMTP_PASS).
- The job will still mark campaigns `completed` and set `last_reminder_sent` for pledges even when sending fails.
