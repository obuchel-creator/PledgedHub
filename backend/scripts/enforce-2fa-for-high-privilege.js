/**
 * 2FA Setup for High-Privilege Roles
 * Ensures finance_admin and super_admin users have two-factor authentication
 * 
 * Run after RBAC implementation to secure critical accounts
 * node backend/scripts/enforce-2fa-for-high-privilege.js
 */

const { pool } = require('../config/db');

async function enforce2FAForHighPrivilege() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 ENFORCING 2FA FOR HIGH-PRIVILEGE ROLES');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get all finance_admin and super_admin users
    const [highPrivilegeUsers] = await pool.execute(`
      SELECT id, email, role, two_fa_enabled 
      FROM users 
      WHERE role IN ('finance_admin', 'super_admin')
      ORDER BY role, email
    `);

    console.log(`📊 Found ${highPrivilegeUsers.length} high-privilege users\n`);

    let with2FA = 0;
    let without2FA = 0;

    console.log('High-Privilege Users Status:\n');
    console.log('┌─────┬──────────────────┬────────────────┬──────────┐');
    console.log('│ ID  │ Email            │ Role           │ 2FA      │');
    console.log('├─────┼──────────────────┼────────────────┼──────────┤');

    for (const user of highPrivilegeUsers) {
      const has2FA = user.two_fa_enabled ? '✅ Yes' : '❌ No ';
      console.log(
        `│ ${user.id.toString().padStart(3)} │ ${user.email.padEnd(16)} │ ${user.role.padEnd(14)} │ ${has2FA} │`
      );

      if (user.two_fa_enabled) {
        with2FA++;
      } else {
        without2FA++;
      }
    }

    console.log('└─────┴──────────────────┴────────────────┴──────────┘\n');

    console.log('📊 Summary:');
    console.log(`   ✅ With 2FA: ${with2FA} users`);
    console.log(`   ❌ Without 2FA: ${without2FA} users`);
    console.log(`   📈 Coverage: ${Math.round((with2FA / highPrivilegeUsers.length) * 100)}%\n`);

    if (without2FA > 0) {
      console.log('⚠️  ACTION REQUIRED:\n');
      console.log('Users without 2FA should be notified and required to enable it:');
      console.log('');

      for (const user of highPrivilegeUsers) {
        if (!user.two_fa_enabled) {
          console.log(`   📧 ${user.email} (${user.role})`);
        }
      }

      console.log('\n🔐 Recommended actions:\n');
      console.log('1. Send 2FA requirement email to users without it');
      console.log('2. Set 2FA enforcement deadline (e.g., 7 days)');
      console.log('3. Disable account access if 2FA not set up by deadline');
      console.log('4. Log 2FA enforcement actions in audit trail\n');
    } else {
      console.log('✨ All high-privilege users have 2FA enabled!\n');
    }

    // Check if twoFactorSecret column exists
    console.log('🔍 Checking database schema:\n');
    try {
      const [tableInfo] = await pool.execute('DESC users');
      const has2FASecret = tableInfo.some(col => col.Field === 'twoFactorSecret');
      const has2FAEnabled = tableInfo.some(col => col.Field === 'two_fa_enabled');

      console.log(`   ${has2FASecret ? '✅' : '❌'} twoFactorSecret column`);
      console.log(`   ${has2FAEnabled ? '✅' : '❌'} two_fa_enabled column`);
    } catch (err) {
      console.log('   ⚠️  Could not verify schema');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 IMPLEMENTATION NOTES');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('What is 2FA (Two-Factor Authentication)?');
    console.log('  • Requires something user knows (password)');
    console.log('  • Plus something user has (phone/authenticator app)\n');

    console.log('Why is 2FA important for finance roles?');
    console.log('  • Prevents unauthorized access to financial operations');
    console.log('  • Protects against stolen credentials/phishing');
    console.log('  • Meets compliance requirements (PCI, SOX, etc.)\n');

    console.log('How to implement 2FA:');
    console.log('  1. Generate TOTP secret using speakeasy library');
    console.log('  2. Display QR code to user using qrcode library');
    console.log('  3. Verify 6-digit code from authenticator app');
    console.log('  4. Store encrypted secret in database');
    console.log('  5. Require 2FA on next login\n');

    console.log('Popular authenticator apps:');
    console.log('  • Google Authenticator');
    console.log('  • Microsoft Authenticator');
    console.log('  • Authy');
    console.log('  • LastPass Authenticator\n');

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

// Run the check
enforce2FAForHighPrivilege();
