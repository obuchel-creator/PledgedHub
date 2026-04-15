import React, { useState, useEffect } from 'react';
import './ChartOfAccountsScreen.css';

export function ChartOfAccountsScreen() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, selectedType, searchTerm]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounting/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data || []);
      } else {
        setError('Failed to load accounts');
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(acc => acc.type === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(acc =>
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      'ASSET': '#1976D2',
      'LIABILITY': '#D32F2F',
      'EQUITY': '#388E3C',
      'REVENUE': '#7B1FA2',
      'EXPENSE': '#F57C00'
    };
    return colors[type] || '#666666';
  };

  const getAccountTypeBadge = (type) => {
    const badges = {
      'ASSET': '💰',
      'LIABILITY': '💳',
      'EQUITY': '📊',
      'REVENUE': '📈',
      'EXPENSE': '📉'
    };
    return badges[type] || '◆';
  };

  if (loading) {
    return (
      <div className="coa-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coa-container">
      <div className="coa-header">
        <div>
          <h1>Chart of Accounts</h1>
          <p>Manage and view all accounts in the general ledger</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{accounts.length}</span>
            <span className="stat-label">Total Accounts</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="coa-filters">
        <div className="filter-section">
          <label>Account Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="ASSET">💰 Assets</option>
            <option value="LIABILITY">💳 Liabilities</option>
            <option value="EQUITY">📊 Equity</option>
            <option value="REVENUE">📈 Revenue</option>
            <option value="EXPENSE">📉 Expenses</option>
          </select>
        </div>

        <div className="filter-section">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-results">
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </div>
      </div>

      <div className="coa-content">
        <div className="accounts-table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th className="col-code">Code</th>
                <th className="col-name">Account Name</th>
                <th className="col-type">Type</th>
                <th className="col-balance">Balance</th>
                <th className="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr className="no-data-row">
                  <td colSpan="5">
                    <div className="no-data">
                      {searchTerm || selectedType !== 'all' 
                        ? '❌ No accounts match your search' 
                        : '📋 No accounts found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="account-row">
                    <td className="col-code">
                      <span className="account-code">{account.code}</span>
                    </td>
                    <td className="col-name">
                      <div className="account-name-container">
                        <span className="account-name">{account.name}</span>
                      </div>
                    </td>
                    <td className="col-type">
                      <span className="account-type-badge" style={{ backgroundColor: getAccountTypeColor(account.type) + '20', color: getAccountTypeColor(account.type) }}>
                        {getAccountTypeBadge(account.type)} {account.type}
                      </span>
                    </td>
                    <td className="col-balance">
                      <span className="account-balance">
                        {(account.balance || 0).toLocaleString('en-UG', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </td>
                    <td className="col-action">
                      <button
                        className="view-button"
                        onClick={() => setSelectedAccount(account)}
                        title="View account details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Account Details Modal */}
        {selectedAccount && (
          <div className="modal-overlay" onClick={() => setSelectedAccount(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Account Details</h2>
                <button className="close-button" onClick={() => setSelectedAccount(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <h3>Account Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Code</label>
                      <div className="detail-value">{selectedAccount.code}</div>
                    </div>
                    <div className="detail-item">
                      <label>Name</label>
                      <div className="detail-value">{selectedAccount.name}</div>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <div className="detail-value">
                        <span className="account-type-badge" style={{ backgroundColor: getAccountTypeColor(selectedAccount.type) + '20', color: getAccountTypeColor(selectedAccount.type) }}>
                          {getAccountTypeBadge(selectedAccount.type)} {selectedAccount.type}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Normal Balance</label>
                      <div className="detail-value">{selectedAccount.normal_balance}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Balance Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Current Balance</label>
                      <div className="detail-value balance-highlight">
                        {(selectedAccount.balance || 0).toLocaleString('en-UG', {
                          style: 'currency',
                          currency: 'UGX',
                          minimumFractionDigits: 0
                        })}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div className="detail-value">
                        <span className={`status-badge ${selectedAccount.is_active ? 'active' : 'inactive'}`}>
                          {selectedAccount.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Account Classification</h3>
                  <div className="classification-info">
                    <div className="classification-item">
                      <span className="classification-label">Category:</span>
                      <span className="classification-value">
                        {selectedAccount.type === 'ASSET' && 'Balance Sheet'}
                        {selectedAccount.type === 'LIABILITY' && 'Balance Sheet'}
                        {selectedAccount.type === 'EQUITY' && 'Balance Sheet'}
                        {selectedAccount.type === 'REVENUE' && 'Income Statement'}
                        {selectedAccount.type === 'EXPENSE' && 'Income Statement'}
                      </span>
                    </div>
                    <div className="classification-item">
                      <span className="classification-label">Normal Balance Side:</span>
                      <span className="classification-value">{selectedAccount.normal_balance}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Account Description</h3>
                  <p className="account-description">
                    {selectedAccount.description || 'No description available for this account.'}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setSelectedAccount(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartOfAccountsScreen;


