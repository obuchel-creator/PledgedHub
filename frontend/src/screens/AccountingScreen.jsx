import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import './AccountingScreen.css';

export default function AccountingScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Dashboard State
  const [financialData, setFinancialData] = useState({
    assets: 0,
    liabilities: 0,
    equity: 0,
    revenue: 0,
    expenses: 0,
    netIncome: 0
  });

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { account: '', debit: '', credit: '', description: '' }
    ]
  });

  // Chart of Accounts State
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    description: ''
  });

  // Reports State
  const [reportType, setReportType] = useState('balance-sheet');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAccountingData();
    }
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounting/reports/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data.data || {});
      }
    } catch (error) {
      showToast('error', 'Failed to fetch accounting data');
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const response = await fetch('/api/accounting/journal-entries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJournalEntries(data.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch journal entries');
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const response = await fetch('/api/accounting/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data || []);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch accounts');
    }
  };

  const handleCreateJournalEntry = async () => {
    try {
      // Validate entry
      const debits = newEntry.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
      const credits = newEntry.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

      if (Math.abs(debits - credits) > 0.01) {
        showToast('error', 'Debits must equal credits');
        return;
      }

      const response = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry)
      });

      if (response.ok) {
        showToast('success', 'Journal entry created successfully');
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
          lines: [{ account: '', debit: '', credit: '', description: '' }]
        });
        fetchJournalEntries();
      } else {
        showToast('error', 'Failed to create journal entry');
      }
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      });

      if (response.ok) {
        showToast('success', 'Account created successfully');
        setNewAccount({ code: '', name: '', type: 'ASSET', description: '' });
        fetchChartOfAccounts();
      } else {
        showToast('error', 'Failed to create account');
      }
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      const response = await fetch(`/api/accounting/reports/${reportType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data);
      } else {
        showToast('error', 'Failed to generate report');
      }
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message, duration: 3000 });
  };

  const addJournalLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { account: '', debit: '', credit: '', description: '' }]
    });
  };

  const updateJournalLine = (index, field, value) => {
    const updatedLines = [...newEntry.lines];
    updatedLines[index][field] = value;
    setNewEntry({ ...newEntry, lines: updatedLines });
  };

  const removeJournalLine = (index) => {
    setNewEntry({
      ...newEntry,
      lines: newEntry.lines.filter((_, i) => i !== index)
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="accounting-unauthorized">
        <div className="unauthorized-content">
          <h2>Access Denied</h2>
          <p>Only administrators can access the accounting module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-page">
      <header className="accounting-header">
        <h1>QuickBooks-Style Accounting</h1>
        <p>Manage your financial records with double-entry bookkeeping</p>
      </header>

      {/* Tab Navigation */}
      <div className="accounting-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => { setActiveTab('journal'); fetchJournalEntries(); }}
        >
          📖 Journal Entries
        </button>
        <button
          className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => { setActiveTab('accounts'); fetchChartOfAccounts(); }}
        >
          📑 Chart of Accounts
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <section className="tab-content">
          <div className="accounting-grid">
            {/* Balance Sheet Cards */}
            <div className="financial-card assets">
              <h3>Assets</h3>
              <p className="amount">{formatCurrency(financialData.assets)}</p>
              <span className="label">Total Assets</span>
            </div>

            <div className="financial-card liabilities">
              <h3>Liabilities</h3>
              <p className="amount">{formatCurrency(financialData.liabilities)}</p>
              <span className="label">Total Liabilities</span>
            </div>

            <div className="financial-card equity">
              <h3>Equity</h3>
              <p className="amount">{formatCurrency(financialData.equity)}</p>
              <span className="label">Owner's Equity</span>
            </div>

            <div className="financial-card revenue">
              <h3>Revenue</h3>
              <p className="amount">{formatCurrency(financialData.revenue)}</p>
              <span className="label">Total Revenue</span>
            </div>

            <div className="financial-card expenses">
              <h3>Expenses</h3>
              <p className="amount">{formatCurrency(financialData.expenses)}</p>
              <span className="label">Total Expenses</span>
            </div>

            <div className="financial-card net-income">
              <h3>Net Income</h3>
              <p className={`amount ${financialData.netIncome >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(financialData.netIncome)}
              </p>
              <span className="label">P&L Result</span>
            </div>
          </div>

          {/* Accounting Equation */}
          <div className="accounting-equation">
            <h3>Accounting Equation</h3>
            <div className="equation-display">
              <div className="equation-item">
                <span className="equation-label">Assets</span>
                <span className="equation-value">{formatCurrency(financialData.assets)}</span>
              </div>
              <span className="equation-operator">=</span>
              <div className="equation-item">
                <span className="equation-label">Liabilities</span>
                <span className="equation-value">{formatCurrency(financialData.liabilities)}</span>
              </div>
              <span className="equation-operator">+</span>
              <div className="equation-item">
                <span className="equation-label">Equity</span>
                <span className="equation-value">{formatCurrency(financialData.equity)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Journal Entries Tab */}
      {activeTab === 'journal' && (
        <section className="tab-content">
          <div className="journal-section">
            <h2>Create Journal Entry</h2>
            <form className="journal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="entry-date">Date</label>
                  <input
                    id="entry-date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="entry-ref">Reference</label>
                  <input
                    id="entry-ref"
                    type="text"
                    placeholder="e.g., CHECK-001"
                    value={newEntry.reference}
                    onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="entry-desc">Description</label>
                <textarea
                  id="entry-desc"
                  placeholder="Describe this journal entry"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  rows="2"
                />
              </div>

              {/* Journal Lines */}
              <div className="journal-lines">
                <h3>Journal Lines</h3>
                {newEntry.lines.map((line, index) => (
                  <div key={index} className="journal-line">
                    <input
                      type="text"
                      placeholder="Account"
                      value={line.account}
                      onChange={(e) => updateJournalLine(index, 'account', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Debit"
                      value={line.debit}
                      onChange={(e) => updateJournalLine(index, 'debit', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Credit"
                      value={line.credit}
                      onChange={(e) => updateJournalLine(index, 'credit', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                    />
                    {newEntry.lines.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeJournalLine(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addJournalLine}
                >
                  + Add Line
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateJournalEntry}
              >
                Save Journal Entry
              </button>
            </form>

            {/* Journal Entries List */}
            <div className="entries-list">
              <h2>Recent Journal Entries</h2>
              {journalEntries.length === 0 ? (
                <p className="empty-message">No journal entries yet</p>
              ) : (
                <table className="entries-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Description</th>
                      <th>Debit</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>{entry.reference}</td>
                        <td>{entry.description}</td>
                        <td className="amount">{formatCurrency(entry.debit_total || 0)}</td>
                        <td className="amount">{formatCurrency(entry.credit_total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'accounts' && (
        <section className="tab-content">
          <div className="accounts-section">
            <h2>Create New Account</h2>
            <form className="account-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="account-code">Account Code</label>
                  <input
                    id="account-code"
                    type="text"
                    placeholder="1000"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="account-name">Account Name</label>
                  <input
                    id="account-name"
                    type="text"
                    placeholder="e.g., Cash"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="account-type">Type</label>
                  <select
                    id="account-type"
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  >
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="account-desc">Description</label>
                <textarea
                  id="account-desc"
                  placeholder="Account description"
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                  rows="2"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateAccount}
              >
                Create Account
              </button>
            </form>

            {/* Chart of Accounts List */}
            <div className="accounts-list">
              <h2>Chart of Accounts</h2>
              {accounts.length === 0 ? (
                <p className="empty-message">No accounts configured</p>
              ) : (
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="code">{account.code}</td>
                        <td>{account.name}</td>
                        <td className="type">{account.type}</td>
                        <td>{account.description}</td>
                        <td className="amount">{formatCurrency(account.balance || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <section className="tab-content">
          <div className="reports-section">
            <h2>Financial Reports</h2>
            <div className="report-controls">
              <div className="form-group">
                <label htmlFor="report-type">Select Report Type</label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="balance-sheet">Balance Sheet</option>
                  <option value="income-statement">Income Statement (P&L)</option>
                  <option value="cash-flow">Cash Flow Statement</option>
                  <option value="trial-balance">Trial Balance</option>
                  <option value="general-ledger">General Ledger</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleGenerateReport}
                disabled={reportLoading}
              >
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>

            {reportData && (
              <div className="report-view">
                <h3>{reportType.replace('-', ' ').toUpperCase()}</h3>
                <div className="report-content">
                  {reportType === 'balance-sheet' && (
                    <div className="balance-sheet">
                      <div className="sheet-section">
                        <h4>Assets</h4>
                        {reportData.assets?.map((item) => (
                          <div key={item.id} className="item-row">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="total-row">
                          <span>Total Assets</span>
                          <span>{formatCurrency(reportData.total_assets)}</span>
                        </div>
                      </div>

                      <div className="sheet-section">
                        <h4>Liabilities</h4>
                        {reportData.liabilities?.map((item) => (
                          <div key={item.id} className="item-row">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="total-row">
                          <span>Total Liabilities</span>
                          <span>{formatCurrency(reportData.total_liabilities)}</span>
                        </div>
                      </div>

                      <div className="sheet-section">
                        <h4>Equity</h4>
                        {reportData.equity?.map((item) => (
                          <div key={item.id} className="item-row">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="total-row">
                          <span>Total Equity</span>
                          <span>{formatCurrency(reportData.total_equity)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'income-statement' && (
                    <div className="income-statement">
                      <div className="statement-section">
                        <h4>Revenue</h4>
                        {reportData.revenues?.map((item) => (
                          <div key={item.id} className="item-row">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="total-row">
                          <span>Total Revenue</span>
                          <span>{formatCurrency(reportData.total_revenue)}</span>
                        </div>
                      </div>

                      <div className="statement-section">
                        <h4>Expenses</h4>
                        {reportData.expenses?.map((item) => (
                          <div key={item.id} className="item-row">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="total-row">
                          <span>Total Expenses</span>
                          <span>{formatCurrency(reportData.total_expenses)}</span>
                        </div>
                      </div>

                      <div className="net-income-row">
                        <span>Net Income</span>
                        <span className={reportData.net_income >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(reportData.net_income)}
                        </span>
                      </div>
                    </div>
                  )}

                  {reportType === 'trial-balance' && (
                    <table className="trial-balance-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Debit</th>
                          <th>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.accounts?.map((account) => (
                          <tr key={account.id}>
                            <td>{account.name}</td>
                            <td className="amount">{formatCurrency(account.debit)}</td>
                            <td className="amount">{formatCurrency(account.credit)}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td>Total</td>
                          <td className="amount">{formatCurrency(reportData.total_debits)}</td>
                          <td className="amount">{formatCurrency(reportData.total_credits)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


