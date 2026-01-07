const accountingService = require('../services/accountingService');
const Account = require('../models/Account');

async function demonstrateAccounting() {
  try {
    console.log('🎯 Demonstrating Accounting System\n');

    // Get a sample account
    console.log('📍 Getting Chart of Accounts...');
    const cashAccount = await Account.getByCode('1000');
    const pledgesReceivable = await Account.getByCode('1200');
    const unearneRevenue = await Account.getByCode('2000');
    const pledgeIncome = await Account.getByCode('4000');

    console.log(`✓ Cash (Asset): ID ${cashAccount.id}`);
    console.log(`✓ Pledges Receivable (Asset): ID ${pledgesReceivable.id}`);
    console.log(`✓ Unearned Revenue (Liability): ID ${unearneRevenue.id}`);
    console.log(`✓ Pledge Income (Revenue): ID ${pledgeIncome.id}`);

    // Create a sample journal entry: Pledge received
    console.log('\n📝 Creating Sample Journal Entry...');
    console.log('Entry: Pledge received for 5,000,000 UGX');

    const entry = await accountingService.createJournalEntry({
      date: new Date(),
      description: 'Sample: Pledge received for School Library Campaign',
      reference: 'PLEDGE-001',
      userId: 1, // Use admin user or a valid user ID
      lines: [
        {
          accountId: cashAccount.id,
          debit: 5000000,
          credit: 0,
          description: 'Cash received from donor'
        },
        {
          accountId: pledgeIncome.id,
          debit: 0,
          credit: 5000000,
          description: 'Pledge income recorded'
        }
      ]
    });

    if (entry.success) {
      console.log(`✅ Journal Entry Created: ${entry.data.entryNumber}`);

      // Get account balances
      console.log('\n💰 Account Balances After Entry:');
      const cashBalance = await Account.getWithBalance(cashAccount.id);
      const incomeBalance = await Account.getWithBalance(pledgeIncome.id);

      console.log(`Cash (1000):`);
      console.log(`  Debits: ${cashBalance.total_debit.toLocaleString('en-UG')}`);
      console.log(`  Credits: ${cashBalance.total_credit.toLocaleString('en-UG')}`);
      console.log(`  Balance: ${cashBalance.balance.toLocaleString('en-UG')}`);

      console.log(`\nPledge Income (4000):`);
      console.log(`  Debits: ${incomeBalance.total_debit.toLocaleString('en-UG')}`);
      console.log(`  Credits: ${incomeBalance.total_credit.toLocaleString('en-UG')}`);
      console.log(`  Balance: ${incomeBalance.balance.toLocaleString('en-UG')}`);

      console.log('\n✨ Accounting system is working correctly!');
    } else {
      console.error('❌ Error creating journal entry:', entry.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

demonstrateAccounting();
