import React, { useState, useEffect } from 'react';
import './AccountingDashboardScreen.css';

export function AccountingDashboardScreen() {
  const [reports, setReports] = useState({
    balanceSheet: null,
    incomeStatement: null,
    trialBalance: null,
    summary: null,
    aiInsights: [],
    aiSuggestions: [],
    aiForecast: null
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [financeQuery, setFinanceQuery] = useState('');
  const [financeQueryResult, setFinanceQueryResult] = useState(null);
  const [financeQueryLoading, setFinanceQueryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports();
  }, [asOfDate]);

  const fetchReports = async () => {
    setLoading(true);
    setAiLoading(true);
    try {
      const token = localStorage.getItem('pledgedhub_token') || localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch dashboard and trial balance in parallel
      const [dashRes, trialBalRes] = await Promise.all([
        fetch('/api/accounting/reports/dashboard', { headers }),
        fetch('/api/accounting/reports/trial-balance', { headers }).catch(() => ({ json: async () => ({ success: false }) }))
      ]);

      const dashData = await dashRes.json();
      const trialBalData = await trialBalRes.json();

      if (dashData.success) {
        const bs = dashData.data.balanceSheet || null;
        const is = dashData.data.incomeYTD || null;

        // Compute key metrics from available data
        const netIncome = is?.summary?.netIncome || 0;
        const totalRevenue = is?.summary?.totalRevenue || 0;
        const keyMetrics = {
          netIncome,
          currentRatio: bs?.liabilities?.total > 0
            ? ((bs.assets?.total || 0) / bs.liabilities.total).toFixed(2)
            : 'N/A',
          debtToEquity: bs?.equity?.total > 0
            ? ((bs.liabilities?.total || 0) / bs.equity.total).toFixed(2)
            : 'N/A',
          profitMargin: totalRevenue > 0
            ? ((netIncome / totalRevenue) * 100).toFixed(1) + '%'
            : '0%',
        };

        // Build summary with the nested structure the render uses
        const summary = bs ? {
          balanceSheet: bs,
          keyMetrics,
        } : null;

        // Add computed validation to balance sheet
        const bsWithValidation = bs ? {
          ...bs,
          validation: {
            difference: Math.abs((bs.assets?.total || 0) - (bs.totalLiabilitiesAndEquity || 0)),
          },
        } : null;

        // Normalize trial balance with validation wrapper
        let trialBalance = null;
        if (trialBalData.success && trialBalData.data) {
          trialBalance = {
            ...trialBalData.data,
            validation: {
              balancesDifference: trialBalData.data.difference || 0,
            },
          };
        }

        setReports({
          balanceSheet: bsWithValidation,
          incomeStatement: is,
          trialBalance,
          summary,
          aiInsights: dashData.data.aiInsights || [],
          aiSuggestions: dashData.data.aiSuggestions || [],
          aiForecast: dashData.data.aiForecast || null,
        });
      } else {
        setAiError(dashData.error || 'Failed to load accounting data');
      }
    } catch (err) {
      setError('Failed to load accounting reports');
      setAiError('Failed to load AI dashboard data');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };
  // Finance Query Handler
  const handleFinanceQuery = async (e) => {
    e.preventDefault();
    setFinanceQueryLoading(true);
    setFinanceQueryResult(null);
    setAiError('');
    try {
      const token = localStorage.getItem('pledgedhub_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch('/api/ai/finance-query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: financeQuery })
      });
      const data = await res.json();
      if (data.success) {
        setFinanceQueryResult(data.response);
      } else {
        setAiError(data.error || 'AI query failed');
      }
    } catch (err) {
      setAiError('AI query failed');
    } finally {
      setFinanceQueryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="accounting-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading accounting reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-container">
            {/* AI Insights, Suggestions, Forecasts */}
            <div className="ai-section">
              <h2>AI-Powered Financial Insights</h2>
              {aiLoading ? <div>Loading AI insights...</div> : null}
              {aiError && <div className="error-message">{aiError}</div>}
              {reports.aiInsights && reports.aiInsights.length > 0 && (
                <div className="ai-insights">
                  <h4>Insights</h4>
                  <ul>
                    {reports.aiInsights.map((insight, idx) => (
                      <li key={idx} className={`insight-${insight.type}`}> <strong>{insight.title}:</strong> {insight.message} </li>
                    ))}
                  </ul>
                </div>
              )}
              {reports.aiSuggestions && reports.aiSuggestions.length > 0 && (
                <div className="ai-suggestions">
                  <h4>Suggestions</h4>
                  <ul>
                    {reports.aiSuggestions.map((s, idx) => (
                      <li key={idx}><strong>{s.title}:</strong> {s.description} <span style={{color:'#888'}}>({s.priority})</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {reports.aiForecast && reports.aiForecast.forecast && (
                <div className="ai-forecast">
                  <h4>Revenue Forecast (Next 6 Months)</h4>
                  <ul>
                    {reports.aiForecast.forecast.map((f, idx) => (
                      <li key={idx}>{f.period}: UGX {f.revenue.toLocaleString('en-UG')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Finance Query UI (admin/staff only) */}
            <div className="finance-query-section">
              <h3>Ask AI About Your Finances</h3>
              <form onSubmit={handleFinanceQuery} style={{marginBottom:'1em'}}>
                <input
                  type="text"
                  value={financeQuery}
                  onChange={e => setFinanceQuery(e.target.value)}
                  placeholder="e.g. What was our net income last quarter?"
                  style={{width:'60%',padding:'0.5em'}}
                  required
                />
                <button type="submit" disabled={financeQueryLoading} style={{marginLeft:'1em'}}>Ask</button>
              </form>
              {financeQueryLoading && <div>Thinking...</div>}
              {financeQueryResult && (
                <div className="ai-query-result" style={{background:'#f6f8fa',padding:'1em',borderRadius:'6px'}}>
                  <strong>AI Response:</strong>
                  <div>{financeQueryResult}</div>
                </div>
              )}
            </div>
      <div className="accounting-header">
        <div>
          <h1>Accounting Dashboard</h1>
          <p>Financial reports and account management</p>
        </div>
        <div className="header-actions">
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="date-picker"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="accounting-tabs">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`tab-button ${activeTab === 'balance-sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance-sheet')}
        >
          ⚖️ Balance Sheet
        </button>
        <button
          className={`tab-button ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          📈 Income Statement
        </button>
        <button
          className={`tab-button ${activeTab === 'trial-balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('trial-balance')}
        >
          ✓ Trial Balance
        </button>
      </div>

      <div className="accounting-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && reports.summary && (
          <div className="summary-section">
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Total Assets</div>
                <div className="metric-value">
                  {reports.summary.balanceSheet.assets.total.toLocaleString('en-UG', {
                    style: 'currency',
                    currency: 'UGX',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Total Liabilities</div>
                <div className="metric-value">
                  {reports.summary.balanceSheet.liabilities.total.toLocaleString('en-UG', {
                    style: 'currency',
                    currency: 'UGX',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Total Equity</div>
                <div className="metric-value">
                  {reports.summary.balanceSheet.equity.total.toLocaleString('en-UG', {
                    style: 'currency',
                    currency: 'UGX',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>

              <div className="metric-card highlight">
                <div className="metric-label">Net Income</div>
                <div className="metric-value positive">
                  {reports.summary.keyMetrics.netIncome.toLocaleString('en-UG', {
                    style: 'currency',
                    currency: 'UGX',
                    minimumFractionDigits: 0
                  })}
                </div>
              </div>
            </div>

            <div className="key-metrics">
              <h3>Key Financial Metrics</h3>
              <div className="metrics-table">
                <div className="metric-row">
                  <span className="metric-name">Current Ratio</span>
                  <span className="metric-value-small">{reports.summary.keyMetrics.currentRatio}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-name">Debt to Equity</span>
                  <span className="metric-value-small">{reports.summary.keyMetrics.debtToEquity}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-name">Profit Margin</span>
                  <span className="metric-value-small">{reports.summary.keyMetrics.profitMargin}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Tab */}
        {activeTab === 'balance-sheet' && reports.balanceSheet && (
          <div className="balance-sheet-section">
            <div className="sheet-container">
              <div className="sheet-column">
                <h3>Assets</h3>
                {reports.balanceSheet.assets.accounts.map((account) => (
                  <div key={account.code} className="account-row">
                    <span>{account.code} - {account.name}</span>
                    <span className="amount">
                      {(account.balance || 0).toLocaleString('en-UG', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                ))}
                <div className="account-total">
                  <span>TOTAL ASSETS</span>
                  <span className="amount">
                    {reports.balanceSheet.assets.total.toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>

              <div className="sheet-column">
                <h3>Liabilities & Equity</h3>
                
                <div>
                  <h4>Liabilities</h4>
                  {reports.balanceSheet.liabilities.accounts.map((account) => (
                    <div key={account.code} className="account-row">
                      <span>{account.code} - {account.name}</span>
                      <span className="amount">
                        {(account.balance || 0).toLocaleString('en-UG', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  ))}
                  <div className="account-subtotal">
                    <span>TOTAL LIABILITIES</span>
                    <span className="amount">
                      {reports.balanceSheet.liabilities.total.toLocaleString('en-UG', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h4>Equity</h4>
                  {reports.balanceSheet.equity.accounts.map((account) => (
                    <div key={account.code} className="account-row">
                      <span>{account.code} - {account.name}</span>
                      <span className="amount">
                        {(account.balance || 0).toLocaleString('en-UG', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  ))}
                  <div className="account-subtotal">
                    <span>TOTAL EQUITY</span>
                    <span className="amount">
                      {reports.balanceSheet.equity.total.toLocaleString('en-UG', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                <div className="account-total" style={{ marginTop: '20px' }}>
                  <span>TOTAL LIABILITIES + EQUITY</span>
                  <span className="amount">
                    {(reports.balanceSheet.liabilities.total + reports.balanceSheet.equity.total).toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="validation-check">
              {reports.balanceSheet.validation.difference < 0.01 ? (
                <div className="check-pass">✓ Balance Sheet is balanced (Assets = Liabilities + Equity)</div>
              ) : (
                <div className="check-fail">✗ Balance Sheet is unbalanced by {reports.balanceSheet.validation.difference.toLocaleString('en-UG')}</div>
              )}
            </div>
          </div>
        )}

        {/* Income Statement Tab */}
        {activeTab === 'income' && reports.incomeStatement && (
          <div className="income-statement-section">
            <h3>Income Statement</h3>

            <div className="income-section">
              <h4>Revenues</h4>
              {reports.incomeStatement.revenues.accounts.map((account) => (
                <div key={account.code} className="account-row">
                  <span>{account.code} - {account.name}</span>
                  <span className="amount revenue">
                    +{(account.balance || 0).toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              ))}
              <div className="account-subtotal">
                <span>TOTAL REVENUES</span>
                <span className="amount revenue">
                  +{reports.incomeStatement.summary.totalRevenue.toLocaleString('en-UG', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>

            <div className="income-section">
              <h4>Expenses</h4>
              {reports.incomeStatement.expenses.accounts.length === 0 ? (
                <div className="no-data">No expenses recorded</div>
              ) : (
                reports.incomeStatement.expenses.accounts.map((account) => (
                  <div key={account.code} className="account-row">
                    <span>{account.code} - {account.name}</span>
                    <span className="amount expense">
                      -{(account.balance || 0).toLocaleString('en-UG', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                ))
              )}
              <div className="account-subtotal">
                <span>TOTAL EXPENSES</span>
                <span className="amount expense">
                  -{reports.incomeStatement.summary.totalExpenses.toLocaleString('en-UG', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>

            <div className="account-total" style={{ marginTop: '20px' }}>
              <span>NET INCOME</span>
              <span className={`amount ${reports.incomeStatement.summary.netIncome >= 0 ? 'revenue' : 'expense'}`}>
                {reports.incomeStatement.summary.netIncome.toLocaleString('en-UG', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </span>
            </div>
          </div>
        )}

        {/* Trial Balance Tab */}
        {activeTab === 'trial-balance' && reports.trialBalance && (
          <div className="trial-balance-section">
            <h3>Trial Balance</h3>
            <div className="trial-balance-table">
              <div className="table-header">
                <div className="col-code">Code</div>
                <div className="col-name">Account Name</div>
                <div className="col-debit">Debits</div>
                <div className="col-credit">Credits</div>
              </div>
              {reports.trialBalance.accounts.map((account) => (
                <div key={account.code} className="table-row">
                  <div className="col-code">{account.code}</div>
                  <div className="col-name">{account.name}</div>
                  <div className="col-debit">
                    {(account.total_debit || 0).toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                  <div className="col-credit">
                    {(account.total_credit || 0).toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                </div>
              ))}
              <div className="table-total">
                <div className="col-code"></div>
                <div className="col-name"><strong>TOTALS</strong></div>
                <div className="col-debit">
                  <strong>
                    {reports.trialBalance.totals.totalDebits.toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </strong>
                </div>
                <div className="col-credit">
                  <strong>
                    {reports.trialBalance.totals.totalCredits.toLocaleString('en-UG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </strong>
                </div>
              </div>
            </div>

            <div className="validation-check">
              {reports.trialBalance.validation.balancesDifference < 0.01 ? (
                <div className="check-pass">✓ Trial Balance is balanced (Total Debits = Total Credits)</div>
              ) : (
                <div className="check-fail">✗ Trial Balance is unbalanced by {reports.trialBalance.validation.balancesDifference.toLocaleString('en-UG')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountingDashboardScreen;


