// Simple feedback service for storing feedback
const { createFeedback } = require('../models/Feedback');
const { sendEmail } = require('./emailService');

async function saveFeedback({ message, userAgent, date }) {
  // Store in MySQL
  await createFeedback({ message, userAgent, date });
  // Send email notification
  await sendEmail({
    to: process.env.FEEDBACK_EMAIL || process.env.SMTP_USER,
    subject: 'New Feedback Received',
    html: `<h2>New Feedback</h2><p>${message}</p><p><b>User Agent:</b> ${userAgent}</p><p><b>Date:</b> ${date}</p>`
  });
  return { success: true };
}

module.exports = { saveFeedback };
