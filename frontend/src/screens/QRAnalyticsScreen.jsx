import React, { useEffect, useMemo, useState } from 'react';
import {
  getQRCodeAnalytics,
  getQRCodeDashboardStats
} from '../services/api';
import '../styles/QRAnalyticsScreen.css';

export default function QRAnalyticsScreen() {
  const [filters, setFilters] = useState({
    pledgeId: '',
    provider: 'all',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedProvider = filters.provider === 'all' ? '' : filters.provider;

  const formattedFilters = useMemo(() => {
    const params = {};
    if (filters.pledgeId) params.pledgeId = filters.pledgeId;
    if (normalizedProvider) params.provider = normalizedProvider;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [filters, normalizedProvider]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResult, analyticsResult] = await Promise.all([
        getQRCodeDashboardStats(filters.pledgeId ? { pledgeId: filters.pledgeId } : {}),
        getQRCodeAnalytics(formattedFilters)
      ]);

      if (statsResult && statsResult.success === false) {
        setError(statsResult.error || 'Failed to load QR stats');
        setStats(null);
      } else {
        setStats(statsResult || null);
      }

      if (analyticsResult && analyticsResult.success === false) {
        setError(analyticsResult.error || 'Failed to load QR analytics');
        setRows([]);
      } else {
        setRows(Array.isArray(analyticsResult) ? analyticsResult : []);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load QR analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="qr-analytics-screen">
      <header className="qr-analytics-hero">
        <div className="qr-analytics-hero__content">
          <p className="qr-analytics-hero__eyebrow">QR Intelligence</p>
          <h1 className="qr-analytics-hero__title">QR Payment Analytics</h1>
          <p className="qr-analytics-hero__subtitle">
            Track scans, conversions, and revenue across campaigns and providers.
          </p>
        </div>
      </header>

      <section className="qr-analytics-panel">
        <div className="qr-analytics-filters">
          <div className="qr-analytics-field">
            <label htmlFor="qr-pledge" className="qr-analytics-label">Pledge ID</label>
            <input
              id="qr-pledge"
              type="number"
              value={filters.pledgeId}
              onChange={(event) => setFilters((prev) => ({ ...prev, pledgeId: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="qr-analytics-field">
            <label htmlFor="qr-provider" className="qr-analytics-label">Provider</label>
            <select
              id="qr-provider"
              value={filters.provider}
              onChange={(event) => setFilters((prev) => ({ ...prev, provider: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
            </select>
          </div>

          <div className="qr-analytics-field">
            <label htmlFor="qr-start" className="qr-analytics-label">Start Date</label>
            <input
              id="qr-start"
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>

          <div className="qr-analytics-field">
            <label htmlFor="qr-end" className="qr-analytics-label">End Date</label>
            <input
              id="qr-end"
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>

          <button className="qr-analytics-action" onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="qr-analytics-error">{error}</div>}

        <div className="qr-analytics-metrics">
          <div className="qr-analytics-metric">
            <div className="label">Total QR Codes</div>
            <div className="value">{stats?.total_qr_codes || 0}</div>
          </div>
          <div className="qr-analytics-metric">
            <div className="label">Total Scans</div>
            <div className="value">{stats?.total_scans || 0}</div>
          </div>
          <div className="qr-analytics-metric">
            <div className="label">Paid via QR</div>
            <div className="value">{stats?.paid_qr_codes || 0}</div>
          </div>
          <div className="qr-analytics-metric">
            <div className="label">QR Revenue</div>
            <div className="value">UGX {(stats?.amount_from_qr || 0).toLocaleString()}</div>
          </div>
          <div className="qr-analytics-metric">
            <div className="label">Conversion Rate</div>
            <div className="value">{stats?.conversion_rate_percent || 0}%</div>
          </div>
        </div>

        <div className="qr-analytics-table">
          <div className="qr-analytics-table__header">
            <h2>Provider Breakdown</h2>
            <span className="qr-analytics-table__hint">Grouped by provider</span>
          </div>

          {rows.length === 0 ? (
            <div className="qr-analytics-empty">No analytics data for the selected filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>QR Generated</th>
                  <th>Scans</th>
                  <th>Avg Scans/QR</th>
                  <th>Converted</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.provider || 'unknown'}-${index}`}>
                    <td>{(row.provider || 'unknown').toUpperCase()}</td>
                    <td>{row.total_qr_generated || 0}</td>
                    <td>{row.total_scans || 0}</td>
                    <td>{Number(row.avg_scans_per_qr || 0).toFixed(1)}</td>
                    <td>{row.qr_converted_to_paid || 0}</td>
                    <td>UGX {(row.total_qr_revenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
