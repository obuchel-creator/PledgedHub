/**
 * Accounting Service - Core Double-Entry Bookkeeping
 * Handles journal entries, transaction validation, and account operations
 */

const { pool } = require('../config/db');
const Account = require('../models/Account');

/**
 * Generate next entry number (format: JE-YYYYMMDD-XXXX)
 * @returns {Promise<string>} Entry number
 */
async function generateEntryNumber() {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `JE-${today}-`;
  
  const [rows] = await pool.execute(
    `SELECT entry_number FROM journal_entries 
     WHERE entry_number LIKE ? 
     ORDER BY entry_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  let sequence = 1;
  if (rows.length > 0) {
    const lastNumber = rows[0].entry_number.split('-').pop();
    sequence = parseInt(lastNumber) + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

/**
 * Validate journal entry (debits must equal credits)
 * @param {Array} lines - Journal entry lines
 * @returns {Object} Validation result
 */
function validateJournalEntry(lines) {
  if (!lines || lines.length < 2) {
    return {
      valid: false,
      error: 'Journal entry must have at least 2 lines (minimum one debit and one credit)'
    };
  }
  
  let totalDebits = 0;
  let totalCredits = 0;
  
  for (const line of lines) {
    const debit = parseFloat(line.debit || 0);
    const credit = parseFloat(line.credit || 0);
    
    // Each line should have either debit or credit, not both
    if (debit > 0 && credit > 0) {
      return {
        valid: false,
        error: 'A line cannot have both debit and credit amounts'
      };
    }
    
    if (debit === 0 && credit === 0) {
      return {
        valid: false,
        error: 'Each line must have either a debit or credit amount'
      };
    }
    
    totalDebits += debit;
    totalCredits += credit;
  }
  
  // Allow small rounding differences (0.01)
  const difference = Math.abs(totalDebits - totalCredits);
  if (difference > 0.01) {
    return {
      valid: false,
      error: `Debits (${totalDebits.toFixed(2)}) must equal Credits (${totalCredits.toFixed(2)}). Difference: ${difference.toFixed(2)}`
    };
  }
  
  return { valid: true, totalDebits, totalCredits };
}

/**
 * Create journal entry with automatic validation
 * @param {Object} entry - Entry details
 * @returns {Promise<Object>} Result with entry ID
 */
async function createJournalEntry(entry) {
  const {
    date = new Date(),
    description,
    reference = null,
    userId,
    lines = [],
    status = 'posted'
  } = entry;
  
  // Validate entry
  const validation = validateJournalEntry(lines);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Validate all accounts exist
  for (const line of lines) {
    const isValidAccount = await Account.isValid(line.accountId);
    if (!isValidAccount) {
      return { success: false, error: `Invalid account ID: ${line.accountId}` };
    }
  }
  
  // Use transaction for atomicity
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Generate entry number
    const entryNumber = await generateEntryNumber();
    
    // Insert journal entry header
    const [result] = await connection.execute(
      `INSERT INTO journal_entries (entry_number, date, description, reference, created_by, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entryNumber, date, description, reference, userId, status]
    );
    
    const entryId = result.insertId;
    
    // Insert journal entry lines
    for (const line of lines) {
      const debit = parseFloat(line.debit || 0);
      const credit = parseFloat(line.credit || 0);
      
      await connection.execute(
        `INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [entryId, line.accountId, debit, credit, line.description || null]
      );
    }
    
    await connection.commit();
    
    console.log(`✅ Journal Entry ${entryNumber} created: ${description}`);
    
    return {
      success: true,
      data: {
        entryId,
        entryNumber,
        totalDebits: validation.totalDebits,
        totalCredits: validation.totalCredits
      }
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Failed to create journal entry:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

/**
 * Get journal entry by ID with all lines
 * @param {number} entryId - Entry ID
 * @returns {Promise<Object>} Entry details
 */
async function getJournalEntry(entryId) {
  try {
    // Get entry header
    const [entries] = await pool.execute(
      `SELECT e.*, u.name as created_by_name
       FROM journal_entries e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [entryId]
    );
    
    if (entries.length === 0) {
      return { success: false, error: 'Journal entry not found' };
    }
    
    const entry = entries[0];
    
    // Get entry lines
    const [lines] = await pool.execute(
      `SELECT l.*, a.code as account_code, a.name as account_name, a.type as account_type
       FROM journal_entry_lines l
       JOIN accounts a ON l.account_id = a.id
       WHERE l.entry_id = ?
       ORDER BY l.id`,
      [entryId]
    );
    
    entry.lines = lines;
    
    return { success: true, data: entry };
    
  } catch (error) {
    console.error('❌ Error fetching journal entry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get journal entries with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} List of entries
 */
async function getJournalEntries(filters = {}) {
  try {
    const {
      startDate = null,
      endDate = null,
      accountId = null,
      reference = null,
      status = 'posted',
      limit = 50,
      offset = 0
    } = filters;
    
    let query = `
      SELECT DISTINCT e.*, u.name as created_by_name
      FROM journal_entries e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN journal_entry_lines l ON e.id = l.entry_id
      WHERE e.status = ?
    `;
    
    const params = [status];
    
    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    
    if (accountId) {
      query += ' AND l.account_id = ?';
      params.push(accountId);
    }
    
    if (reference) {
      query += ' AND e.reference LIKE ?';
      params.push(`%${reference}%`);
    }
    
    query += ' ORDER BY e.date DESC, e.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [entries] = await pool.execute(query, params);
    
    return { success: true, data: entries };
    
  } catch (error) {
    console.error('❌ Error fetching journal entries:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Void journal entry (creates reversal entry)
 * @param {number} entryId - Entry to void
 * @param {string} reason - Void reason
 * @param {number} userId - User performing void
 * @returns {Promise<Object>} Result
 */
async function voidJournalEntry(entryId, reason, userId) {
  try {
    // Get original entry
    const entryResult = await getJournalEntry(entryId);
    if (!entryResult.success) {
      return entryResult;
    }
    
    const originalEntry = entryResult.data;
    
    if (originalEntry.status === 'void') {
      return { success: false, error: 'Entry is already void' };
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Mark original as void
      await connection.execute(
        'UPDATE journal_entries SET status = ? WHERE id = ?',
        ['void', entryId]
      );
      
      // Create reversal entry (swap debits and credits)
      const reversalLines = originalEntry.lines.map(line => ({
        accountId: line.account_id,
        debit: line.credit,  // Swap
        credit: line.debit,  // Swap
        description: `VOID: ${line.description || ''}`
      }));
      
      await connection.commit();
      connection.release();
      
      // Create reversal entry
      const reversalResult = await createJournalEntry({
        date: new Date(),
        description: `VOID - ${reason}`,
        reference: `VOID-${originalEntry.entry_number}`,
        userId,
        lines: reversalLines
      });
      
      if (!reversalResult.success) {
        return { success: false, error: 'Failed to create reversal entry' };
      }
      
      console.log(`✅ Voided entry ${originalEntry.entry_number}, created reversal ${reversalResult.data.entryNumber}`);
      
      return {
        success: true,
        data: {
          originalEntry: originalEntry.entry_number,
          reversalEntry: reversalResult.data.entryNumber
        }
      };
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error voiding journal entry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get account balance as of a specific date
 * @param {number} accountId - Account ID
 * @param {Date} asOfDate - Date to calculate balance
 * @returns {Promise<Object>} Balance information
 */
async function getAccountBalance(accountId, asOfDate = new Date()) {
  try {
    const account = await Account.getWithBalance(accountId, asOfDate);
    
    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    
    return {
      success: true,
      data: {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        totalDebits: parseFloat(account.total_debit || 0),
        totalCredits: parseFloat(account.total_credit || 0),
        balance: parseFloat(account.balance || 0),
        asOfDate
      }
    };
    
  } catch (error) {
    console.error('❌ Error calculating account balance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get general ledger for an account
 * @param {number} accountId - Account ID
 * @param {Object} filters - Date filters
 * @returns {Promise<Object>} Ledger entries
 */
async function getGeneralLedger(accountId, filters = {}) {
  try {
    const { startDate = null, endDate = null, limit = 100, offset = 0 } = filters;
    
    let query = `
      SELECT * FROM general_ledger
      WHERE account_code IN (SELECT code FROM accounts WHERE id = ?)
        AND status = 'posted'
    `;
    
    const params = [accountId];
    
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date DESC, entry_number DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [entries] = await pool.execute(query, params);
    
    // Calculate running balance
    let runningBalance = 0;
    const account = await Account.getById(accountId);
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);
    
    const entriesWithBalance = entries.reverse().map(entry => {
      const debit = parseFloat(entry.debit || 0);
      const credit = parseFloat(entry.credit || 0);
      
      if (isDebitNormal) {
        runningBalance += (debit - credit);
      } else {
        runningBalance += (credit - debit);
      }
      
      return {
        ...entry,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    }).reverse();
    
    return { success: true, data: entriesWithBalance };
    
  } catch (error) {
    console.error('❌ Error fetching general ledger:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createJournalEntry,
  getJournalEntry,
  getJournalEntries,
  voidJournalEntry,
  getAccountBalance,
  getGeneralLedger,
  validateJournalEntry,
  generateEntryNumber
};
