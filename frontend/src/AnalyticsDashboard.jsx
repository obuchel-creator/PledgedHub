


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
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    // Date state
    const today = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(oneMonthAgo);
    const [endDate, setEndDate] = useState(today);
    
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
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [creditMetrics, setCreditMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [datePreset, setDatePreset] = useState('month');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Handle date preset changes
  const handleDatePreset = (preset) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start;
    
    switch(preset) {
      case 'today':
        start = end;
        break;
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'quarter':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    setDatePreset(preset);
    setStartDate(start);
    setEndDate(end);
    setShowCustomDates(false);
  };
  
  // AI Insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(null);

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API}/summary?start=${startDate}&end=${endDate}`);
        setSummary(response.data.data || response.data);
        
        const trendsRes = await axios.get(`${API}/trends?start=${startDate}&end=${endDate}`);
        setTrends(trendsRes.data.data || []);
        
        const campaignsRes = await axios.get(`${API}/campaigns?start=${startDate}&end=${endDate}`);
        setCampaigns(campaignsRes.data.data || []);
        
        const donorsRes = await axios.get(`${API}/top-donors?start=${startDate}&end=${endDate}`);
        setTopDonors(donorsRes.data.data || []);
        
        const purposeRes = await axios.get(`${API}/purpose-breakdown?start=${startDate}&end=${endDate}`);
        setPurposeBreakdown(purposeRes.data.data || []);
        
        // NEW: Fetch payment methods
        try {
          const paymentRes = await axios.get(`${API}/payment-methods?start=${startDate}&end=${endDate}`);
          setPaymentMethods(paymentRes.data.data || []);
        } catch (err) {
          console.warn('Payment methods data unavailable:', err);
          setPaymentMethods([]);
        }
        
        // NEW: Fetch credit metrics
        try {
          const creditRes = await axios.get(`${API}/credit-metrics?start=${startDate}&end=${endDate}`);
          setCreditMetrics(creditRes.data.data || null);
        } catch (err) {
          console.warn('Credit metrics unavailable:', err);
          setCreditMetrics(null);
        }

        // NEW: Fetch at-risk pledges
        try {
          const atRiskRes = await axios.get(`${API}/at-risk?start=${startDate}&end=${endDate}`);
          setAtRisk(atRiskRes.data.data || []);
        } catch (err) {
          console.warn('At-risk data unavailable:', err);
          setAtRisk([]);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyticsData();
  }, [startDate, endDate]);

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
  }, [startDate, endDate]);
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
      {/* AI Insights Section - PROMINENT */}
      <div className="dashboard-section" style={{ 
        marginBottom: 24, 
        background: 'linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%)',
        borderLeft: '6px solid #2563eb',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>💡</div>
          <h3 style={{ margin: 0, color: '#1e40af' }}>AI-Powered Insights & Recommendations</h3>
        </div>
        
        {insightsLoading ? (
          <div style={{ color: '#1e40af', fontStyle: 'italic' }}>🔄 Analyzing your data...</div>
        ) : insightsError ? (
          <div style={{ color: '#dc2626' }}>⚠️ {insightsError}</div>
        ) : insights && (insights.summary || insights.recommendations || insights.trends || insights.anomalies) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {insights.summary && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: '600', marginBottom: '0.5rem' }}>📊 SUMMARY</div>
                <div style={{ color: '#1f2937' }}>{insights.summary}</div>
              </div>
            )}
            
            {insights.trends && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>📈 TRENDS</div>
                <div style={{ color: '#1f2937' }}>{insights.trends}</div>
              </div>
            )}
            
            {insights.anomalies && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: '600', marginBottom: '0.5rem' }}>⚠️ ANOMALIES</div>
                <div style={{ color: '#1f2937' }}>{insights.anomalies}</div>
              </div>
            )}
            
            {insights.recommendations && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '8px',
                borderLeft: '4px solid #8b5cf6',
                gridColumn: 'span 1'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: '600', marginBottom: '0.5rem' }}>💡 RECOMMENDATIONS</div>
                <div style={{ color: '#1f2937' }}>{insights.recommendations}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No insights available yet. Continue using PledgedHub to generate AI insights.</div>
        )}
      </div>
      <div className={"analytics-dashboard" + (darkMode ? ' dark' : '')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>{t('analytics.title')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Mobile-Friendly Date Preset Dropdown */}
            <select 
              value={showCustomDates ? 'custom' : datePreset}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomDates(true);
                } else {
                  handleDatePreset(e.target.value);
                }
              }}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: '#ffffff',
                color: '#374151'
              }}
            >
              <option value="today">📅 Today</option>
              <option value="week">📅 Last 7 Days</option>
              <option value="month">📅 Last 30 Days</option>
              <option value="quarter">📅 Last 3 Months</option>
              <option value="year">📅 Last Year</option>
              <option value="custom">🗓️ Custom Range</option>
            </select>

            {/* Custom Date Inputs (shown only when selected) */}
            {showCustomDates && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  From:
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} 
                  />
                </label>
                <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  To:
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} 
                  />
                </label>
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.9rem', padding: '0.65rem 1.2rem', whiteSpace: 'nowrap' }} 
              onClick={() => navigate('/admin')}
            >
              ← Dashboard
            </button>
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

        {/* NEW: Mobile Money Payment Methods */}
        {paymentMethods && paymentMethods.length > 0 && (
          <div className="stat-cards" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ width: '100%', margin: '1rem 0 0.5rem 0' }}>📱 Payment Methods (This Period)</h3>
            {paymentMethods.map((method, idx) => {
              const colors = ['#FFB300', '#E41C13', '#1976d2', '#388e3c'];
              const icons = ['📱', '📲', '🏦', '💵'];
              return (
                <StatCard 
                  key={idx}
                  title={method.provider || method.method || 'Unknown'} 
                  value={`UGX ${(method.amount || 0).toLocaleString()}`}
                  color={colors[idx % colors.length]}
                />
              );
            })}
          </div>
        )}

        {/* NEW: Credit System Metrics */}
        {creditMetrics && (
          <div className="stat-cards" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ width: '100%', margin: '1rem 0 0.5rem 0' }}>💳 Monetization Metrics</h3>
            <StatCard 
              title="👤 Free Users" 
              value={creditMetrics.freeUsers || 0} 
              color="#6B7280"
            />
            <StatCard 
              title="💰 SMS Credits Loaded" 
              value={`UGX ${(creditMetrics.totalCreditsLoaded || 0).toLocaleString()}`}
              color="#F59E0B"
            />
            <StatCard 
              title="🎯 Campaign Tier" 
              value={creditMetrics.campaignTierSubscribers || 0}
              color="#2563EB"
            />
            <StatCard 
              title="👑 Premium Tier" 
              value={creditMetrics.premiumTierSubscribers || 0}
              color="#8B5CF6"
            />
          </div>
        )}

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

        {/* NEW: Conversion Funnel */}
        <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
          <h3>🔄 Free → Paid Conversion Funnel</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>Track how users progress from free tier through monetization</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Free Users Stage */}
            <div style={{ 
              background: '#f3f4f6', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              borderLeft: '4px solid #6B7280',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Free Users</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {creditMetrics?.freeUsers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>100%</div>
            </div>

            {/* Arrow Down */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>↓</div>

            {/* SMS Pay-As-You-Go Stage */}
            <div style={{ 
              background: '#fef3c7', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              borderLeft: '4px solid #F59E0B',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>SMS Pay-As-You-Go</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {creditMetrics?.payAsYouGoUsers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {creditMetrics?.freeUsers > 0 ? ((creditMetrics?.payAsYouGoUsers || 0) / creditMetrics.freeUsers * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Arrow Down */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>↓</div>

            {/* Campaign Tier Stage */}
            <div style={{ 
              background: '#dbeafe', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              borderLeft: '4px solid #2563EB',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Campaign Tier</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {creditMetrics?.campaignTierSubscribers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {creditMetrics?.payAsYouGoUsers > 0 ? ((creditMetrics?.campaignTierSubscribers || 0) / creditMetrics.payAsYouGoUsers * 100).toFixed(1) : 0}%
              </div>
            </div>

            {/* Arrow Down */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>↓</div>

            {/* Premium Tier Stage */}
            <div style={{ 
              background: '#ede9fe', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              borderLeft: '4px solid #8B5CF6',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👑</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Premium Tier</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {creditMetrics?.premiumTierSubscribers || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {creditMetrics?.campaignTierSubscribers > 0 ? ((creditMetrics?.premiumTierSubscribers || 0) / creditMetrics.campaignTierSubscribers * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
          
          {/* Conversion Summary */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#f0fdf4',
            borderRadius: '8px',
            borderLeft: '4px solid #10b981'
          }}>
            <strong style={{ color: '#059669' }}>Conversion Summary:</strong>
            <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
              <div>Free → Pay-As-You-Go: {creditMetrics?.freeUsers > 0 ? ((creditMetrics?.payAsYouGoUsers || 0) / creditMetrics.freeUsers * 100).toFixed(1) : 0}%</div>
              <div>Pay-As-You-Go → Campaign: {creditMetrics?.payAsYouGoUsers > 0 ? ((creditMetrics?.campaignTierSubscribers || 0) / creditMetrics.payAsYouGoUsers * 100).toFixed(1) : 0}%</div>
              <div>Campaign → Premium: {creditMetrics?.campaignTierSubscribers > 0 ? ((creditMetrics?.premiumTierSubscribers || 0) / creditMetrics.campaignTierSubscribers * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
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
        <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>⚠️ At-Risk & Overdue Pledges</h3>
            {atRisk.length > 0 && (
              <button className="btn btn-secondary" onClick={() => exportCSV(atRisk, 'at_risk_pledges.csv')}>📥 Export CSV</button>
            )}
          </div>
          
          {atRisk.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: '#f0fdf4', 
              borderRadius: '8px',
              color: '#059669'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <strong>Great news!</strong> No pledges at risk. All collections on track.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="campaign-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#fef3c7' }}>
                    <th>Donor</th>
                    <th>Amount (UGX)</th>
                    <th>Purpose</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((pledge, idx) => {
                    const riskColor = pledge.daysOverdue > 30 ? '#e53935' : pledge.daysOverdue > 10 ? '#fbc02d' : '#ff9800';
                    const riskLabel = pledge.daysOverdue > 30 ? '🔴 CRITICAL' : pledge.daysOverdue > 10 ? '🟡 HIGH' : '🟠 MEDIUM';
                    return (
                      <tr key={idx} style={{ borderLeft: `4px solid ${riskColor}` }}>
                        <td style={{ fontWeight: '600' }}>{pledge.donorName}</td>
                        <td>{(pledge.amount || 0).toLocaleString()}</td>
                        <td>{pledge.purpose}</td>
                        <td>{pledge.dueDate}</td>
                        <td style={{ color: riskColor, fontWeight: '600' }}>{pledge.daysOverdue || 0} days</td>
                        <td>{pledge.status}</td>
                        <td style={{ color: riskColor }}>{riskLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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


