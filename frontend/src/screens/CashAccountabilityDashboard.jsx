/**
 * Cash Accountability Dashboard
 * Admin view for tracking cash collections, verifications, and deposits
 */

import React, { useState, useEffect } from 'react';
import './CashAccountabilityDashboard.css';

const CashAccountabilityDashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dashboard, setDashboard] = useState(null);
  const [pending, setPending] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({ approved: true, notes: '' });

  useEffect(() => {
    fetchDashboard();
  }, [month, year]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const dashRes = await fetch(
        `/api/cash-payments/dashboard?year=${year}&month=${month}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const pendRes = await fetch(
        `/api/cash-payments/pending/list`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const accRes = await fetch(
        `/api/cash-payments/accountability?year=${year}&month=${month}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!dashRes.ok) throw new Error('Failed to fetch dashboard');
      if (!pendRes.ok) throw new Error('Failed to fetch pending');
      if (!accRes.ok) throw new Error('Failed to fetch accountability');

      const dashData = await dashRes.json();
      const pendData = await pendRes.json();
      const accData = await accRes.json();

      setDashboard(dashData.data);
      setPending(pendData.data?.deposits || []);
      setCollectors(accData.data?.collectors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (depositId, approved, notes) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/cash-payments/${depositId}/verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ approved, verificationNotes: notes })
        }
      );

      if (!res.ok) throw new Error('Verification failed');

      setVerifyModal(false);
      setSelectedDeposit(null);
      fetchDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeposit = async (depositId, bankRef) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/cash-payments/${depositId}/deposit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bankReference: bankRef, depositDate: new Date() })
        }
      );

      if (!res.ok) throw new Error('Deposit marking failed');

      fetchDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !dashboard) {
    return <div className="cash-dashboard loading">Loading accountability data...</div>;
  }

  const summary = dashboard?.summary || {};
  const discrepancies = dashboard?.discrepancies || {};
  const topCollectors = dashboard?.top_collectors || [];

  return (
    <div className="cash-dashboard">
      <div className="cash-header">
        <h1>💰 Cash Payment Accountability</h1>
        <p>Track all cash collections, verifications, and deposits</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Month/Year Selector */}
      <div className="month-selector">
        <input
          type="number"
          min="2025"
          max={new Date().getFullYear()}
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          placeholder="Year"
        />
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2025, i).toLocaleDateString('en-US', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-label">Total Collected</div>
          <div className="card-value">
            {(parseFloat(summary.total_collected) || 0).toLocaleString()} UGX
          </div>
          <div className="card-subtext">
            {summary.total_deposits || 0} deposits
          </div>
        </div>

        <div className="summary-card verified">
          <div className="card-label">✅ Verified</div>
          <div className="card-value">
            {(parseFloat(summary.verified_amount) || 0).toLocaleString()} UGX
          </div>
          <div className="card-subtext">Ready for processing</div>
        </div>

        <div className="summary-card pending">
          <div className="card-label">⏳ Pending</div>
          <div className="card-value">
            {(parseFloat(summary.pending_amount) || 0).toLocaleString()} UGX
          </div>
          <div className="card-subtext">Awaiting verification</div>
        </div>

        <div className="summary-card deposited">
          <div className="card-label">🏦 Deposited</div>
          <div className="card-value">
            {(parseFloat(summary.deposited_amount) || 0).toLocaleString()} UGX
          </div>
          <div className="card-subtext">In bank accounts</div>
        </div>

        <div className="summary-card warning">
          <div className="card-label">📍 Undeposited</div>
          <div className="card-value">
            {(parseFloat(summary.verified_not_deposited) || 0).toLocaleString()} UGX
          </div>
          <div className="card-subtext">Verified, not yet banked</div>
        </div>

        {discrepancies.unresolved_count > 0 && (
          <div className="summary-card alert">
            <div className="card-label">⚠️ Discrepancies</div>
            <div className="card-value">{discrepancies.unresolved_count}</div>
            <div className="card-subtext">
              Variance: {discrepancies.total_variance?.toLocaleString()} UGX
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Verification ({pending.length})
        </button>
        <button
          className={`tab ${activeTab === 'collectors' ? 'active' : ''}`}
          onClick={() => setActiveTab('collectors')}
        >
          👥 Collectors
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content overview">
          <div className="overview-grid">
            <div className="overview-section">
              <h3>📊 Top Collectors</h3>
              <div className="collectors-mini-list">
                {topCollectors.slice(0, 5).map((collector) => (
                  <div key={collector.id} className="collector-mini-item">
                    <div className="collector-info">
                      <div className="collector-name">{collector.name}</div>
                      <div className="collector-meta">
                        {collector.collections} collections
                      </div>
                    </div>
                    <div className="collector-amount">
                      {(parseFloat(collector.collected_amount) || 0).toLocaleString()} UGX
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h3>🎯 Key Metrics</h3>
              <div className="metrics-list">
                <div className="metric">
                  <span className="metric-label">Active Collectors:</span>
                  <span className="metric-value">{summary.active_collectors || 0}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Verification Cycle:</span>
                  <span className="metric-value">
                    {summary.avg_verification_days?.toFixed(1) || 'N/A'} days avg
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Rejection Rate:</span>
                  <span className="metric-value">
                    {summary.rejected_amount ? (
                      parseFloat(summary.rejected_amount).toLocaleString()
                    ) : (
                      'None'
                    )} UGX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content pending">
          {pending.length === 0 ? (
            <div className="empty-state">
              <p>✅ No pending verifications!</p>
            </div>
          ) : (
            <div className="pending-table">
              <table>
                <thead>
                  <tr>
                    <th>Collector</th>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Collection Date</th>
                    <th>Days Pending</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((deposit) => (
                    <tr key={deposit.id} className="pending-row">
                      <td className="collector-col">
                        <strong>{deposit.collector_name}</strong>
                        <br />
                        <small>{deposit.collector_phone}</small>
                      </td>
                      <td>{deposit.donor_name}</td>
                      <td className="amount">
                        {parseFloat(deposit.collected_amount).toLocaleString()} UGX
                      </td>
                      <td>
                        {new Date(deposit.collection_date).toLocaleDateString()}
                      </td>
                      <td className={`days-pending ${deposit.days_pending > 3 ? 'overdue' : ''}`}>
                        {deposit.days_pending} days
                      </td>
                      <td className="actions">
                        <button
                          className="btn-verify"
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setVerifyForm({ approved: true, notes: '' });
                            setVerifyModal(true);
                          }}
                        >
                          ✓ Verify
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setVerifyForm({ approved: false, notes: '' });
                            setVerifyModal(true);
                          }}
                        >
                          ✗ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Collectors Tab */}
      {activeTab === 'collectors' && (
        <div className="tab-content collectors">
          {collectors.length === 0 ? (
            <div className="empty-state">
              <p>No collector data for this month</p>
            </div>
          ) : (
            <div className="collectors-grid">
              {collectors.map((collector) => (
                <div key={collector.collected_by} className="collector-card">
                  <div className="card-header">
                    <h4>{collector.collector_name}</h4>
                    <p className="phone">{collector.collector_phone}</p>
                  </div>

                  <div className="stats-grid">
                    <div className="stat">
                      <span className="stat-value">
                        {collector.total_collections}
                      </span>
                      <span className="stat-label">Collections</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {(parseFloat(collector.pending_amount) || 0).toLocaleString()}
                      </span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat success">
                      <span className="stat-value">
                        {(parseFloat(collector.verified_amount) || 0).toLocaleString()}
                      </span>
                      <span className="stat-label">Verified</span>
                    </div>
                    <div className="stat warning">
                      <span className="stat-value">
                        {(parseFloat(collector.verified_not_deposited) || 0).toLocaleString()}
                      </span>
                      <span className="stat-label">Not Deposited</span>
                    </div>
                  </div>

                  <div className="total-collected">
                    <strong>Total Collected:</strong>
                    <span>
                      {(parseFloat(collector.pending_amount || 0) +
                        parseFloat(collector.verified_amount || 0) +
                        parseFloat(collector.rejected_amount || 0)
                      ).toLocaleString()} UGX
                    </span>
                  </div>

                  {collector.verified_not_deposited > 0 && (
                    <button
                      className="btn-deposit-now"
                      onClick={() => {
                        const ref = prompt('Enter bank reference number:');
                        if (ref) {
                          handleDeposit(collector.collected_by, ref);
                        }
                      }}
                    >
                      🏦 Deposit {parseFloat(collector.verified_not_deposited).toLocaleString()} UGX
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verify Modal */}
      {verifyModal && selectedDeposit && (
        <div className="modal-overlay" onClick={() => setVerifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {verifyForm.approved ? '✓ Verify' : '✗ Reject'} Cash Payment
            </h3>

            <div className="modal-details">
              <p><strong>Amount:</strong> {parseFloat(selectedDeposit.collected_amount).toLocaleString()} UGX</p>
              <p><strong>Collector:</strong> {selectedDeposit.collector_name}</p>
              <p><strong>Donor:</strong> {selectedDeposit.donor_name}</p>
              <p><strong>Collection Date:</strong> {new Date(selectedDeposit.collection_date).toLocaleDateString()}</p>
            </div>

            <textarea
              className="verification-notes"
              placeholder="Add verification notes..."
              value={verifyForm.notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
              rows="3"
            />

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setVerifyModal(false)}
              >
                Cancel
              </button>
              <button
                className={`btn-confirm ${verifyForm.approved ? 'success' : 'danger'}`}
                onClick={() => handleVerify(
                  selectedDeposit.id,
                  verifyForm.approved,
                  verifyForm.notes
                )}
              >
                {verifyForm.approved ? '✓ Verify' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashAccountabilityDashboard;
