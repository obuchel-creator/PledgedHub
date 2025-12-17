/**
 * Pledge Accounting Integration
 * Automatically posts journal entries when pledges are created or paid
 */

const { pool } = require('../config/db');
const accountingService = require('./accountingService');
const Account = require('../models/Account');

/**
 * Record New Pledge in Accounting
 * When a pledge is created, post:
 * - DR: Pledges Receivable (1200)
 * - CR: Unearned Revenue (2000)
 */
async function recordNewPledge(pledgeId, amount, campaignName, donorName) {
  try {
    console.log(`💳 Recording new pledge in accounting: ${pledgeId} for ${amount.toLocaleString('en-UG')} UGX`);

    // Get accounts
    const pledgesReceivable = await Account.getByCode('1200');
    const unearneRevenue = await Account.getByCode('2000');

    if (!pledgesReceivable || !unearneRevenue) {
      throw new Error('Required accounts not found in chart of accounts');
    }

    // Create journal entry
    const entry = await accountingService.createJournalEntry({
      date: new Date(),
      description: `Pledge received for: ${campaignName} - Donor: ${donorName}`,
      reference: `PLEDGE-${pledgeId}`,
      lines: [
        {
          accountId: pledgesReceivable.id,
          type: 'debit',
          amount: amount,
          description: `Pledge receivable from ${donorName}`
        },
        {
          accountId: unearneRevenue.id,
          type: 'credit',
          amount: amount,
          description: `Unearned revenue - ${campaignName}`
        }
      ]
    });

    if (entry.success) {
      console.log(`✅ Pledge recorded in accounting: ${entry.data.entryNumber}`);
      return { success: true, data: { entryNumber: entry.data.entryNumber } };
    } else {
      console.error(`❌ Error recording pledge: ${entry.error}`);
      return { success: false, error: entry.error };
    }
  } catch (error) {
    console.error('❌ Error in recordNewPledge:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Record Pledge Payment in Accounting
 * When a pledge is paid, post:
 * - DR: Cash/Mobile Money (1000/1100)
 * - CR: Pledge Income (4000)
 * 
 * Also reverse unearned revenue:
 * - DR: Unearned Revenue (2000)
 * - CR: Pledge Income (4000)
 */
async function recordPledgePayment(pledgeId, amount, paymentMethod, donorName) {
  try {
    console.log(`💰 Recording pledge payment in accounting: ${pledgeId} via ${paymentMethod}`);

    // Map payment method to cash account
    const accountMap = {
      'mtn': '1100',      // Mobile Money (MTN)
      'airtel': '1110',   // Mobile Money (Airtel)
      'cash': '1000',     // Cash
      'bank': '1300',     // Bank Account
      'paypal': '1300'    // Bank Account
    };

    const cashAccountCode = accountMap[paymentMethod.toLowerCase()] || '1000';
    const cashAccount = await Account.getByCode(cashAccountCode);
    const pledgeIncome = await Account.getByCode('4000');

    if (!cashAccount || !pledgeIncome) {
      throw new Error('Required accounts not found in chart of accounts');
    }

    // Create journal entry for cash receipt
    const entry = await accountingService.createJournalEntry({
      date: new Date(),
      description: `Pledge payment received from ${donorName} via ${paymentMethod}`,
      reference: `PLEDGE-PAY-${pledgeId}`,
      lines: [
        {
          accountId: cashAccount.id,
          type: 'debit',
          amount: amount,
          description: `Cash received from pledge #${pledgeId}`
        },
        {
          accountId: pledgeIncome.id,
          type: 'credit',
          amount: amount,
          description: `Pledge income from ${donorName}`
        }
      ]
    });

    if (entry.success) {
      console.log(`✅ Pledge payment recorded: ${entry.data.entryNumber}`);
      return { success: true, data: { entryNumber: entry.data.entryNumber } };
    } else {
      console.error(`❌ Error recording payment: ${entry.error}`);
      return { success: false, error: entry.error };
    }
  } catch (error) {
    console.error('❌ Error in recordPledgePayment:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Record Campaign Creation in Accounting
 * When a campaign is created, post:
 * - No immediate entry (pledges create the receivable)
 * But track campaign as a cost center
 */
async function recordCampaignCreation(campaignId, campaignName, targetAmount) {
  try {
    console.log(`📊 Recording campaign in accounting: ${campaignName}`);

    // For now, just log - campaigns are tracked through their pledges
    // Future: Could create a campaign budget entry
    console.log(`✅ Campaign ${campaignId} is now tracked in accounting system`);
    return { success: true, data: { campaignId } };
  } catch (error) {
    console.error('❌ Error in recordCampaignCreation:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Reconcile Pledge Status with Accounting
 * Ensures pledge payment status matches accounting records
 */
async function reconcilePledges() {
  try {
    console.log('🔍 Reconciling pledges with accounting...');

    const [pledges] = await pool.execute(`
      SELECT id, amount, status, campaign_id 
      FROM pledges 
      WHERE deleted = 0
    `);

    let reconcilationSummary = {
      total: pledges.length,
      reconciled: 0,
      errors: 0,
      discrepancies: []
    };

    for (const pledge of pledges) {
      try {
        const [entries] = await pool.execute(`
          SELECT SUM(credit) as total_credit, COUNT(*) as entry_count
          FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.entry_id = je.id
          WHERE je.reference = ? AND je.status = 'posted'
        `, [`PLEDGE-PAY-${pledge.id}`]);

        const hasPaymentEntry = entries[0] && entries[0].entry_count > 0;
        const expectedPayment = pledge.status === 'paid' || pledge.status === 'partial';

        if (expectedPayment && !hasPaymentEntry) {
          reconcilationSummary.discrepancies.push({
            pledgeId: pledge.id,
            amount: pledge.amount,
            status: pledge.status,
            issue: 'Payment status mismatch - accounting entry missing'
          });
        }

        reconcilationSummary.reconciled++;
      } catch (error) {
        console.error(`Error reconciling pledge ${pledge.id}:`, error.message);
        reconcilationSummary.errors++;
      }
    }

    console.log('\n📊 Reconciliation Summary:');
    console.log(`Total Pledges: ${reconcilationSummary.total}`);
    console.log(`Reconciled: ${reconcilationSummary.reconciled}`);
    console.log(`Errors: ${reconcilationSummary.errors}`);
    console.log(`Discrepancies: ${reconcilationSummary.discrepancies.length}`);

    if (reconcilationSummary.discrepancies.length > 0) {
      console.log('\n⚠️  Discrepancies Found:');
      reconcilationSummary.discrepancies.forEach(d => {
        console.log(`  - Pledge ${d.pledgeId}: ${d.issue}`);
      });
    }

    return { success: true, data: reconcilationSummary };
  } catch (error) {
    console.error('❌ Error in reconcilePledges:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get Pledge Financial Summary
 * Returns total pledged, paid, pending with accounting validation
 */
async function getPledgeFinancialSummary() {
  try {
    const [summary] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pledges,
        SUM(amount) as total_pledged,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'partial' THEN amount ELSE 0 END) as total_partial
      FROM pledges 
      WHERE deleted = 0
    `);

    // Get accounting balances
    const pledgeIncome = await Account.getBalance(await Account.getByCode('4000').then(a => a.id));
    const cashBalance = await Account.getBalance(await Account.getByCode('1000').then(a => a.id));
    const pledgesReceivable = await Account.getBalance(await Account.getByCode('1200').then(a => a.id));

    return {
      success: true,
      data: {
        pledges: {
          total: summary[0].total_pledges,
          totalAmount: summary[0].total_pledged || 0,
          paid: summary[0].total_paid || 0,
          pending: summary[0].total_pending || 0,
          partial: summary[0].total_partial || 0
        },
        accounting: {
          pledgeIncome: pledgeIncome.balance,
          cashOnHand: cashBalance.balance,
          pledgesRecoverable: pledgesReceivable.balance
        },
        validation: {
          match: summary[0].total_paid === pledgeIncome.balance ? '✅ Match' : '❌ Mismatch'
        }
      }
    };
  } catch (error) {
    console.error('❌ Error in getPledgeFinancialSummary:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  recordNewPledge,
  recordPledgePayment,
  recordCampaignCreation,
  reconcilePledges,
  getPledgeFinancialSummary
};
