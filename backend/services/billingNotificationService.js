const { pool } = require('../config/db');
const emailService = require('./emailService');
const { getMonetizationStartDate, PRICING_TIERS } = require('../config/monetization');

const MS_IN_DAY = 1000 * 60 * 60 * 24;

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function determineChangeEvent(fromTier, toTier) {
  if (!fromTier || !toTier || fromTier === toTier) {
    return null;
  }

  const from = PRICING_TIERS[fromTier] || { price: 0 };
  const to = PRICING_TIERS[toTier] || { price: 0 };
  return to.price > from.price ? 'upgrade' : 'downgrade';
}

async function logEvent({ userId, email, eventType, fromTier, toTier, note }) {
  const normalizedEmail = normalizeEmail(email);
  await pool.execute(
    `INSERT INTO billing_notification_events (user_id, email, event_type, from_tier, to_tier, note) VALUES (?, ?, ?, ?, ?, ?)`
  , [userId || null, normalizedEmail, eventType, fromTier || null, toTier || null, note || null]);
}

async function recordSubscriptionChange({ userId, email, fromTier, toTier }) {
  const eventType = determineChangeEvent(fromTier, toTier);
  if (!eventType) return;

  const normalizedEmail = normalizeEmail(email);

  await logEvent({
    userId,
    email: normalizedEmail,
    eventType,
    fromTier,
    toTier,
    note: 'Subscription change before billing start'
  });

  await pool.execute(
    `UPDATE billing_notifications 
     SET last_status_change_at = NOW(), 
         last_status_change_type = ?,
         user_id = COALESCE(user_id, ?)
     WHERE email = ? OR user_id = ?`,
    [eventType, userId || null, normalizedEmail, userId || null]
  );
}

async function hasRecentTierChange(email, userId) {
  const normalizedEmail = normalizeEmail(email);
  const [rows] = await pool.execute(
    `SELECT 1 FROM billing_notification_events 
     WHERE (email = ? OR user_id = ?) 
       AND event_type IN ('upgrade','downgrade')
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, userId || null]
  );
  return rows && rows.length > 0;
}

async function sendPreBillingNotifications() {
  const now = new Date();
  const globalStart = getMonetizationStartDate();

  const [records] = await pool.execute(
    `SELECT bn.*, u.id AS matched_user_id, u.subscription_tier, u.subscription_status, u.subscription_ends_at
     FROM billing_notifications bn
     LEFT JOIN users u ON u.email = bn.email
     WHERE bn.notified = FALSE`
  );

  let sent = 0;
  let skipped = 0;

  for (const record of records) {
    const targetDate = record.activation_date || globalStart;
    const daysUntil = Math.ceil((targetDate - now) / MS_IN_DAY);

    // Only send inside the 30-day window before billing starts
    if (daysUntil > 30 || daysUntil < 0) {
      skipped += 1;
      continue;
    }

    // Skip if they already changed tier (upgrade/downgrade) to avoid re-notifying
    const changed = await hasRecentTierChange(record.email, record.user_id || record.matched_user_id);
    if (changed) {
      skipped += 1;
      continue;
    }

    // Skip if user already on paid tier
    if (record.subscription_tier && record.subscription_tier !== 'FREE') {
      skipped += 1;
      continue;
    }

    const recipientEmail = normalizeEmail(record.email);

    const subject = 'Billing starts in 30 days';
    const html = `
      <p>Hello,</p>
      <p>PledgeHub billing will start on <strong>${new Date(targetDate).toLocaleDateString()}</strong>.</p>
      <p>You are currently on the free plan. If you want to keep automation and reminders active, please pick a plan before billing begins.</p>
      <ul>
        <li>Keep your campaigns running without interruption</li>
        <li>Access analytics, reminders, and AI messaging</li>
        <li>Switch plans anytime; you will not be charged until billing starts</li>
      </ul>
      <p>If you have already chosen a plan, you can ignore this message.</p>
      <p>Thank you for using PledgeHub.</p>
    `;

    try {
      await emailService.sendEmail({
        to: recipientEmail,
        subject,
        html,
        text: `PledgeHub billing starts on ${new Date(targetDate).toLocaleDateString()}. Choose a plan now to keep reminders and analytics active. If you already upgraded, no action is needed.`
      });

      await pool.execute(
        `UPDATE billing_notifications 
         SET notified = TRUE, notified_at = NOW(), user_id = COALESCE(user_id, ?), last_notification_reason = 'pre_billing_30_day'
         WHERE id = ?`,
        [record.matched_user_id || null, record.id]
      );

      await logEvent({
        userId: record.matched_user_id || null,
        email: recipientEmail,
        eventType: 'notification_sent',
        note: 'Pre-billing 30-day notification'
      });

      sent += 1;
    } catch (error) {
      console.error('Billing notification send failed:', error.message);
      skipped += 1;
    }
  }

  return { sent, skipped, total: records.length };
}

module.exports = {
  sendPreBillingNotifications,
  recordSubscriptionChange
};
