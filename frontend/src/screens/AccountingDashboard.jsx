import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountingDashboard.css';

/**
 * Accounting Dashboard - QuickBooks-style financial overview
 * Shows Balance Sheet, Income Statement, AR Aging, and key metrics
 */
function AccountingDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/accounting/reports/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboard(response.data.data);
      } else {
        setError(response.data.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.response?.data?.error || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="accounting-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounting-dashboard">
        <div className="error-container">
          <h3>⚠️ Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboard} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { balanceSheet, incomeYTD, incomeMonth, arAging } = dashboard || {};

  return (
    <div className="accounting-dashboard">
      <header className="dashboard-header">
        <h1>📊 Financial Dashboard</h1>
        <p className="subtitle">QuickBooks-style accounting for PledgeHub</p>
        <button onClick={fetchDashboard} className="btn-refresh">
          🔄 Refresh
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'balance-sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance-sheet')}
        >
          Balance Sheet
        </button>
        <button
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          Income Statement
        </button>
        <button
          className={`tab ${activeTab === 'ar-aging' ? 'active' : ''}`}
          onClick={() => setActiveTab('ar-aging')}
        >
          AR Aging
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Assets</h3>
              <p className="metric-value positive">
                {formatCurrency(balanceSheet?.assets?.total || 0)}
              </p>
              <small>As of {formatDate(balanceSheet?.asOfDate)}</small>
            </div>

            <div className="metric-card">
              <h3>Total Liabilities</h3>
              <p className="metric-value negative">
                {formatCurrency(balanceSheet?.liabilities?.total || 0)}
              </p>
              <small>As of {formatDate(balanceSheet?.asOfDate)}</small>
            </div>

            <div className="metric-card">
              <h3>Total Equity</h3>
              <p className="metric-value">
                {formatCurrency(balanceSheet?.equity?.total || 0)}
              </p>
              <small>As of {formatDate(balanceSheet?.asOfDate)}</small>
            </div>

            <div className="metric-card">
              <h3>Net Income (YTD)</h3>
              <p className={`metric-value ${incomeYTD?.netIncome >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(incomeYTD?.netIncome || 0)}
              </p>
              <small>
                {formatDate(incomeYTD?.startDate)} - {formatDate(incomeYTD?.endDate)}
              </small>
            </div>

            <div className="metric-card">
              <h3>Total Revenue (YTD)</h3>
              <p className="metric-value positive">
                {formatCurrency(incomeYTD?.revenue?.total || 0)}
              </p>
              <small>Year to date</small>
            </div>

            <div className="metric-card">
              <h3>Total Expenses (YTD)</h3>
              <p className="metric-value negative">
                {formatCurrency(incomeYTD?.expenses?.total || 0)}
              </p>
              <small>Year to date</small>
            </div>

            <div className="metric-card">
              <h3>Pledges Receivable</h3>
              <p className="metric-value">
                {formatCurrency(arAging?.summary?.totalReceivable || 0)}
              </p>
              <small>{arAging?.summary?.totalPledges || 0} outstanding pledges</small>
            </div>

            <div className="metric-card alert">
              <h3>Overdue Pledges</h3>
              <p className="metric-value negative">
                {arAging?.summary?.overdueCount || 0}
              </p>
              <small>Require follow-up</small>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <h2>This Month</h2>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-label">Revenue:</span>
                <span className="stat-value positive">
                  {formatCurrency(incomeMonth?.revenue?.total || 0)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Expenses:</span>
                <span className="stat-value negative">
                  {formatCurrency(incomeMonth?.expenses?.total || 0)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Net Income:</span>
                <span className={`stat-value ${incomeMonth?.netIncome >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(incomeMonth?.netIncome || 0)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Profit Margin:</span>
                <span className="stat-value">
                  {incomeMonth?.profitMargin || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet Tab */}
      {activeTab === 'balance-sheet' && balanceSheet && (
        <div className="balance-sheet-tab">
          <h2>Balance Sheet</h2>
          <p className="report-date">As of {formatDate(balanceSheet.asOfDate)}</p>

          <div className="financial-section">
            <h3>Assets</h3>
            <table className="financial-table">
              <tbody>
                {balanceSheet.assets.accounts.map((account) => (
                  <tr key={account.code}>
                    <td>{account.code} - {account.name}</td>
                    <td className="amount">{formatCurrency(account.balance)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Assets</strong></td>
                  <td className="amount"><strong>{formatCurrency(balanceSheet.assets.total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="financial-section">
            <h3>Liabilities</h3>
            <table className="financial-table">
              <tbody>
                {balanceSheet.liabilities.accounts.map((account) => (
                  <tr key={account.code}>
                    <td>{account.code} - {account.name}</td>
                    <td className="amount">{formatCurrency(account.balance)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Liabilities</strong></td>
                  <td className="amount"><strong>{formatCurrency(balanceSheet.liabilities.total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="financial-section">
            <h3>Equity</h3>
            <table className="financial-table">
              <tbody>
                {balanceSheet.equity.accounts.map((account) => (
                  <tr key={account.code}>
                    <td>{account.code} - {account.name}</td>
                    <td className="amount">{formatCurrency(account.balance)}</td>
                  </tr>
                ))}
                <tr>
                  <td>Net Income</td>
                  <td className="amount">{formatCurrency(balanceSheet.equity.netIncome)}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Total Equity</strong></td>
                  <td className="amount"><strong>{formatCurrency(balanceSheet.equity.total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="balance-check">
            {balanceSheet.balanced ? (
              <p className="balanced">✅ Books are balanced (Assets = Liabilities + Equity)</p>
            ) : (
              <p className="unbalanced">⚠️ Warning: Books are not balanced!</p>
            )}
          </div>
        </div>
      )}

      {/* Income Statement Tab */}
      {activeTab === 'income' && incomeYTD && (
        <div className="income-statement-tab">
          <h2>Income Statement (Profit & Loss)</h2>
          <p className="report-date">
            {formatDate(incomeYTD.startDate)} to {formatDate(incomeYTD.endDate)}
          </p>

          <div className="financial-section">
            <h3>Revenue</h3>
            <table className="financial-table">
              <tbody>
                {incomeYTD.revenue.accounts.map((account) => (
                  <tr key={account.code}>
                    <td>{account.code} - {account.name}</td>
                    <td className="amount positive">{formatCurrency(account.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Revenue</strong></td>
                  <td className="amount positive">
                    <strong>{formatCurrency(incomeYTD.revenue.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="financial-section">
            <h3>Expenses</h3>
            <table className="financial-table">
              <tbody>
                {incomeYTD.expenses.accounts.map((account) => (
                  <tr key={account.code}>
                    <td>{account.code} - {account.name}</td>
                    <td className="amount negative">{formatCurrency(account.amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>Total Expenses</strong></td>
                  <td className="amount negative">
                    <strong>{formatCurrency(incomeYTD.expenses.total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="net-income-section">
            <h3>Net Income</h3>
            <p className={`net-income-value ${incomeYTD.netIncome >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(incomeYTD.netIncome)}
            </p>
            <p className="profit-margin">Profit Margin: {incomeYTD.profitMargin}%</p>
          </div>
        </div>
      )}

      {/* AR Aging Tab */}
      {activeTab === 'ar-aging' && arAging && (
        <div className="ar-aging-tab">
          <h2>Accounts Receivable Aging Report</h2>
          <p className="report-date">As of {formatDate(arAging.asOfDate)}</p>

          <div className="aging-summary">
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Total Receivable:</span>
              <span className="amount">{formatCurrency(arAging.summary.totalReceivable)}</span>
            </div>
            <div className="summary-row">
              <span>Total Pledges:</span>
              <span>{arAging.summary.totalPledges}</span>
            </div>
            <div className="summary-row alert">
              <span>Overdue Pledges:</span>
              <span>{arAging.summary.overdueCount}</span>
            </div>
          </div>

          <div className="aging-buckets">
            <h3>Aging Breakdown</h3>
            
            <div className="aging-bucket">
              <h4>Current (Not Yet Due)</h4>
              <p className="bucket-total">{formatCurrency(arAging.aging.current.total)}</p>
              <p className="bucket-count">{arAging.aging.current.pledges.length} pledges</p>
            </div>

            <div className="aging-bucket warning">
              <h4>1-30 Days Overdue</h4>
              <p className="bucket-total">{formatCurrency(arAging.aging.days_1_30.total)}</p>
              <p className="bucket-count">{arAging.aging.days_1_30.pledges.length} pledges</p>
            </div>

            <div className="aging-bucket alert">
              <h4>31-60 Days Overdue</h4>
              <p className="bucket-total">{formatCurrency(arAging.aging.days_31_60.total)}</p>
              <p className="bucket-count">{arAging.aging.days_31_60.pledges.length} pledges</p>
            </div>

            <div className="aging-bucket danger">
              <h4>61-90 Days Overdue</h4>
              <p className="bucket-total">{formatCurrency(arAging.aging.days_61_90.total)}</p>
              <p className="bucket-count">{arAging.aging.days_61_90.pledges.length} pledges</p>
            </div>

            <div className="aging-bucket critical">
              <h4>90+ Days Overdue</h4>
              <p className="bucket-total">{formatCurrency(arAging.aging.days_90_plus.total)}</p>
              <p className="bucket-count">{arAging.aging.days_90_plus.pledges.length} pledges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountingDashboard;
