const { pool } = require('../config/db');

/**
 * Bank Fee Calculator Service
 * Handles all bank fee calculations, comparisons, and tracking
 */

class BankFeeCalculator {
  /**
   * Get all available banks
   */
  async getBankConfigurations(isActive = true) {
    try {
      const [banks] = await pool.execute(
        'SELECT * FROM bank_configurations WHERE is_active = ? ORDER BY name ASC',
        [isActive ? 1 : 0]
      );
      return { success: true, data: banks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get single bank configuration
   */
  async getBankByCode(code) {
    try {
      const [banks] = await pool.execute(
        'SELECT * FROM bank_configurations WHERE code = ? AND is_active = 1',
        [code]
      );
      if (!banks.length) {
        return { success: false, error: 'Bank not found' };
      }
      return { success: true, data: banks[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate all fees for a payment
   * Returns: { donorAmount, mobileMoneyFee, bankFee, platformCommission, creatorNetPayout }
   */
  async calculatePaymentFees(pledgeId, donorAmount, paymentMethod = 'airtel', bankCode = 'EXIM', platformCommissionPercent = 10) {
    try {
      // Get bank configuration
      const bankResult = await this.getBankByCode(bankCode);
      if (!bankResult.success) {
        return bankResult;
      }

      const bank = bankResult.data;

      // Step 1: Mobile Money Provider Fee (MTN or Airtel)
      let mobileMoneyFee = 0;
      if (paymentMethod === 'airtel' || paymentMethod === 'mtn') {
        mobileMoneyFee = Math.round(donorAmount * (paymentMethod === 'airtel' ? 0.02 : 0.03));
      }

      // Amount that reaches your merchant account
      const amountToMerchant = donorAmount - mobileMoneyFee;

      // Step 2: Bank Deposit Fee
      const bankDepositFee = Math.round(amountToMerchant * bank.deposit_fee_percentage);
      const amountAfterBankFee = amountToMerchant - bankDepositFee;

      // Step 3: Platform Commission (your profit)
      const platformCommission = Math.round(amountAfterBankFee * (platformCommissionPercent / 100));

      // Step 4: Creator's Net Payout
      const creatorNetPayout = amountAfterBankFee - platformCommission;

      // Build fee breakdown
      const feeBreakdown = {
        donorAmount,
        mobileMoneyProvider: paymentMethod.toUpperCase(),
        mobileMoneyFee,
        mobileMoneyFeePercent: paymentMethod === 'airtel' ? 2 : 3,
        amountToMerchant,
        bank: bank.name,
        bankDepositFee,
        bankDepositFeePercent: (bank.deposit_fee_percentage * 100).toFixed(2),
        amountAfterBankFee,
        platformCommissionPercent,
        platformCommission,
        creatorNetPayout,
        summary: {
          'Donor sends': `${donorAmount.toLocaleString()} UGX`,
          [`${paymentMethod.toUpperCase()} fee (${paymentMethod === 'airtel' ? '2%' : '3%'})`]: `${mobileMoneyFee.toLocaleString()} UGX`,
          'To your account': `${amountToMerchant.toLocaleString()} UGX`,
          [`${bank.name} deposit fee (${(bank.deposit_fee_percentage * 100).toFixed(2)}%)`]: `${bankDepositFee.toLocaleString()} UGX`,
          [`PledgeHub commission (${platformCommissionPercent}%)`]: `${platformCommission.toLocaleString()} UGX`,
          'Creator receives': `${creatorNetPayout.toLocaleString()} UGX`
        }
      };

      return {
        success: true,
        data: {
          donorAmount,
          mobileMoneyFee,
          bankDepositFee,
          platformCommission,
          creatorNetPayout,
          feeBreakdown,
          totalDeductions: mobileMoneyFee + bankDepositFee + platformCommission,
          creatorNetPercent: ((creatorNetPayout / donorAmount) * 100).toFixed(2)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare fees across multiple banks for same transaction
   */
  async compareBankFees(donorAmount, paymentMethod = 'airtel', platformCommissionPercent = 10) {
    try {
      const bankResult = await this.getBankConfigurations(true);
      if (!bankResult.success) return bankResult;

      const banks = bankResult.data;
      const comparisons = [];

      for (const bank of banks) {
        const feeResult = await this.calculatePaymentFees(
          null,
          donorAmount,
          paymentMethod,
          bank.code,
          platformCommissionPercent
        );

        if (feeResult.success) {
          comparisons.push({
            bank: bank.name,
            code: bank.code,
            monthlyFee: bank.monthly_account_fee,
            depositFee: bank.deposit_fee_percentage * 100,
            mobileMoneyFee: feeResult.data.mobileMoneyFee,
            bankDepositFee: feeResult.data.bankDepositFee,
            platformCommission: feeResult.data.platformCommission,
            creatorNetPayout: feeResult.data.creatorNetPayout,
            totalCost: donorAmount - feeResult.data.creatorNetPayout,
            costPercent: (((donorAmount - feeResult.data.creatorNetPayout) / donorAmount) * 100).toFixed(2)
          });
        }
      }

      // Sort by creator net payout (best for creator)
      comparisons.sort((a, b) => b.creatorNetPayout - a.creatorNetPayout);

      return {
        success: true,
        data: {
          donorAmount,
          paymentMethod,
          comparisons,
          bestForCreator: comparisons[0],
          cheapestBank: comparisons[comparisons.length - 1],
          averageCreatorPayout: Math.round(
            comparisons.reduce((sum, c) => sum + c.creatorNetPayout, 0) / comparisons.length
          )
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Record payment fees in database
   */
  async recordPaymentFees(paymentId, pledgeId, bankCode, feeCalculation) {
    try {
      const [bank] = await pool.execute(
        'SELECT id FROM bank_configurations WHERE code = ?',
        [bankCode]
      );

      if (!bank.length) {
        return { success: false, error: 'Bank not found' };
      }

      const bankId = bank[0].id;

      await pool.execute(
        `INSERT INTO payment_fees 
         (payment_id, pledge_id, bank_id, bank_name, donor_amount, airtel_fee, 
          bank_deposit_fee, platform_commission, creator_net_payout, fee_breakdown)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          pledgeId,
          bankId,
          feeCalculation.feeBreakdown.bank,
          feeCalculation.donorAmount,
          feeCalculation.mobileMoneyFee,
          feeCalculation.bankDepositFee,
          feeCalculation.platformCommission,
          feeCalculation.creatorNetPayout,
          JSON.stringify(feeCalculation.feeBreakdown)
        ]
      );

      return { success: true, data: { feeRecordId: bankId } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get monthly fees report for admin
   */
  async getMonthlyFeesReport(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const [report] = await pool.execute(
        `SELECT 
          bc.code as bank_code,
          bc.name as bank_name,
          COUNT(pf.id) as transaction_count,
          SUM(pf.donor_amount) as total_donor_amount,
          SUM(pf.airtel_fee) as total_provider_fees,
          SUM(pf.bank_deposit_fee) as total_bank_fees,
          SUM(pf.platform_commission) as total_platform_commission,
          SUM(pf.creator_net_payout) as total_creator_payout,
          AVG(pf.donor_amount) as avg_transaction_amount
        FROM payment_fees pf
        LEFT JOIN bank_configurations bc ON pf.bank_id = bc.id
        WHERE MONTH(pf.calculated_at) = ? AND YEAR(pf.calculated_at) = ?
        GROUP BY pf.bank_id
        ORDER BY total_platform_commission DESC`,
        [month, year]
      );

      return {
        success: true,
        data: {
          period: `${year}-${String(month).padStart(2, '0')}`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          byBank: report,
          totals: {
            transactions: report.reduce((sum, r) => sum + parseInt(r.transaction_count || 0), 0),
            donorAmount: report.reduce((sum, r) => sum + parseFloat(r.total_donor_amount || 0), 0),
            providerFees: report.reduce((sum, r) => sum + parseFloat(r.total_provider_fees || 0), 0),
            bankFees: report.reduce((sum, r) => sum + parseFloat(r.total_bank_fees || 0), 0),
            platformCommission: report.reduce((sum, r) => sum + parseFloat(r.total_platform_commission || 0), 0),
            creatorPayouts: report.reduce((sum, r) => sum + parseFloat(r.total_creator_payout || 0), 0)
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user's bank preference
   */
  async updateUserBankPreference(userId, bankCode, accountNumber, accountName, accountType = 'personal') {
    try {
      // Verify bank exists
      const bankResult = await this.getBankByCode(bankCode);
      if (!bankResult.success) {
        return { success: false, error: 'Invalid bank selected' };
      }

      await pool.execute(
        `UPDATE users 
         SET preferred_bank = ?, bank_account_number = ?, bank_account_name = ?, bank_account_type = ?
         WHERE id = ?`,
        [bankCode, accountNumber, accountName, accountType, userId]
      );

      return {
        success: true,
        data: {
          message: 'Bank preference updated',
          userId,
          bank: bankResult.data.name,
          accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*')
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BankFeeCalculator();
