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
      lines: [
        {
          accountId: cashAccount.id,
          type: 'debit',
          amount: 5000000,
          description: 'Cash received from donor'
        },
        {
          accountId: pledgeIncome.id,
          type: 'credit',
          amount: 5000000,
          description: 'Pledge income recorded'
        }
      ]
    });

    if (entry.success) {
      console.log(`✅ Journal Entry Created: ${entry.data.entryNumber}`);

      // Get account balances
      console.log('\n💰 Account Balances After Entry:');
      const cashBalance = await Account.getBalance(cashAccount.id);
      const incomeBalance = await Account.getBalance(pledgeIncome.id);

      console.log(`Cash (1000):`);
      console.log(`  Debits: ${cashBalance.debit.toLocaleString('en-UG')}`);
      console.log(`  Credits: ${cashBalance.credit.toLocaleString('en-UG')}`);
      console.log(`  Balance: ${cashBalance.balance.toLocaleString('en-UG')}`);

      console.log(`\nPledge Income (4000):`);
      console.log(`  Debits: ${incomeBalance.debit.toLocaleString('en-UG')}`);
      console.log(`  Credits: ${incomeBalance.credit.toLocaleString('en-UG')}`);
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
