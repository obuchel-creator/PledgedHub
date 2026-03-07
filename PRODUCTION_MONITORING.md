# Production Monitoring Setup Guide

1. **UptimeRobot (Free):**
   - Go to https://uptimerobot.com/
   - Add monitors for:
     - `https://your-production-domain/api/health`
     - `https://your-production-domain/api/ai/status`
     - `https://your-production-domain/` (frontend)
   - Set alert contacts for downtime notifications.

2. **Azure Monitor (if using Azure):**
   - Use Application Insights for API and frontend.
   - Set up availability tests for the above endpoints.

3. **Slack/Email Alerts:**
   - Integrate UptimeRobot or Azure Monitor with Slack/email for instant alerts.

4. **Optional: Custom Monitoring**
   - Use a cron job or GitHub Actions scheduled workflow to ping health endpoints and notify on failure.

# This ensures you are alerted to any production downtime or critical API/AI failures.

