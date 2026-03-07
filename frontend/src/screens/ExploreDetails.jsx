import React, { useEffect, useState } from 'react';
import PledgeStatusPie from '../components/PledgeStatusPie';
import ExportTableCSV from '../components/ExportTableCSV';
import ExportTablePDF from '../components/ExportTablePDF';
import NotificationToast from '../components/NotificationToast';
import useRealtimeEvents from '../hooks/useRealtimeEvents';
import { useTablePreferences } from '../context/TablePreferencesContext';
import { getTopDonors, getAtRiskPledges, getCampaigns, getPayments, getUpcomingReminders, getAIInsights, getPledgesByStatus, getCollectionTrends } from '../services/api';
import CollectionTrendsBar from '../components/CollectionTrendsBar';
import { CustomLineChart, CustomAreaChart, CustomRadarChart } from '../components/CustomCharts';
import CustomWidget from '../components/CustomWidget';
import { Link } from 'react-router-dom';
import DrilldownModal from '../components/DrilldownModal';
import { FaUserFriends, FaBell, FaMoneyBillWave, FaChartPie } from 'react-icons/fa';
import './ExploreDetails.css';

// ── Helpers ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'paid' ? 'status-badge--paid' :
    s === 'overdue' ? 'status-badge--overdue' :
    s === 'pending' ? 'status-badge--pending' :
    'status-badge--default';
  return <span className={`status-badge ${cls}`}>{status || '—'}</span>;
}

function RankBadge({ index }) {
  const cls =
    index === 0 ? 'rank-badge--1' :
    index === 1 ? 'rank-badge--2' :
    index === 2 ? 'rank-badge--3' :
    'rank-badge--other';
  return <span className={`rank-badge ${cls}`}>{index + 1}</span>;
}

function AmountCell({ value }) {
  return (
    <span className="amount-cell">
      <span className="amount-cell__currency">UGX</span>
      {Number(value).toLocaleString()}
    </span>
  );
}

function EmptyRow({ cols, label = 'No data available' }) {
  return (
    <tr className="explore-table__empty">
      <td colSpan={cols}>
        <span className="explore-table__empty-icon">📭</span>
        {label}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────
export default function ExploreDetails() {
  const [selectedRows, setSelectedRows] = useState([]);
  function toggleRow(table, id) {
    setSelectedRows(prev => {
      const key = `${table}:${id}`;
      return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    });
  }
  function clearSelection() { setSelectedRows([]); }
  function isSelected(table, id) { return selectedRows.includes(`${table}:${id}`); }

  const realtimeEvents = useRealtimeEvents();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', campaign: '', donor: '', dateFrom: '', dateTo: '' });
  useTablePreferences('exploreDetails');

  function filterRows(rows, keys) {
    let filtered = rows;
    if (search) {
      filtered = filtered.filter(row => keys.some(k => String(row[k] || '').toLowerCase().includes(search.toLowerCase())));
    }
    if (filters.status) filtered = filtered.filter(r => r.status === filters.status);
    if (filters.campaign) filtered = filtered.filter(r => r.campaign === filters.campaign);
    if (filters.donor) filtered = filtered.filter(r => r.donor_name === filters.donor);
    if (filters.dateFrom) filtered = filtered.filter(r => new Date(r.date || r.due_date || r.collection_date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(r => new Date(r.date || r.due_date || r.collection_date) <= new Date(filters.dateTo));
    return filtered;
  }

  const [notif, setNotif] = useState({ message: '', type: 'info' });
  const [drilldown, setDrilldown] = useState({ open: false, title: '', rows: [], columns: [] });

  function handleDrilldown(title, rows) {
    setDrilldown({ open: true, title, rows, columns: [] });
  }

  const [topDonors, setTopDonors] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [aiInsights, setAIInsights] = useState([]);
  const [pledgeStatus, setPledgeStatus] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError('');
      try {
        const [donorsRes, atRiskRes, campaignsRes, paymentsRes, remindersRes, aiInsightsRes, pledgeStatusRes, trendsRes] = await Promise.all([
          getTopDonors(5),
          getAtRiskPledges(),
          getCampaigns('active'),
          getPayments({ limit: 5 }),
          getUpcomingReminders(),
          getAIInsights(),
          getPledgesByStatus(),
          getCollectionTrends('30d'),
        ]);
        setTopDonors(Array.isArray(donorsRes?.data) ? donorsRes.data : []);
        setAtRisk(Array.isArray(atRiskRes?.data) ? atRiskRes.data : []);
        const campaignRows = Array.isArray(campaignsRes?.data)
          ? campaignsRes.data
          : Array.isArray(campaignsRes?.campaigns)
          ? campaignsRes.campaigns
          : [];
        setCampaigns(campaignRows);
        setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
        const allReminders = remindersRes?.reminders
          ? [
              ...(remindersRes.reminders.sevenDays?.pledges || []),
              ...(remindersRes.reminders.threeDays?.pledges || []),
              ...(remindersRes.reminders.dueToday?.pledges || []),
            ]
          : [];
        setReminders(allReminders);
        setAIInsights(Array.isArray(aiInsightsRes?.insights) ? aiInsightsRes.insights : []);
        setPledgeStatus(Array.isArray(pledgeStatusRes?.data) ? pledgeStatusRes.data : []);
        setTrends(Array.isArray(trendsRes?.data) ? trendsRes.data : []);
      } catch (err) {
        setError(err?.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b', fontSize: '0.95rem' }}>
      Loading details…
    </div>
  );
  if (error) return (
    <div style={{ color: '#ef4444', textAlign: 'center', padding: '3rem 2rem', fontSize: '0.95rem' }}>
      {error}
    </div>
  );

  function campaignProgress(c) {
    const raised = Number(c.raised_amount || c.raisedAmount || 0);
    const goal = Number(c.goal_amount || c.goalAmount || 1);
    const percent = Math.min(100, Math.round((raised / goal) * 100));
    const isFull = percent >= 100;
    return (
      <div className="progress-wrap">
        <div className="progress-bar">
          <div
            className={`progress-bar__fill${isFull ? ' progress-bar__fill--full' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="progress-label">{percent}%</span>
      </div>
    );
  }

  function overdueClass(days) {
    const d = Number(days);
    if (d > 14) return 'overdue-cell--critical';
    if (d > 0) return 'overdue-cell--warning';
    return 'overdue-cell--ok';
  }

  const statusBar = () => {
    if (!pledgeStatus.length) return null;
    const total = pledgeStatus.reduce((sum, s) => sum + Number(s.count || 0), 0);
    return (
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        {pledgeStatus.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: '8px',
              background: s.status === 'paid' ? '#4ade80' : s.status === 'overdue' ? '#ef4444' : '#fbbf24',
              borderRadius: '6px',
              width: `${(Number(s.count) / total) * 100}%`,
              marginBottom: '0.3rem',
            }} />
            <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>
              <StatusBadge status={s.status} /> &nbsp;{s.count}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="explore-details" style={{ marginTop: '1.5rem' }}>

      {/* Page Hero Header */}
      <div className="explore-details__header">
        <div className="explore-details__header-text">
          <h2>Explore Details</h2>
          <p>Live dashboard — donors, campaigns, payments, reminders & insights</p>
        </div>
        <span className="explore-details__header-badge">Live data</span>
      </div>

      {/* Filter Bar */}
      <div className="explore-filter-bar">
        <div className="live-badge">
          <span className="live-badge__label">Live</span>
          {realtimeEvents.length > 0 && (
            <span className="live-badge__count" aria-label={`${realtimeEvents.length} new events`}>
              {realtimeEvents.length}
            </span>
          )}
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search donors, campaigns, pledges, payments…"
          aria-label="Global search"
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
        <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} aria-label="Date from" />
        <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} aria-label="Date to" />
        <button
          className="filter-clear-btn"
          onClick={() => setFilters({ status: '', campaign: '', donor: '', dateFrom: '', dateTo: '' })}
        >
          Clear Filters
        </button>
      </div>

      {/* Widget Row */}
      <div className="explore-widget-row">
        <CustomWidget title="Top Donors" value={topDonors.length} icon={<FaUserFriends />} color="#2563eb" />
        <CustomWidget title="At-Risk Pledges" value={atRisk.length} icon={<FaBell />} color="#ef4444" />
        <CustomWidget title="Active Campaigns" value={campaigns.length} icon={<FaChartPie />} color="#fbbf24" />
        <CustomWidget title="Recent Payments" value={payments.length} icon={<FaMoneyBillWave />} color="#10b981" />
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <section>
          <div className="section-header">
            <h3>
              <span className="section-icon">✦</span>
              AI Insights
            </h3>
          </div>
          <ul className="ai-insights-list">
            {aiInsights.map((ins, i) => <li key={i}>{ins}</li>)}
          </ul>
        </section>
      )}

      {/* Pledge Status Breakdown */}
      {pledgeStatus.length > 0 && (
        <section>
          <div className="section-header">
            <h3>
              <span className="section-icon">⬡</span>
              Pledge Status Breakdown
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 280, maxWidth: 400 }}>
              <PledgeStatusPie data={pledgeStatus.map(s => ({ status: s.status, count: Number(s.count) }))} />
              <CustomRadarChart data={pledgeStatus.map(s => ({ status: s.status, value: Number(s.count) }))} categories="status" valueKey="value" color="#6366f1" />
            </div>
            <div style={{ flex: '2 1 320px', minWidth: 220 }}>
              {statusBar()}
              <CustomLineChart data={pledgeStatus.map((s) => ({ x: s.status, y: Number(s.count) }))} xKey="x" yKey="y" color="#2563eb" />
            </div>
          </div>
        </section>
      )}

      {/* Collection Trends */}
      {trends.length > 0 && (
        <section>
          <div className="section-header">
            <h3>
              <span className="section-icon">↗</span>
              Collection Trends (Last 30 Days)
            </h3>
          </div>
          <CollectionTrendsBar data={trends.map(t => ({ date: t.date, collected: Number(t.collected), pledged: Number(t.pledged) }))} />
        </section>
      )}

      {/* Top Donors Table */}
      <section>
        <div className="section-header">
          <h3>
            <span className="section-icon"><FaUserFriends size={14} /></span>
            Top Donors
          </h3>
          <div className="export-btn-group">
            <ExportTableCSV data={filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount'])} filename="top-donors.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount'])} columns={['donor_name', 'pledge_count', 'total_amount']} fileName="top-donors.pdf" title="Top Donors" />
          </div>
        </div>
        {selectedRows.filter(k => k.startsWith('donors:')).length > 0 && (
          <div className="bulk-action-bar" role="region" aria-label="Bulk actions for donors">
            <span aria-live="polite">{selectedRows.filter(k => k.startsWith('donors:')).length} selected</span>
            <button onClick={() => setNotif({ message: 'Bulk export coming soon', type: 'info' })} aria-label="Bulk export selected donors">Bulk Export</button>
            <button onClick={clearSelection} aria-label="Clear selection">Clear</button>
          </div>
        )}
        <table className="explore-table" aria-label="Top Donors" tabIndex={0}>
          <caption className="visually-hidden">Top Donors Table</caption>
          <thead>
            <tr>
              <th scope="col">
                <input type="checkbox" aria-label="Select all donors"
                  checked={filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount']).every(d => isSelected('donors', d.donor_name))}
                  onChange={() => filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount']).forEach(d => toggleRow('donors', d.donor_name))}
                />
              </th>
              <th scope="col">#</th>
              <th scope="col">Donor Name</th>
              <th scope="col">Pledges</th>
              <th scope="col">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount']).length === 0
              ? <EmptyRow cols={5} label="No top donors found" />
              : filterRows(topDonors, ['donor_name', 'pledge_count', 'total_amount']).map((d, index) => (
                <tr key={index} tabIndex={0}
                  aria-label={`View details for ${d.donor_name || 'Anonymous'}`}
                  onClick={() => handleDrilldown('Donor Details', [d])}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrilldown('Donor Details', [d]); }}>
                  <td>
                    <input type="checkbox" checked={isSelected('donors', d.donor_name)} onChange={() => toggleRow('donors', d.donor_name)} aria-label={`Select ${d.donor_name || 'Anonymous'}`} />
                  </td>
                  <td><RankBadge index={index} /></td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{d.donor_name || 'Anonymous'}</td>
                  <td style={{ color: '#475569' }}>{d.pledge_count}</td>
                  <td><AmountCell value={d.total_amount} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>

      {/* At-Risk Pledges Table */}
      <section>
        <div className="section-header">
          <h3>
            <span className="section-icon"><FaBell size={13} /></span>
            At-Risk Pledges
          </h3>
          <div className="export-btn-group">
            <ExportTableCSV data={filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue'])} filename="at-risk-pledges.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue'])} columns={['donor_name', 'amount', 'collection_date', 'days_overdue']} fileName="at-risk-pledges.pdf" title="At-Risk Pledges" />
          </div>
        </div>
        {selectedRows.filter(k => k.startsWith('atRisk:')).length > 0 && (
          <div className="bulk-action-bar" role="region" aria-label="Bulk actions for at-risk pledges">
            <span aria-live="polite">{selectedRows.filter(k => k.startsWith('atRisk:')).length} selected</span>
            <button onClick={() => setNotif({ message: 'Bulk reminder coming soon', type: 'info' })} aria-label="Send bulk reminder">Bulk Reminder</button>
            <button onClick={clearSelection} aria-label="Clear selection">Clear</button>
          </div>
        )}
        <table className="explore-table" aria-label="At-Risk Pledges" tabIndex={0}>
          <caption className="visually-hidden">At-Risk Pledges Table</caption>
          <thead>
            <tr>
              <th scope="col">
                <input type="checkbox" aria-label="Select all at-risk pledges"
                  checked={filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue']).every(p => isSelected('atRisk', p.collection_date))}
                  onChange={() => filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue']).forEach(p => toggleRow('atRisk', p.collection_date))}
                />
              </th>
              <th scope="col">Donor</th>
              <th scope="col">Amount</th>
              <th scope="col">Due Date</th>
              <th scope="col">Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue']).length === 0
              ? <EmptyRow cols={5} label="No at-risk pledges" />
              : filterRows(atRisk, ['donor_name', 'amount', 'collection_date', 'days_overdue']).map((p, i) => (
                <tr key={i} tabIndex={0}
                  aria-label={`At-risk pledge by ${p.donor_name || 'Anonymous'}`}
                  onClick={() => handleDrilldown('Pledge Details', [p])}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrilldown('Pledge Details', [p]); }}>
                  <td>
                    <input type="checkbox" checked={isSelected('atRisk', p.collection_date)} onChange={() => toggleRow('atRisk', p.collection_date)} aria-label={`Select pledge due ${p.collection_date}`} />
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.donor_name || 'Anonymous'}</td>
                  <td><AmountCell value={p.amount} /></td>
                  <td style={{ color: '#475569' }}>{new Date(p.collection_date).toLocaleDateString()}</td>
                  <td>
                    <span className={overdueClass(p.days_overdue)}>
                      {p.days_overdue > 0 ? `${p.days_overdue} days` : '—'}
                    </span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>

      {/* Active Campaigns Table */}
      <section>
        <div className="section-header">
          <h3>
            <span className="section-icon"><FaChartPie size={13} /></span>
            Active Campaigns
          </h3>
          <div className="export-btn-group">
            <ExportTableCSV data={filterRows(campaigns, ['title', 'goal_amount', 'raised_amount'])} filename="active-campaigns.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(campaigns, ['title', 'goal_amount', 'raised_amount'])} columns={['title', 'goal_amount', 'raised_amount']} columnHeaders={['Campaign', 'Goal (UGX)', 'Raised (UGX)']} fileName="active-campaigns.pdf" title="Active Campaigns" />
          </div>
        </div>
        <table className="explore-table" aria-label="Active Campaigns" tabIndex={0}>
          <caption className="visually-hidden">Active Campaigns Table</caption>
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Goal</th>
              <th scope="col">Raised</th>
              <th scope="col">Progress</th>
              <th scope="col">Link</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(campaigns, ['title', 'goal_amount', 'raised_amount']).length === 0
              ? <EmptyRow cols={5} label="No active campaigns" />
              : filterRows(campaigns, ['title', 'goal_amount', 'raised_amount']).map((c, i) => (
                <tr key={i} tabIndex={0}
                  aria-label={`Campaign: ${c.title}`}
                  onClick={() => handleDrilldown('Campaign Details', [c])}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrilldown('Campaign Details', [c]); }}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.title || c.name}</td>
                  <td><AmountCell value={c.goal_amount || c.goalAmount || 0} /></td>
                  <td><AmountCell value={c.raised_amount || c.raisedAmount || 0} /></td>
                  <td>{campaignProgress(c)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <Link to={`/campaigns/${c.id}`} style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.83rem' }}>View →</Link>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>

      {/* Recent Payments Table */}
      <section>
        <div className="section-header">
          <h3>
            <span className="section-icon"><FaMoneyBillWave size={13} /></span>
            Recent Payments
          </h3>
          <div className="export-btn-group">
            <ExportTableCSV data={filterRows(payments, ['donor_name', 'amount', 'method', 'date'])} filename="recent-payments.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(payments, ['donor_name', 'amount', 'method', 'date'])} columns={['donor_name', 'amount', 'method', 'date']} fileName="recent-payments.pdf" title="Recent Payments" />
          </div>
        </div>
        <table className="explore-table" aria-label="Recent Payments" tabIndex={0}>
          <caption className="visually-hidden">Recent Payments Table</caption>
          <thead>
            <tr>
              <th scope="col">Donor</th>
              <th scope="col">Amount</th>
              <th scope="col">Method</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(payments, ['donor_name', 'amount', 'method', 'date']).length === 0
              ? <EmptyRow cols={4} label="No recent payments" />
              : filterRows(payments, ['donor_name', 'amount', 'method', 'date']).map((p, i) => (
                <tr key={i} tabIndex={0}
                  aria-label={`Payment by ${p.donor_name || 'Anonymous'}`}
                  onClick={() => handleDrilldown('Payment Details', [p])}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrilldown('Payment Details', [p]); }}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.donor_name || 'Anonymous'}</td>
                  <td><AmountCell value={p.amount} /></td>
                  <td>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                      {p.method || '—'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>

      {/* Upcoming Reminders Table */}
      <section>
        <div className="section-header">
          <h3>
            <span className="section-icon"><FaBell size={13} /></span>
            Upcoming Reminders
          </h3>
          <div className="export-btn-group">
            <ExportTableCSV data={filterRows(reminders, ['donor_name', 'amount', 'due_date', 'status'])} filename="upcoming-reminders.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(reminders, ['donor_name', 'amount', 'due_date', 'status'])} columns={['donor_name', 'amount', 'due_date', 'status']} fileName="upcoming-reminders.pdf" title="Upcoming Reminders" />
          </div>
        </div>
        <table className="explore-table" aria-label="Upcoming Reminders" tabIndex={0}>
          <caption className="visually-hidden">Upcoming Reminders Table</caption>
          <thead>
            <tr>
              <th scope="col">Donor</th>
              <th scope="col">Amount</th>
              <th scope="col">Due Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(reminders, ['donor_name', 'amount', 'due_date', 'status']).length === 0
              ? <EmptyRow cols={4} label="No upcoming reminders" />
              : filterRows(reminders, ['donor_name', 'amount', 'due_date', 'status']).map((r, i) => (
                <tr key={i} tabIndex={0}
                  aria-label={`Reminder for ${r.donor_name || 'Anonymous'}`}
                  onClick={() => handleDrilldown('Reminder Details', [r])}
                  onKeyDown={e => { if (e.key === 'Enter') handleDrilldown('Reminder Details', [r]); }}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.donor_name || 'Anonymous'}</td>
                  <td><AmountCell value={r.amount} /></td>
                  <td style={{ color: '#64748b' }}>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </section>

      {/* 30-Day Collection Area Chart */}
      {trends.length > 0 && (
        <section>
          <div className="section-header">
            <h3>
              <span className="section-icon">↗</span>
              30-Day Collection Area Chart
            </h3>
          </div>
          <CustomAreaChart
            data={trends.map(t => ({ date: t.date, collected: Number(t.collected) }))}
            xKey="date"
            yKey="collected"
            color="#10b981"
          />
        </section>
      )}

      {/* Drilldown Modal */}
      <DrilldownModal
        open={drilldown.open}
        onClose={() => setDrilldown(d => ({ ...d, open: false }))}
        title={drilldown.title}
        rows={drilldown.rows}
        columns={drilldown.columns}
      />

      {/* Notification Toast */}
      <NotificationToast
        message={notif.message}
        type={notif.type}
        onClose={() => setNotif({ message: '', type: 'info' })}
      />
    </div>
  );
}
