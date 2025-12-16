/**
 * Seed Default Chart of Accounts for Pledge Management
 * Creates standard accounts for PledgeHub accounting system
 * 
 * Run: node backend/scripts/seed-default-accounts.js
 */

const { pool } = require('../config/db');
const Account = require('../models/Account');

// Standard Chart of Accounts for Pledge Management
const DEFAULT_ACCOUNTS = [
  // ASSETS (1000-1999)
  { code: '1000', name: 'Cash', type: 'ASSET', description: 'Physical cash on hand' },
  { code: '1050', name: 'Bank Account', type: 'ASSET', description: 'Main bank account' },
  { code: '1100', name: 'Mobile Money - MTN', type: 'ASSET', description: 'MTN Mobile Money balance' },
  { code: '1110', name: 'Mobile Money - Airtel', type: 'ASSET', description: 'Airtel Money balance' },
  { code: '1200', name: 'Pledges Receivable', type: 'ASSET', description: 'Outstanding pledges not yet collected' },
  { code: '1300', name: 'PayPal Account', type: 'ASSET', description: 'PayPal balance' },
  
  // LIABILITIES (2000-2999)
  { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY', description: 'Pledges received but not yet earned' },
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to vendors' },
  { code: '2200', name: 'Payment Processing Fees Payable', type: 'LIABILITY', description: 'Fees owed to payment processors' },
  
  // EQUITY (3000-3999)
  { code: '3000', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated net income' },
  { code: '3100', name: 'Owner\'s Capital', type: 'EQUITY', description: 'Owner investment in organization' },
  
  // REVENUE (4000-4999)
  { code: '4000', name: 'Pledge Income', type: 'REVENUE', description: 'Income from pledges collected' },
  { code: '4100', name: 'Donation Revenue', type: 'REVENUE', description: 'Direct donations received' },
  { code: '4200', name: 'Campaign Revenue', type: 'REVENUE', description: 'Revenue from specific campaigns' },
  { code: '4300', name: 'Subscription Revenue', type: 'REVENUE', description: 'Monthly/annual subscriptions' },
  
  // EXPENSES (5000-5999)
  { code: '5000', name: 'Operating Expenses', type: 'EXPENSE', description: 'General operating costs' },
  { code: '5100', name: 'SMS Expenses', type: 'EXPENSE', description: 'Cost of sending SMS messages' },
  { code: '5110', name: 'Email Expenses', type: 'EXPENSE', description: 'Email service costs' },
  { code: '5200', name: 'Payment Processing Fees', type: 'EXPENSE', description: 'Fees for mobile money, PayPal, etc.' },
  { code: '5300', name: 'Software & Hosting', type: 'EXPENSE', description: 'Server hosting and software subscriptions' },
  { code: '5400', name: 'Marketing & Advertising', type: 'EXPENSE', description: 'Marketing and promotional expenses' },
  { code: '5500', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Employee compensation' }
];

async function seedAccounts() {
  console.log('🌱 Seeding Default Chart of Accounts...\n');
  
  let created = 0;
  let skipped = 0;
  
  try {
    for (const accountData of DEFAULT_ACCOUNTS) {
      try {
        // Check if account already exists
        const existing = await Account.getByCode(accountData.code);
        
        if (existing) {
          console.log(`⏭️  Skipped: ${accountData.code} - ${accountData.name} (already exists)`);
          skipped++;
          continue;
        }
        
        // Create account
        const account = await Account.create(accountData);
        console.log(`✅ Created: ${account.code} - ${account.name}`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to create ${accountData.code}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Seeding complete!`);
    console.log(`   ✅ Created: ${created} accounts`);
    console.log(`   ⏭️  Skipped: ${skipped} accounts (already exist)`);
    console.log(`   📊 Total: ${DEFAULT_ACCOUNTS.length} accounts\n`);
    
    // Display account summary
    console.log('📋 Chart of Accounts Summary:');
    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    
    for (const type of accountTypes) {
      const accounts = await Account.getAll(type);
      console.log(`   ${type}: ${accounts.length} accounts`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Review accounts: SELECT * FROM accounts ORDER BY code;');
    console.log('   2. Start recording pledges - journal entries will be created automatically');
    console.log('   3. View reports at /api/accounting/reports\n');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedAccounts();
}

module.exports = { seedAccounts, DEFAULT_ACCOUNTS };
