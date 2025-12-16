/**
 * Account Model - Chart of Accounts Management
 * Handles all database operations for accounting system
 */

const { pool } = require('../config/db');

// Account types with normal balance direction
const ACCOUNT_TYPES = {
  ASSET: { normal_balance: 'debit', category: 'Balance Sheet' },
  LIABILITY: { normal_balance: 'credit', category: 'Balance Sheet' },
  EQUITY: { normal_balance: 'credit', category: 'Balance Sheet' },
  REVENUE: { normal_balance: 'credit', category: 'Income Statement' },
  EXPENSE: { normal_balance: 'debit', category: 'Income Statement' }
};

/**
 * Create a new account in the Chart of Accounts
 * @param {Object} accountData - Account details
 * @returns {Promise<Object>} Created account
 */
async function create(accountData) {
  const { code, name, type, parent_id = null, description = null } = accountData;
  
  // Validate account type
  if (!ACCOUNT_TYPES[type]) {
    throw new Error(`Invalid account type: ${type}. Must be one of: ${Object.keys(ACCOUNT_TYPES).join(', ')}`);
  }
  
  const [result] = await pool.execute(
    `INSERT INTO accounts (code, name, type, parent_id, description, is_active) 
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [code, name, type, parent_id, description]
  );
  
  return await getById(result.insertId);
}

/**
 * Get account by ID
 * @param {number} id - Account ID
 * @returns {Promise<Object|null>} Account details
 */
async function getById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM accounts WHERE id = ?',
    [id]
  );
  
  return rows[0] || null;
}

/**
 * Get account by code
 * @param {string} code - Account code
 * @returns {Promise<Object|null>} Account details
 */
async function getByCode(code) {
  const [rows] = await pool.execute(
    'SELECT * FROM accounts WHERE code = ? AND is_active = TRUE',
    [code]
  );
  
  return rows[0] || null;
}

/**
 * Get all accounts, optionally filtered by type
 * @param {string} type - Optional account type filter
 * @param {boolean} activeOnly - Only return active accounts
 * @returns {Promise<Array>} List of accounts
 */
async function getAll(type = null, activeOnly = true) {
  let query = 'SELECT * FROM accounts WHERE 1=1';
  const params = [];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  if (activeOnly) {
    query += ' AND is_active = TRUE';
  }
  
  query += ' ORDER BY code';
  
  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Get account with its current balance
 * @param {number} accountId - Account ID
 * @param {Date} asOfDate - Optional date to get balance as of
 * @returns {Promise<Object|null>} Account with balance
 */
async function getWithBalance(accountId, asOfDate = null) {
  let query = `
    SELECT 
      a.*,
      COALESCE(SUM(l.debit), 0) as total_debit,
      COALESCE(SUM(l.credit), 0) as total_credit,
      CASE 
        WHEN a.type IN ('ASSET', 'EXPENSE') THEN COALESCE(SUM(l.debit - l.credit), 0)
        ELSE COALESCE(SUM(l.credit - l.debit), 0)
      END as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines l ON a.id = l.account_id
    LEFT JOIN journal_entries e ON l.entry_id = e.id AND e.status = 'posted'
    WHERE a.id = ?
  `;
  
  const params = [accountId];
  
  if (asOfDate) {
    query += ' AND e.date <= ?';
    params.push(asOfDate);
  }
  
  query += ' GROUP BY a.id';
  
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

/**
 * Get all accounts with their balances
 * @param {string} type - Optional account type filter
 * @param {Date} asOfDate - Optional date to get balances as of
 * @returns {Promise<Array>} List of accounts with balances
 */
async function getAllWithBalances(type = null, asOfDate = null) {
  let query = `
    SELECT 
      a.id,
      a.code,
      a.name,
      a.type,
      a.parent_id,
      a.description,
      COALESCE(SUM(l.debit), 0) as total_debit,
      COALESCE(SUM(l.credit), 0) as total_credit,
      CASE 
        WHEN a.type IN ('ASSET', 'EXPENSE') THEN COALESCE(SUM(l.debit - l.credit), 0)
        ELSE COALESCE(SUM(l.credit - l.debit), 0)
      END as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines l ON a.id = l.account_id
    LEFT JOIN journal_entries e ON l.entry_id = e.id AND e.status = 'posted'
    WHERE a.is_active = TRUE
  `;
  
  const params = [];
  
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }
  
  if (asOfDate) {
    query += ' AND (e.date IS NULL OR e.date <= ?)';
    params.push(asOfDate);
  }
  
  query += ' GROUP BY a.id, a.code, a.name, a.type, a.parent_id, a.description ORDER BY a.code';
  
  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Update account details
 * @param {number} id - Account ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated account
 */
async function update(id, updates) {
  const allowedFields = ['name', 'description', 'is_active'];
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  values.push(id);
  
  await pool.execute(
    `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  return await getById(id);
}

/**
 * Deactivate account (soft delete - cannot delete if has transactions)
 * @param {number} id - Account ID
 * @returns {Promise<boolean>} Success status
 */
async function deactivate(id) {
  // Check if account has transactions
  const [transactions] = await pool.execute(
    'SELECT COUNT(*) as count FROM journal_entry_lines WHERE account_id = ?',
    [id]
  );
  
  if (transactions[0].count > 0) {
    throw new Error('Cannot deactivate account with existing transactions. Use is_active = FALSE instead.');
  }
  
  await pool.execute(
    'UPDATE accounts SET is_active = FALSE WHERE id = ?',
    [id]
  );
  
  return true;
}

/**
 * Get account hierarchy (parent and children)
 * @param {number} accountId - Parent account ID
 * @returns {Promise<Array>} Child accounts
 */
async function getChildren(accountId) {
  const [rows] = await pool.execute(
    'SELECT * FROM accounts WHERE parent_id = ? AND is_active = TRUE ORDER BY code',
    [accountId]
  );
  
  return rows;
}

/**
 * Validate account exists and is active
 * @param {number} accountId - Account ID
 * @returns {Promise<boolean>} True if valid
 */
async function isValid(accountId) {
  const [rows] = await pool.execute(
    'SELECT id FROM accounts WHERE id = ? AND is_active = TRUE',
    [accountId]
  );
  
  return rows.length > 0;
}

module.exports = {
  ACCOUNT_TYPES,
  create,
  getById,
  getByCode,
  getAll,
  getWithBalance,
  getAllWithBalances,
  update,
  deactivate,
  getChildren,
  isValid
};
