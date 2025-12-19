/**
 * Pledge Email Verification Service
 * Handles pledge email verification and confirmation
 */

const crypto = require('crypto');
const { pool } = require('../config/db');
const emailService = require('./emailService');

/**
 * Generate verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send verification email for a pledge
 */
async function sendVerificationEmail(pledgeId, donorEmail, donorName) {
  try {
    if (!donorEmail) {
      return { success: false, error: 'Donor email is required' };
    }

    // Generate token
    const token = generateVerificationToken();

    // Update pledge with token
    await pool.execute(
      'UPDATE pledges SET verification_token = ? WHERE id = ?',
      [token, pledgeId]
    );

    // Create verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-pledge?token=${token}`;

    // Send email
    const subject = 'Verify Your Pledge - PledgeHub';
    const html = `
      <h2>Thank you for your pledge, ${donorName}!</h2>
      <p>To confirm your pledge, please click the link below:</p>
      <p>
        <a href="${verificationLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #FCD116;
          color: #000000;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        ">
          Verify My Pledge
        </a>
      </p>
      <p>Or copy and paste this link: ${verificationLink}</p>
      <p>This link expires in 24 hours.</p>
      <hr>
      <p>If you didn't make this pledge, you can safely ignore this email.</p>
    `;

    await emailService.sendEmail({
      to: donorEmail,
      subject,
      text: `Verify your pledge at: ${verificationLink}`,
      html
    });

    return { success: true, message: 'Verification email sent' };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify pledge with token
 */
async function verifyPledge(token) {
  try {
    if (!token) {
      return { success: false, error: 'Token is required' };
    }

    // Find pledge by token
    const [pledges] = await pool.execute(
      'SELECT * FROM pledges WHERE verification_token = ? AND is_verified = FALSE',
      [token]
    );

    if (!pledges || pledges.length === 0) {
      return { success: false, error: 'Invalid or already verified token' };
    }

    const pledge = pledges[0];

    // Update pledge as verified
    await pool.execute(
      'UPDATE pledges SET is_verified = TRUE, verified_at = NOW(), verification_token = NULL WHERE id = ?',
      [pledge.id]
    );

    return {
      success: true,
      pledge: {
        id: pledge.id,
        donor_name: pledge.donor_name,
        amount: pledge.amount,
        donor_email: pledge.donor_email
      },
      message: 'Pledge verified successfully'
    };
  } catch (error) {
    console.error('❌ Error verifying pledge:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if pledge is verified
 */
async function isPledgeVerified(pledgeId) {
  try {
    const [pledges] = await pool.execute(
      'SELECT is_verified FROM pledges WHERE id = ?',
      [pledgeId]
    );

    if (!pledges || pledges.length === 0) {
      return false;
    }

    return pledges[0].is_verified === 1 || pledges[0].is_verified === true;
  } catch (error) {
    console.error('❌ Error checking pledge verification:', error);
    return false;
  }
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  verifyPledge,
  isPledgeVerified
};
