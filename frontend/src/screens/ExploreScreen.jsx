import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaMoneyBillWave, FaUsers, FaRobot, FaMobileAlt, FaShieldAlt, FaBuilding } from 'react-icons/fa';
import { getPlatformStats } from '../services/api';
import './ExploreScreen.css';

const features = [
  {
    title: 'AI-Powered Reminders',
    desc: 'Automated SMS, WhatsApp, and email reminders boost your collection rates.',
    icon: <FaRobot className="explore-feature__icon" />,
    link: '/analytics',
    cta: 'See Analytics'
  },
  {
    title: 'Seamless Mobile Money',
    desc: 'Collect payments via MTN, Airtel, and PayPal with instant reconciliation.',
    icon: <FaMobileAlt className="explore-feature__icon" />,
    link: '/payment',
    cta: 'Try Payment'
  },
  {
    title: 'Advanced Analytics',
    desc: 'Track pledges, payments, and campaign performance with real-time dashboards.',
    icon: <FaChartBar className="explore-feature__icon" />,
    link: '/dashboard',
    cta: 'View Dashboard'
  },
  {
    title: 'Secure & Compliant',
    desc: 'Multi-layered security, audit logs, and role-based access for peace of mind.',
    icon: <FaShieldAlt className="explore-feature__icon" />,
    link: '/security',
    cta: 'Security Center'
  },
];

export default function ExploreScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = localStorage.getItem('token');

  useEffect(() => {
    // Fetch platform-wide stats for everyone (no auth required)
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await getPlatformStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'UGX 0';
    return `UGX ${Number(amount).toLocaleString()}`;
  };

  const displayStats = stats ? [
    { icon: <FaUsers />, label: 'Total Donors', value: stats.totalDonors?.toLocaleString() || '0' },
    { icon: <FaMoneyBillWave />, label: 'Total Pledges', value: formatCurrency(stats.totalAmount || 0) },
    { icon: <FaChartBar />, label: 'Active Campaigns', value: stats.totalCampaigns?.toLocaleString() || '0' },
    { icon: <FaMobileAlt />, label: 'Funds Collected', value: formatCurrency(stats.totalCollected || 0) },
    { icon: <FaRobot />, label: 'Pending Collection', value: stats.pendingPledges?.toLocaleString() || '0' },
    { icon: <FaBuilding />, label: 'Organizations', value: stats.totalOrganizations?.toLocaleString() || '0' },
  ] : [];

  return (
    <div className="explore-main">
      <section className="explore-hero">
        <h1 className="explore-hero__title">Welcome to PledgeHub</h1>
        <p className="explore-hero__desc">The complete platform for pledge management, automated reminders, and seamless payments. Empower your organization with AI-driven insights and mobile money integration.</p>
        {!isAuthenticated && <Link to="/register" className="explore-hero__cta">Get Started</Link>}
        {isAuthenticated && <Link to="/dashboard" className="explore-hero__cta">Go to Dashboard</Link>}
      </section>

      <section className="explore-stats">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            Loading platform statistics...
          </div>
        ) : displayStats.length > 0 ? (
          displayStats.map((stat, i) => (
            <div className="explore-stat" key={i}>
              <div className="explore-stat__icon">{stat.icon}</div>
              <div className="explore-stat__value">{stat.value}</div>
              <div className="explore-stat__label">{stat.label}</div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '1rem' }}>
              No data yet - be the first to create a pledge!
            </p>
            <Link to="/register" style={{ 
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#16a34a',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600
            }}>
              Get Started Free
            </Link>
          </div>
        )}
      </section>

      <section className="explore-features">
        {features.map((f, i) => (
          <div className="explore-feature" key={i}>
            {f.icon}
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <Link to={f.link} className="explore-feature__cta">{f.cta}</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
