/**
 * Quick script to add your MTN and Airtel payment accounts
 */

const { pool } = require('../config/db');

async function addPaymentAccounts() {
  try {
    console.log('\n💰 Adding your payment accounts...\n');
    
    // MTN Account (Primary)
    const [mtnResult] = await pool.execute(`
      INSERT INTO platform_accounts (
        account_type, phone_number, account_holder_name, 
        account_label, is_active, is_primary
      ) VALUES (?, ?, ?, ?, 1, 1)
    `, ['mtn', '256774306868', 'Your Name', 'PledgeHub Commission - MTN']);
    
    console.log('✅ MTN Account Added:');
    console.log('   Phone: 0774306868');
    console.log('   Status: Primary ✓');
    console.log('   ID:', mtnResult.insertId);
    
    // Airtel Account (Backup)
    const [airtelResult] = await pool.execute(`
      INSERT INTO platform_accounts (
        account_type, phone_number, account_holder_name, 
        account_label, is_active, is_primary
      ) VALUES (?, ?, ?, ?, 1, 0)
    `, ['airtel', '256701067528', 'Your Name', 'PledgeHub Commission - Airtel']);
    
    console.log('\n✅ Airtel Account Added:');
    console.log('   Phone: 0701067528');
    console.log('   Status: Backup');
    console.log('   ID:', airtelResult.insertId);
    
    // Show all accounts
    const [accounts] = await pool.execute(`
      SELECT 
        id, account_type, phone_number, 
        account_label, is_primary
      FROM platform_accounts
      ORDER BY is_primary DESC, created_at DESC
    `);
    
    console.log('\n📋 All Your Payment Accounts:');
    console.log('────────────────────────────────────────');
    accounts.forEach((acc, idx) => {
      console.log(`${idx + 1}. ${acc.account_type.toUpperCase()}`);
      console.log(`   Phone: ${acc.phone_number}`);
      console.log(`   Status: ${acc.is_primary ? '🔵 PRIMARY' : '⚪ Backup'}`);
      console.log(`   Label: ${acc.account_label}`);
    });
    
    console.log('\n✨ Setup Complete!');
    console.log('───────────────────────────────────────');
    console.log('Your system is ready to send commissions:');
    console.log('');
    console.log('🔵 Primary Account:  MTN (0774306868)');
    console.log('⚪ Backup Account:   Airtel (0701067528)');
    console.log('');
    console.log('Commission Flow:');
    console.log('├─ Pledge received → Split payment');
    console.log('├─ Commission accrued → Added to balance');
    console.log('├─ Daily 5 PM → Automatic batch payout');
    console.log('└─ Money sent → Your MTN wallet ✅');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error adding accounts:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addPaymentAccounts();
