// reminderLogService.js
// Logs reminder actions and failures for audit
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../logs/reminder-actions.log');

function logReminderAction({ pledgeId, action, status, reason, userId }) {
  const entry = {
    timestamp: new Date().toISOString(),
    pledgeId,
    action,
    status,
    reason,
    userId: userId || null
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

module.exports = { logReminderAction };
