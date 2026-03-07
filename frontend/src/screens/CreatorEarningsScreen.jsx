import { useState, useEffect } from 'react';
import axios from 'axios';
import './CreatorEarningsScreen.css';

export default function CreatorEarningsScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payouts/my-dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDashboard(response.data.data);
      } else {
        setError('Failed to load earnings data');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="earnings-screen"><div className="loading">📊 Loading earnings...</div></div>;
  if (error) return <div className="earnings-screen"><div className="error">❌ {error}</div></div>;
  if (!dashboard) return <div className="earnings-screen"><div className="error">❌ No earnings data</div></div>;

  const current = dashboard.currentMonth;
  const stats = dashboard.allTimeStats;
  const pending = dashboard.pendingPayouts || [];

  return (
    <div className="earnings-screen">
      <h1>💰 Your Earnings Dashboard</h1>

      {/* Current Month Summary */}
      <section className="earnings-summary">
        <h2>📅 Current Month Summary</h2>
        
        {current ? (
          <div className="summary-cards">
            <div className="card pledges-card">
              <div className="card-icon">📥</div>
              <div className="card-content">
                <label>Pledges Received</label>
                <p className="amount">{Math.round(current.total_pledges_received || 0).toLocaleString()} UGX</p>
              </div>
            </div>

            <div className="card deductions-card">
              <div className="card-icon">💸</div>
              <div className="card-content">
                <label>Fees & Commission</label>
                <p className="amount red">
                  -{Math.round(
                    (current.total_fees_deducted || 0) + 
                    (current.total_commission_deducted || 0)
                  ).toLocaleString()} UGX
                </p>
                <small>
                  Fees: {Math.round(current.total_fees_deducted || 0).toLocaleString()} UGX<br/>
                  Commission: {Math.round(current.total_commission_deducted || 0).toLocaleString()} UGX
                </small>
              </div>
            </div>

            <div className="card earnings-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <label>Your Net Earnings</label>
                <p className="amount green">{Math.round(current.net_earnings || 0).toLocaleString()} UGX</p>
                <small>{current.payment_count || 0} payments received</small>
              </div>
            </div>

            <div className="card status-card">
              <div className="card-icon">📋</div>
              <div className="card-content">
                <label>Status</label>
                <p className="badge">{current.status || 'Calculating'}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data">No earnings this month yet</p>
        )}
      </section>

      {/* All-Time Statistics */}
      <section className="all-time-stats">
        <h2>📈 All-Time Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <span className="stat-label">Total Campaigns</span>
            <strong className="stat-value">{stats.total_pledges_created || 0}</strong>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <span className="stat-label">Total Collected</span>
            <strong className="stat-value">{Math.round(stats.total_pledges_received || 0).toLocaleString()} UGX</strong>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✔️</div>
            <span className="stat-label">Total Paid Out</span>
            <strong className="stat-value">{Math.round(stats.total_paid_out || 0).toLocaleString()} UGX</strong>
          </div>
          <div className="stat-card green-card">
            <div className="stat-icon">💰</div>
            <span className="stat-label">Lifetime Earnings</span>
            <strong className="stat-value">{Math.round(stats.lifetime_earnings || 0).toLocaleString()} UGX</strong>
          </div>
        </div>
      </section>

      {/* Pending Payouts */}
      {pending && pending.length > 0 && (
        <section className="pending-payouts">
          <h2>⏳ Pending Payouts ({pending.length})</h2>
          <div className="table-responsive">
            <table className="payouts-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Bank</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(payout => (
                  <tr key={payout.id}>
                    <td className="batch-id">{payout.payout_batch_id}</td>
                    <td className="amount">{Math.round(payout.total_amount).toLocaleString()} UGX</td>
                    <td>
                      <span className={`badge status-${payout.status}`}>
                        {payout.status === 'pending' ? '⏱️' : '📤'} {payout.status}
                      </span>
                    </td>
                    <td>{payout.scheduled_date ? new Date(payout.scheduled_date).toLocaleDateString() : '-'}</td>
                    <td>{payout.bank_name || 'Not set'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <h2>📖 How Commission Works</h2>
        <div className="explanation">
          <div className="step">
            <div className="step-number">1️⃣</div>
            <div className="step-content">
              <h3>Donor Sends</h3>
              <p>Someone donates via Airtel/MTN</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2️⃣</div>
            <div className="step-content">
              <h3>Mobile Money Fee (2-3%)</h3>
              <p>Automatically deducted by Airtel/MTN</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3️⃣</div>
            <div className="step-content">
              <h3>Bank Deposit Fee (~1%)</h3>
              <p>Charged by the receiving bank</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4️⃣</div>
            <div className="step-content">
              <h3>Platform Commission (10%)</h3>
              <p>PledgedHub takes 10% to cover operations</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">5️⃣</div>
            <div className="step-content">
              <h3>You Receive</h3>
              <p>The remaining amount is yours!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bank Settings CTA */}
      <section className="bank-settings-cta">
        <h2>🏦 Bank Account Settings</h2>
        <p>Make sure your bank account is updated so we can send your payouts correctly.</p>
        <button className="cta-button">
          ➡️ Update Bank Settings
        </button>
      </section>
    </div>
  );
}


