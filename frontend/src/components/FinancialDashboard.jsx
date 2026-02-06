import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import './FinancialDashboard.css';

const FinancialDashboard = () => {
  const [profitLoss, setProfitLoss] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [financialHealth, setFinancialHealth] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date range calculator
  const getDateRange = () => {
    const end = new Date().toISOString().split('T')[0];
    let start;
    
    switch(dateRange) {
      case '7days':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30days':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90days':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'custom':
        start = customStart;
        return { start: customStart, end: customEnd };
      default:
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return { start, end };
  };

  useEffect(() => {
    fetchAllData();
  }, [dateRange, customStart, customEnd]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [plRes, cfRes, fhRes, exRes, revRes] = await Promise.all([
        axios.get(`/api/analytics/profit-loss?start=${start}&end=${end}`, config),
        axios.get(`/api/analytics/cash-flow?start=${start}&end=${end}&groupBy=day`, config),
        axios.get('/api/analytics/financial-health', config),
        axios.get(`/api/analytics/expense-breakdown?start=${start}&end=${end}`, config),
        axios.get(`/api/analytics/revenue-breakdown?start=${start}&end=${end}`, config)
      ]);

      setProfitLoss(plRes.data.data);
      setCashFlow(cfRes.data.data);
      setFinancialHealth(fhRes.data.data);
      setExpenseBreakdown(exRes.data.data);
      setRevenueBreakdown(revRes.data.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="financial-loading">Loading financial data...</div>;
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Profit & Loss Chart Data
  const incomeVsExpenses = {
    labels: ['Income', 'Expenses'],
    datasets: [{
      data: [profitLoss?.income.total || 0, profitLoss?.expenses.total || 0],
      backgroundColor: ['#10B981', '#EF4444'],
      borderColor: ['#059669', '#DC2626'],
      borderWidth: 2
    }]
  };

  // Expense Breakdown Donut Chart
  const expenseDonutData = {
    labels: expenseBreakdown?.map(e => e.category) || [],
    datasets: [{
      data: expenseBreakdown?.map(e => e.amount) || [],
      backgroundColor: [
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#F59E0B', // Amber
        '#10B981', // Green
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  // Revenue Breakdown Donut Chart
  const revenueDonutData = {
    labels: revenueBreakdown?.map(r => r.method.toUpperCase()) || [],
    datasets: [{
      data: revenueBreakdown?.map(r => r.amount) || [],
      backgroundColor: [
        '#2563EB', // MTN Blue
        '#DC2626', // Airtel Red
        '#059669', // Cash Green
        '#7C3AED', // Bank Purple
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  // Cash Flow Line Chart
  const cashFlowChartData = {
    labels: cashFlow?.flows.map(f => f.period) || [],
    datasets: [
      {
        label: 'Cash In',
        data: cashFlow?.flows.map(f => f.cashIn) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Cash Out',
        data: cashFlow?.flows.map(f => f.cashOut) || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Net Flow',
        data: cashFlow?.flows.map(f => f.netFlow) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [5, 5]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${formatCurrency(context.parsed || 0)}`;
          }
        }
      }
    }
  };

  return (
    <div className="financial-dashboard">
      {/* Header */}
      <div className="financial-header">
        <h1>📊 Financial Analytics</h1>
        <div className="date-controls">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <>
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                max={customEnd || new Date().toISOString().split('T')[0]}
              />
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </>
          )}
        </div>
      </div>

      {/* Financial Health Cards */}
      <div className="health-cards">
        <div className="health-card revenue">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Net Profit</h3>
            <div className="card-value">{formatCurrency(profitLoss?.netProfit || 0)}</div>
            <div className="card-meta">
              Profit Margin: <strong>{profitLoss?.profitMargin}%</strong>
            </div>
          </div>
        </div>

        <div className="health-card growth">
          <div className="card-icon">
            {financialHealth?.comparison.trend === 'up' ? '📈' : 
             financialHealth?.comparison.trend === 'down' ? '📉' : '➖'}
          </div>
          <div className="card-content">
            <h3>Revenue Growth</h3>
            <div className={`card-value ${financialHealth?.comparison.trend}`}>
              {financialHealth?.comparison.revenueGrowth > 0 ? '+' : ''}
              {financialHealth?.comparison.revenueGrowth}%
            </div>
            <div className="card-meta">vs. Previous Period</div>
          </div>
        </div>

        <div className="health-card collection">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Collection Rate</h3>
            <div className="card-value">{financialHealth?.efficiency.collectionRate}%</div>
            <div className="card-meta">
              {financialHealth?.currentPeriod.paidCount} of {financialHealth?.currentPeriod.totalCount} pledges
            </div>
          </div>
        </div>

        <div className="health-card efficiency">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>Avg. Days to Payment</h3>
            <div className="card-value">{financialHealth?.efficiency.daysToPayment} days</div>
            <div className="card-meta">Collection Efficiency</div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Section */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>💹 Profit & Loss</h2>
          <span className="period-label">{profitLoss?.period.start} to {profitLoss?.period.end}</span>
        </div>
        
        <div className="pl-grid">
          <div className="pl-summary">
            <div className="summary-row income-row">
              <div className="row-label">
                <span className="icon">💵</span>
                <strong>Total Income</strong>
              </div>
              <div className="row-value">{formatCurrency(profitLoss?.income.total || 0)}</div>
            </div>
            
            <div className="pl-breakdown">
              {Object.entries(profitLoss?.income.breakdown || {}).map(([key, value]) => (
                <div key={key} className="breakdown-item">
                  <span className="breakdown-label">{key.toUpperCase()}</span>
                  <span className="breakdown-value">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>

            <div className="summary-row expense-row">
              <div className="row-label">
                <span className="icon">💸</span>
                <strong>Total Expenses</strong>
              </div>
              <div className="row-value">{formatCurrency(profitLoss?.expenses.total || 0)}</div>
            </div>

            <div className="pl-breakdown">
              {Object.entries(profitLoss?.expenses.breakdown || {}).map(([key, value]) => (
                <div key={key} className="breakdown-item">
                  <span className="breakdown-label">{key}</span>
                  <span className="breakdown-value">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>

            <div className="summary-row net-row">
              <div className="row-label">
                <span className="icon">📊</span>
                <strong>Net Profit</strong>
              </div>
              <div className={`row-value ${profitLoss?.netProfit >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(profitLoss?.netProfit || 0)}
              </div>
            </div>
          </div>

          <div className="pl-chart">
            <h3>Income vs Expenses</h3>
            <div className="chart-container">
              <Doughnut data={incomeVsExpenses} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { position: 'bottom' }
                }
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Expense & Revenue Breakdown */}
      <div className="breakdown-grid">
        <div className="analytics-section">
          <h2>💸 Expense Breakdown</h2>
          <div className="chart-container-donut">
            <Doughnut data={expenseDonutData} options={chartOptions} />
          </div>
          <div className="breakdown-legend">
            {expenseBreakdown?.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-label">{item.category}</span>
                <span className="legend-value">
                  {formatCurrency(item.amount)} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-section">
          <h2>💰 Revenue Sources</h2>
          <div className="chart-container-donut">
            <Doughnut data={revenueDonutData} options={chartOptions} />
          </div>
          <div className="breakdown-legend">
            {revenueBreakdown?.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-label">{item.method.toUpperCase()}</span>
                <span className="legend-value">
                  {formatCurrency(item.amount)} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="analytics-section">
        <h2>💵 Cash Flow Analysis</h2>
        <div className="cash-flow-summary">
          <div className="flow-stat">
            <span className="flow-label">Total Cash In</span>
            <span className="flow-value positive">{formatCurrency(cashFlow?.summary.totalCashIn || 0)}</span>
          </div>
          <div className="flow-stat">
            <span className="flow-label">Total Cash Out</span>
            <span className="flow-value negative">{formatCurrency(cashFlow?.summary.totalCashOut || 0)}</span>
          </div>
          <div className="flow-stat">
            <span className="flow-label">Net Cash Flow</span>
            <span className={`flow-value ${cashFlow?.summary.netCashFlow >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(cashFlow?.summary.netCashFlow || 0)}
            </span>
          </div>
        </div>
        <div className="chart-container-line">
          <Line data={cashFlowChartData} options={{
            ...chartOptions,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value);
                  }
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
