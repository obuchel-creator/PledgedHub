


import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from './i18n/LanguageContext';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import DrilldownModal from './components/DrilldownModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Utility: Export to Excel
function exportExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, filename);
}

// Utility: Export to PDF
function exportPDF(data, filename) {
  const doc = new jsPDF();
  const keys = Object.keys(data[0] || {});
  let y = 10;
  doc.setFontSize(10);
  doc.text(keys.join(' | '), 10, y);
  y += 8;
  data.forEach(row => {
    doc.text(keys.map(k => String(row[k])).join(' | '), 10, y);
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save(filename);
}
  // Drilldown modal state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownRows, setDrilldownRows] = useState([]);
  const [drilldownColumns, setDrilldownColumns] = useState([]);

  // Drilldown fetcher
  async function openDrilldown(type, value) {
    let url = '';
    let title = '';
    if (type === 'purpose') {
      url = `${API}/drilldown/by-purpose?purpose=${encodeURIComponent(value)}&start=${startDate}&end=${endDate}`;
      title = `Pledges for Purpose: ${value}`;
    } else if (type === 'campaign') {
      url = `${API}/drilldown/by-campaign?campaign=${encodeURIComponent(value)}&start=${startDate}&end=${endDate}`;
      title = `Pledges for Campaign: ${value}`;
    } else if (type === 'donor') {
      url = `${API}/drilldown/by-donor?donor=${encodeURIComponent(value)}&start=${startDate}&end=${endDate}`;
      title = `Pledges by Donor: ${value}`;
    } else if (type === 'status') {
      url = `${API}/drilldown/by-status?status=${encodeURIComponent(value)}&start=${startDate}&end=${endDate}`;
      title = `Pledges with Status: ${value}`;
    } else {
      return;
    }
    setDrilldownTitle(title);
    setDrilldownRows([]);
    setDrilldownColumns([]);
    setDrilldownOpen(true);
    try {
      const res = await axios.get(url);
      const rows = res.data.data || [];
      setDrilldownRows(rows);
      setDrilldownColumns(Object.keys(rows[0] || {}));
    } catch (err) {
      setDrilldownRows([]);
      setDrilldownColumns([]);
    }
  }

const API = '/api/analytics';

function StatCard({ title, value, color }) {
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

export default function AnalyticsDashboard() {
    const { t } = useLanguage();
    // Dark mode state
    const [darkMode, setDarkMode] = useState(() => {
      const stored = localStorage.getItem('dashboardDarkMode');
      return stored ? stored === 'true' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    useEffect(() => {
      document.body.classList.toggle('dark-mode', darkMode);
      localStorage.setItem('dashboardDarkMode', darkMode);
    }, [darkMode]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [purposeBreakdown, setPurposeBreakdown] = useState([]);
  // AI Insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);

  useEffect(() => {
    async function fetchInsights() {
      setInsightsLoading(true);
      setInsightsError(null);
      try {
        const res = await axios.get('/api/analytics/insights');
        setInsights(res.data.data || res.data.insights || res.data);
      } catch (err) {
        setInsightsError('AI insights unavailable');
      } finally {
        setInsightsLoading(false);
      }
    }
    fetchInsights();
  }, [/* optionally add dependencies */]);
  if (loading) return <div className="dashboard-loading">{t('analytics.loading')}</div>;
  if (error) return <div className="dashboard-error">{t('analytics.error')}: {error}</div>;

  // Prepare chart data
  const trendLabels = trends.map(t => t.month);
  const trendPledges = trends.map(t => t.pledges);
  const trendAmounts = trends.map(t => t.amount);

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* Theme Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-secondary" onClick={() => setDarkMode(dm => !dm)}>
          {darkMode ? `${'🌙'} ${t('analytics.darkModeOn')}` : `${'☀️'} ${t('analytics.lightModeOn')}`}
        </button>
      </div>
      {/* AI Insights Section */}
      <div className="dashboard-section" style={{ marginBottom: 24, background: darkMode ? '#23272f' : '#f5f7fa', color: darkMode ? '#f5f7fa' : '#23272f', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <h3 style={{ marginTop: 0 }}>{t('analytics.aiInsights')}</h3>
        {insightsLoading ? (
          <div style={{ color: '#888' }}>{t('analytics.loadingInsights')}</div>
        ) : insightsError ? (
          <div style={{ color: '#e53935' }}>{insightsError}</div>
        ) : insights && (insights.summary || insights.recommendations || insights.trends) ? (
          <div>
            {insights.summary && <div style={{ marginBottom: 8 }}><strong>{t('analytics.summary')}:</strong> {insights.summary}</div>}
            {insights.trends && <div style={{ marginBottom: 8 }}><strong>{t('analytics.trends')}:</strong> {insights.trends}</div>}
            {insights.anomalies && <div style={{ marginBottom: 8 }}><strong>{t('analytics.anomalies')}:</strong> {insights.anomalies}</div>}
            {insights.recommendations && <div style={{ marginBottom: 8 }}><strong>{t('analytics.recommendations')}:</strong> {insights.recommendations}</div>}
          </div>
        ) : (
          <div style={{ color: '#888' }}>{t('analytics.noInsights')}</div>
        )}
      </div>
      <div className={"analytics-dashboard" + (darkMode ? ' dark' : '')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>{t('analytics.title')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: 500 }}>
              {t('analytics.startDate')}:
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ marginLeft: 4, marginRight: 12 }} />
            </label>
            <label style={{ fontWeight: 500 }}>
              {t('analytics.endDate')}:
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ marginLeft: 4 }} />
            </label>
            <button className="btn btn-secondary" style={{ fontSize: '1rem', padding: '0.5rem 1.2rem' }} onClick={() => navigate('/admin')}>← {t('analytics.backToDashboard')}</button>
          </div>
        </div>
        <div className="stat-cards">
          <StatCard title={t('analytics.totalPledges')} value={summary.totalPledges} color="#1976d2" />
          <StatCard title={t('analytics.totalAmount')} value={`UGX ${summary.totalAmount.toLocaleString()}`} color="#388e3c" />
          <StatCard title={t('analytics.paid')} value={summary.paid} color="#43a047" />
          <StatCard title={t('analytics.pending')} value={summary.pending} color="#fbc02d" />
          <StatCard title={t('analytics.overdue')} value={summary.overdue} color="#e53935" />
          <StatCard title={t('analytics.collectionRate')} value={`${summary.collectionRate}%`} color="#0288d1" />
        </div>

        <div className="dashboard-section">
          <h3>{t('analytics.pledgeTrendsMonthly')}</h3>
          <Line
            data={{
              labels: trendLabels,
              datasets: [
                {
                  label: t('analytics.pledgesLabel'),
                  data: trendPledges,
                  borderColor: '#1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  tension: 0.3,
                  fill: true
                },
                {
                  label: t('analytics.amountLabel'),
                  data: trendAmounts,
                  borderColor: '#388e3c',
                  backgroundColor: 'rgba(56, 142, 60, 0.1)',
                  yAxisID: 'y1',
                  tension: 0.3,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              interaction: { mode: 'index', intersect: false },
              stacked: false,
              plugins: { legend: { position: 'top' } },
              scales: {
                y: { beginAtZero: true, title: { display: true, text: t('analytics.pledgesLabel') } },
                y1: {
                  beginAtZero: true,
                  position: 'right',
                  title: { display: true, text: t('analytics.amountLabel') },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>

        {/* Top Donors */}
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{t('analytics.topDonors')}</h3>
            <button className="btn btn-secondary" onClick={() => exportCSV(topDonors, 'top_donors.csv')}>{t('analytics.exportCSV')}</button>
          </div>
          <table className="campaign-table">
            <thead>
              <tr>
                <th>{t('analytics.name')}</th>
                <th>{t('analytics.email')}</th>
                <th>{t('analytics.phone')}</th>
                <th>{t('analytics.pledges')}</th>
                <th>{t('analytics.totalPledged')}</th>
                <th>{t('analytics.totalPaid')}</th>
                <th>{t('analytics.fulfillmentRate')}</th>
              </tr>
            </thead>
            <tbody>
              {topDonors.map(d => (
                <tr key={d.name + d.email} style={{ cursor: 'pointer' }} onClick={() => openDrilldown('donor', d.name)}>
                  <td>{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td>{d.pledgeCount}</td>
                  <td>{d.totalPledged.toLocaleString()}</td>
                  <td>{d.totalPaid.toLocaleString()}</td>
                  <td>{d.fulfillmentRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purpose Breakdown */}
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{t('analytics.pledgesByPurpose')}</h3>
            <button className="btn btn-secondary" onClick={() => exportCSV(purposeBreakdown, 'purpose_breakdown.csv')}>{t('analytics.exportCSV')}</button>
          </div>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Pie
              data={{
                labels: purposeBreakdown.map(p => p.purpose),
                datasets: [
                  {
                    label: 'Total Amount',
                    data: purposeBreakdown.map(p => p.totalAmount),
                    backgroundColor: [
                      '#1976d2', '#388e3c', '#fbc02d', '#e53935', '#0288d1', '#8e24aa', '#ffb300', '#43a047', '#d81b60', '#00acc1'
                    ]
                  }
                ]
              }}
              options={{
                plugins: { legend: { position: 'bottom' } },
                onClick: (evt, elements, chart) => {
                  if (elements && elements.length > 0) {
                    const idx = elements[0].index;
                    const purpose = purposeBreakdown[idx].purpose;
                    openDrilldown('purpose', purpose);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* At-Risk/Overdue Pledges */}
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{t('analytics.atRiskOverdue')}</h3>
            <button className="btn btn-secondary" onClick={() => exportCSV(atRisk, 'at_risk_pledges.csv')}>{t('analytics.exportCSV')}</button>
          </div>
          <table className="campaign-table">
            <thead>
              <tr>
                <th>{t('analytics.donor')}</th>
                <th>{t('analytics.amount')}</th>
                <th>{t('analytics.purpose')}</th>
                <th>{t('analytics.collectionDate')}</th>
                <th>{t('analytics.status')}</th>
                <th>{t('analytics.daysOverdue')}</th>
                <th>{t('analytics.riskLevel')}</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map(p => (
                <tr key={p.id} style={{ color: p.riskLevel === 'high' ? '#e53935' : p.riskLevel === 'medium' ? '#fbc02d' : '#1976d2' }}>
                  <td>{p.donorName}</td>
                  <td>{p.amount.toLocaleString()}</td>
                  <td>{p.purpose}</td>
                  <td>{p.collectionDate}</td>
                  <td>{p.status}</td>
                  <td>{p.daysOverdue}</td>
                  <td>{p.riskLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export/Print All */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', margin: '2rem 0 0' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>{t('analytics.printDashboard')}</button>
          <button className="btn btn-secondary" onClick={() => exportCSV([...trends, ...campaigns, ...topDonors, ...purposeBreakdown, ...atRisk], 'full_analytics.csv')}>{t('analytics.exportAllCSV')}</button>
          <button className="btn btn-secondary" onClick={() => exportExcel([...trends, ...campaigns, ...topDonors, ...purposeBreakdown, ...atRisk], 'full_analytics.xlsx')}>{t('analytics.exportAllExcel')}</button>
          <button className="btn btn-secondary" onClick={() => exportPDF([...trends, ...campaigns, ...topDonors, ...purposeBreakdown, ...atRisk], 'full_analytics.pdf')}>{t('analytics.exportAllPDF')}</button>
        </div>

        {/* Campaign Breakdown */}
        <h3>{t('analytics.campaignBreakdown')}</h3>
        <table className="campaign-table">
          <thead>
            <tr>
              <th>{t('analytics.campaign')}</th>
              <th>{t('analytics.pledges')}</th>
              <th>{t('analytics.amount')} (UGX)</th>
              <th>{t('analytics.paid')}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.campaign} style={{ cursor: 'pointer' }} onClick={() => openDrilldown('campaign', c.campaign)}>
                <td>{c.campaign}</td>
                <td>{c.pledges}</td>
                <td>{c.amount.toLocaleString()}</td>
                <td>{c.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DrilldownModal open={drilldownOpen} onClose={() => setDrilldownOpen(false)} title={drilldownTitle} rows={drilldownRows} columns={drilldownColumns} />
    </div>
  );
}
