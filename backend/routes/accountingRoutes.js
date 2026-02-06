/**
 * Accounting Routes - API endpoints for accounting features
 * Handles accounts, journal entries, and financial reports
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireStaff, requireRole } = require('../middleware/authMiddleware');
const Account = require('../models/Account');
const accountingService = require('../services/accountingService');
const financialReportsService = require('../services/financialReportsService');

/**
 * Finance staff middleware - requires finance_admin or accounting access
 */
const requireFinance = requireRole(['finance_admin', 'super_admin']);

/**
 * GET /api/accounting/accounts
 * Get all accounts in Chart of Accounts
 * Requires: finance_admin, super_admin, or admin role
 */
router.get('/accounts', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { type, includeBalances } = req.query;
    
    let accounts;
    if (includeBalances === 'true') {
      accounts = await Account.getAllWithBalances(type || null);
    } else {
      accounts = await Account.getAll(type || null);
    }
    
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/accounts/:id
 * Get specific account with balance
 * Requires: finance_admin, super_admin, or admin role
 */
router.get('/accounts/:id', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const account = await Account.getWithBalance(
      parseInt(req.params.id),
      asOfDate ? new Date(asOfDate) : null
    );
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/accounting/accounts
 * Create new account (Finance/Admin only)
 * Requires: finance_admin, super_admin, or admin role
 */
router.post('/accounts', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { code, name, type, parent_id, description } = req.body;
    
    if (!code || !name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, type'
      });
    }
    
    const account = await Account.create({ code, name, type, parent_id, description });
    
    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/accounting/accounts/:id
 * Update account (Admin/Finance only)
 * Requires: finance_admin, super_admin, or admin role
 */
router.put('/accounts/:id', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;
    
    const account = await Account.update(parseInt(req.params.id), updates);
    
    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/journal-entries
 * Get journal entries with filters
 * Requires: finance_admin, super_admin, or admin role
 */
router.get('/journal-entries', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { startDate, endDate, accountId, reference, status, limit, offset } = req.query;
    
    const result = await accountingService.getJournalEntries({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      accountId: accountId ? parseInt(accountId) : null,
      reference,
      status: status || 'posted',
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/journal-entries/:id
 * Get specific journal entry with lines
 */
router.get('/journal-entries/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const result = await accountingService.getJournalEntry(parseInt(req.params.id));
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/accounting/journal-entries
 * Create manual journal entry (Admin only)
 */
router.post('/journal-entries', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { date, description, reference, lines } = req.body;
    
    if (!description || !lines || !Array.isArray(lines)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, lines (array)'
      });
    }
    
    const result = await accountingService.createJournalEntry({
      date: date ? new Date(date) : new Date(),
      description,
      reference,
      userId: req.user.id,
      lines
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/accounting/journal-entries/:id/void
 * Void journal entry (Admin only)
 */
router.post('/journal-entries/:id/void', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Void reason is required'
      });
    }
    
    const result = await accountingService.voidJournalEntry(
      parseInt(req.params.id),
      reason,
      req.user.id
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error voiding journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/ledger/:accountId
 * Get general ledger for an account
 */
router.get('/ledger/:accountId', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { startDate, endDate, limit, offset } = req.query;
    
    const result = await accountingService.getGeneralLedger(
      parseInt(req.params.accountId),
      {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      }
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/balance-sheet
 * Generate Balance Sheet
 */
router.get('/reports/balance-sheet', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const result = await financialReportsService.generateBalanceSheet(
      asOfDate ? new Date(asOfDate) : new Date()
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/income-statement
 * Generate Income Statement (P&L)
 */
router.get('/reports/income-statement', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const result = await financialReportsService.generateIncomeStatement(
      new Date(startDate),
      new Date(endDate)
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/trial-balance
 * Generate Trial Balance
 */
router.get('/reports/trial-balance', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const result = await financialReportsService.generateTrialBalance(
      asOfDate ? new Date(asOfDate) : new Date()
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/cash-flow
 * Generate Cash Flow Statement
 */
router.get('/reports/cash-flow', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }
    
    const result = await financialReportsService.generateCashFlowStatement(
      new Date(startDate),
      new Date(endDate)
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating cash flow statement:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/ar-aging
 * Generate Accounts Receivable Aging Report
 */
router.get('/reports/ar-aging', authenticateToken, requireFinance, async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const result = await financialReportsService.generateARAgingReport(
      asOfDate ? new Date(asOfDate) : new Date()
    );
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating AR aging report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounting/reports/dashboard
 * Get financial dashboard summary
 */
router.get('/reports/dashboard', authenticateToken, requireFinance, async (req, res) => {
  try {
    const result = await financialReportsService.generateDashboard();
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
