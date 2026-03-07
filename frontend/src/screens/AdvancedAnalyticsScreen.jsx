/**
 * Advanced Analytics Dashboard Screen
 * QuickBooks-style analytics with charts, trends, and insights
 */

import React, { useState, useEffect } from 'react';
import ShareAnalyticsDashboard from '../components/ShareAnalyticsDashboard';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const AdvancedAnalyticsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [metrics, setMetrics] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [campaignPerformance, setCampaignPerformance] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pledgeFunnel, setPledgeFunnel] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [donorLTV, setDonorLTV] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pledgedhub_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all analytics data in parallel
      const [
        metricsRes,
        trendRes,
        campaignsRes,
        paymentsRes,
        funnelRes,
        forecastRes,
        topRes,
        ltvRes,
      ] = await Promise.all([
        fetch(`/api/advanced-analytics/dashboard?period=${dateRange}`, { headers }),
        fetch(`/api/advanced-analytics/revenue-trend?period=${dateRange}&groupBy=day`, { headers }),
        fetch(`/api/advanced-analytics/campaign-performance?period=${dateRange}`, { headers }),
        fetch(`/api/advanced-analytics/payment-methods?period=${dateRange}`, { headers }),
        fetch(`/api/advanced-analytics/pledge-funnel?period=${dateRange}`, { headers }),
        fetch(`/api/advanced-analytics/forecast?periods=6`, { headers }),
        fetch(`/api/advanced-analytics/top-campaigns?limit=5&metric=revenue`, { headers }),
        fetch(`/api/advanced-analytics/donor-ltv`, { headers }),
      ]);

      const [metrics, trend, campaigns, payments, funnel, forecast, top, ltv] = await Promise.all([
        metricsRes.json(),
        trendRes.json(),
        campaignsRes.json(),
        paymentsRes.json(),
        funnelRes.json(),
        forecastRes.json(),
        topRes.json(),
        ltvRes.json(),
      ]);

      setMetrics(metrics.data);
      setRevenueTrend(trend.data || []);
      setCampaignPerformance(campaigns.data || []);
      setPaymentMethods(payments.data || []);
      setPledgeFunnel(funnel.data);
      setForecast(forecast.data);
      setTopCampaigns(top.data || []);
      setDonorLTV(ltv.data?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('pledgedhub_token');
      const response = await fetch(
        `/api/advanced-analytics/export?format=csv&type=${type}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pledgedhub-${type}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value) => {
    return `UGX ${parseFloat(value || 0).toLocaleString()}`;
  };

  const COLORS = ['#2563eb', '#1e40af', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      }}>
        <div style={{ 
          background: 'white', 
          padding: '3rem', 
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite',
          }}></div>
          <h2 style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '1.5rem', fontWeight: '700' }}>
            Analyzing Your Data
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
            Processing advanced metrics and insights...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f9fafb', 
      padding: '2rem 1rem' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '16px', 
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <h1 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '2rem', 
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                📊 Advanced Analytics
              </h1>
              <p style={{ margin: 0, color: '#6b7280' }}>
                QuickBooks-style insights and reporting
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>

              {/* Export Button */}
              <button
                onClick={() => handleExport('dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {metrics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics.revenue.current)}
              trend={metrics.revenue.trend}
              icon="💰"
              color="#10b981"
            />
            <MetricCard
              title="Active Campaigns"
              value={metrics.campaigns.active}
              subtitle={`${metrics.campaigns.completionRate}% avg completion`}
              icon="🎯"
              color="#2563eb"
            />
            <MetricCard
              title="Total Pledges"
              value={metrics.pledges.total}
              subtitle={`${metrics.pledges.fulfillmentRate}% fulfilled`}
              icon="📋"
              color="#f59e0b"
            />
            <MetricCard
              title="Unique Donors"
              value={metrics.donors.total}
              subtitle={`${metrics.donors.retentionRate}% retention`}
              icon="👥"
              color="#8b5cf6"
            />
          </div>
        )}

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Revenue Trend */}
          <ChartCard title="Revenue Trend" subtitle="Daily revenue over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Payment Methods */}
          <ChartCard title="Payment Methods" subtitle="Distribution by method">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.method}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Campaigns & Donor LTV */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Top Campaigns */}
          <ChartCard title="Top Performing Campaigns" subtitle="By revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCampaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="title" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="currentAmount" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pledge Funnel */}
          {pledgeFunnel && (
            <ChartCard title="Pledge Fulfillment Funnel" subtitle={`${pledgeFunnel.conversionRate}% conversion rate`}>
              <div style={{ padding: '1rem' }}>
                {pledgeFunnel.stages.map((stage, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#374151',
                    }}>
                      <span>{stage.name}</span>
                      <span>{stage.count} ({stage.percentage || 0}%)</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '32px', 
                      background: '#e5e7eb', 
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ 
                        width: `${stage.percentage || 0}%`, 
                        height: '100%', 
                        background: COLORS[index % COLORS.length],
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>

        {/* Donor LTV Table */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>
            🌟 Top Donors by Lifetime Value
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Donor</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>LTV</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Pledges</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Avg Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {donorLTV.map((donor, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{donor.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{donor.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                      {formatCurrency(donor.lifetimeValue)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{donor.totalPledges}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(donor.avgPledgeAmount)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{donor.frequency.toFixed(1)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Forecast */}
        {forecast && forecast.forecast && (
          <ChartCard title="Revenue Forecast" subtitle="6-month projection based on trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[...forecast.historical, ...forecast.forecast]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  name="Historical"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  name="Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, trend, icon, color }) => (
  <div style={{ 
    background: 'white', 
    padding: '1.5rem', 
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${color}`,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {subtitle}
          </div>
        )}
        {trend && (
          <div style={{ 
            marginTop: '0.5rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            background: trend.direction === 'up' ? '#d1fae520' : '#fee2e220',
            color: trend.direction === 'up' ? '#10b981' : '#ef4444',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
    </div>
  </div>
);

// Chart Card Component
const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ 
    background: 'white', 
    padding: '2rem', 
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  }}>
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
          {subtitle}
        </p>
      )}
    </div>
    {children}
  </div>
);

export default AdvancedAnalyticsScreen;


