import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPayoutDashboardScreen.css';

export default function AdminPayoutDashboardScreen() {
  const [creators, setCreators] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('creators');
  const [processingId, setProcessingId] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [creatorsRes, payoutsRes] = await Promise.all([
        axios.get('/api/payouts/admin/all-creators', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/payouts/admin/pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (creatorsRes.data.success) {
        setCreators(creatorsRes.data.data || []);
      }

      if (payoutsRes.data.success) {
        setPendingPayouts(payoutsRes.data.data.payouts || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async (creatorId, amount) => {
    try {
      setProcessingId(creatorId);

      const response = await axios.post(
        '/api/payouts/admin/create',
        { creatorId, amount, bankCode: 'EXIM', payoutMethod: 'bank_transfer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`✅ Payout created successfully! Batch ID: ${response.data.data.batchId}`);
        fetchAllData();
      } else {
        alert(`❌ Error: ${response.data.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompletePayout = async (payoutId) => {
    const ref = prompt('Enter bank reference number:');
    if (!ref) return;

    try {
      const response = await axios.put(
        `/api/payouts/admin/${payoutId}/complete`,
        { referenceNumber: ref },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('✅ Payout marked as completed!');
        fetchAllData();
      }
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error}`);
    }
  };

  const handleCalculateMonthly = async (creatorId, year, month) => {
    try {
      setProcessingId(creatorId);

      const response = await axios.post(
        '/api/payouts/admin/calculate-monthly',
        { creatorId, year, month },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`✅ Earnings calculated! Net: ${response.data.data.netEarnings.toLocaleString()} UGX`);
        fetchAllData();
      }
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.error}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="admin-payout-screen"><div className="loading">⏳ Loading...</div></div>;

  const totalCreators = creators.length;
  const totalPending = pendingPayouts.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalEarned = creators.reduce((sum, c) => sum + (c.lifetime_earnings || 0), 0);

  return (
    <div className="admin-payout-screen">
      <h1>👨‍💼 Admin Payout Dashboard</h1>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Overview */}
      <section className="stats-overview">
        <div className="stat">
          <div className="stat-icon">👥</div>
          <div className="stat-data">
            <span className="label">Total Creators</span>
            <strong className="value">{totalCreators}</strong>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">💰</div>
          <div className="stat-data">
            <span className="label">Lifetime Earnings</span>
            <strong className="value">{Math.round(totalEarned).toLocaleString()} UGX</strong>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">⏳</div>
          <div className="stat-data">
            <span className="label">Pending Payouts</span>
            <strong className="value">{pendingPayouts.length}</strong>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon">📊</div>
          <div className="stat-data">
            <span className="label">Total Pending Amount</span>
            <strong className="value">{Math.round(totalPending).toLocaleString()} UGX</strong>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'creators' ? 'active' : ''}`}
          onClick={() => setActiveTab('creators')}
        >
          👥 Creators ({totalCreators})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Payouts ({pendingPayouts.length})
        </button>
      </div>

      {/* Creators Tab */}
      {activeTab === 'creators' && (
        <section className="creators-section">
          <h2>Creators & Earnings</h2>
          <div className="table-responsive">
            <table className="creators-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Collected</th>
                  <th>Lifetime Earnings</th>
                  <th>Months Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      No creators found
                    </td>
                  </tr>
                ) : (
                  creators.map(creator => (
                    <tr key={creator.id}>
                      <td className="creator-name">
                        <strong>{creator.name}</strong>
                      </td>
                      <td>{creator.email}</td>
                      <td>{creator.phone}</td>
                      <td className="amount">
                        {Math.round(creator.total_collected || 0).toLocaleString()} UGX
                      </td>
                      <td className="amount green">
                        {Math.round(creator.lifetime_earnings || 0).toLocaleString()} UGX
                      </td>
                      <td className="center">{creator.months_active || 0}</td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          title="View Details"
                          disabled={processingId === creator.id}
                        >
                          📋 View
                        </button>
                        <button
                          className="action-btn payout-btn"
                          onClick={() => {
                            const amount = creator.lifetime_earnings || 0;
                            if (amount > 0) {
                              handleCreatePayout(creator.id, amount);
                            } else {
                              alert('⚠️ No pending earnings to pay out');
                            }
                          }}
                          disabled={processingId === creator.id || (creator.lifetime_earnings || 0) === 0}
                        >
                          {processingId === creator.id ? '⏳' : '💸'} Payout
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pending Payouts Tab */}
      {activeTab === 'pending' && (
        <section className="pending-section">
          <h2>Pending Payouts</h2>
          <div className="table-responsive">
            <table className="pending-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Creator</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Bank</th>
                  <th>Pledges</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                      No pending payouts
                    </td>
                  </tr>
                ) : (
                  pendingPayouts.map(payout => (
                    <tr key={payout.id}>
                      <td className="batch-id">
                        <code>{payout.payout_batch_id}</code>
                      </td>
                      <td className="creator-info">
                        <strong>{payout.creator_name}</strong>
                        <br />
                        <small>{payout.creator_phone}</small>
                      </td>
                      <td className="amount green">
                        {Math.round(payout.total_amount).toLocaleString()} UGX
                      </td>
                      <td>
                        <span className={`badge status-${payout.status}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td>
                        {payout.scheduled_date
                          ? new Date(payout.scheduled_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>{payout.bank_name || 'Not set'}</td>
                      <td className="center">{payout.pledge_count}</td>
                      <td className="actions">
                        {payout.status === 'processing' ? (
                          <button
                            className="action-btn complete-btn"
                            onClick={() => handleCompletePayout(payout.id)}
                          >
                            ✅ Mark Done
                          </button>
                        ) : (
                          <span className="status-text">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Instructions */}
      <section className="instructions">
        <h2>📖 Payout Process</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-num">1</div>
            <div className="step-content">
              <h4>Calculate Monthly Earnings</h4>
              <p>System automatically calculates on the 1st of each month</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-num">2</div>
            <div className="step-content">
              <h4>Create Payout</h4>
              <p>Click "Payout" to create payout batch for a creator</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-num">3</div>
            <div className="step-content">
              <h4>Send to Bank</h4>
              <p>Transfer the amount to creator's bank account</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-num">4</div>
            <div className="step-content">
              <h4>Mark Complete</h4>
              <p>Click "Mark Done" and enter bank reference number</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
