import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaMoneyBillWave, FaUsers, FaRobot, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';
import './ExploreScreen.css';
import {
  getAnalyticsOverview,
  getCampaigns,
  getPayments,
  getAIStatus,
  getReminderStatus,
} from '../services/api';

const statIcons = {
  donors: <FaUsers />,
  pledges: <FaMoneyBillWave />,
  campaigns: <FaChartBar />,
  payments: <FaMobileAlt />,
  ai: <FaRobot />,
  security: <FaShieldAlt />,
};

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
  const [stats, setStats] = useState({
    donors: 0,
    pledges: 0,
    campaigns: 0,
    payments: 0,
    aiReminders: 0,
    securityEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        // Fetch analytics overview
        const overview = await getAnalyticsOverview();
        // Fetch campaigns count
        const campaignsRes = await getCampaigns('active');
        // Fetch payments summary
        const paymentsRes = await getPayments({});
        // Fetch AI status (reminders sent)
        const aiStatus = await getAIStatus();
        // Fetch security events (critical count)
        const reminderStatus = await getReminderStatus();

        setStats({
          donors: overview?.activeDonors || 0,
          pledges: overview?.totalPledges || 0,
          campaigns: Array.isArray(campaignsRes?.data?.campaigns) ? campaignsRes.data.campaigns.length : 0,
          payments: overview?.totalCollected || 0,
          aiReminders: aiStatus?.data?.remindersSent || 0,
          securityEvents: reminderStatus?.data?.criticalEvents || 0,
        });
      } catch (err) {
        setError(err?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { icon: statIcons.donors, label: 'Active Donors', value: stats.donors },
    { icon: statIcons.pledges, label: 'Total Pledges', value: stats.pledges },
    { icon: statIcons.campaigns, label: 'Campaigns', value: stats.campaigns },
    { icon: statIcons.payments, label: 'Mobile Payments', value: `UGX ${Number(stats.payments).toLocaleString()}` },
    { icon: statIcons.ai, label: 'AI Reminders Sent', value: stats.aiReminders },
    { icon: statIcons.security, label: 'Security Events', value: `${stats.securityEvents} Critical` },
  ];

  return (
    <div className="explore-main">
      <section className="explore-hero">
        <h1 className="explore-hero__title">Welcome to PledgeHub</h1>
        <p className="explore-hero__desc">A smarter way to manage pledges, campaigns, and payments across Uganda. Discover the power of automation, analytics, and mobile money—all in one platform.</p>
        <Link to="/register" className="explore-hero__cta">Get Started</Link>
      </section>

      <section className="explore-stats">
        {loading ? (
          <div className="explore-stat" style={{ gridColumn: 'span 3', textAlign: 'center', color: '#64748b' }}>
            Loading stats...
          </div>
        ) : error ? (
          <div className="explore-stat" style={{ gridColumn: 'span 3', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : (
          statCards.map((stat, i) => (
            <div className="explore-stat" key={i}>
              <div className="explore-stat__icon">{stat.icon}</div>
              <div className="explore-stat__value">{stat.value}</div>
              <div className="explore-stat__label">{stat.label}</div>
            </div>
          ))
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

      {/* Optionally, replace demo cards with real campaign/pledge/payment highlights in future */}
      <section className="explore-demo-cards">
        <div className="explore-demo-card">
          <h4>Sample Campaign</h4>
          <p>"Clean Water for Schools"<br />Goal: UGX 10,000,000<br />Raised: UGX 7,200,000</p>
          <Link to="/campaigns/1" className="explore-demo-card__cta">View Campaign</Link>
        </div>
        <div className="explore-demo-card">
          <h4>Sample Pledge</h4>
          <p>Donor: Jane Doe<br />Amount: UGX 250,000<br />Status: Unpaid</p>
          <Link to="/pledges/1" className="explore-demo-card__cta">View Pledge</Link>
        </div>
        <div className="explore-demo-card">
          <h4>Sample Payment</h4>
          <p>Method: MTN Mobile Money<br />Amount: UGX 100,000<br />Date: 2026-01-01</p>
          <Link to="/payment" className="explore-demo-card__cta">View Payment</Link>
        </div>
      </section>

      <div style={{textAlign:'center',margin:'2rem 0'}}>
        <Link to="/explore-details" className="explore-hero__cta" style={{fontSize:'1.1rem',padding:'0.75rem 2rem'}}>View Detailed Tables & Charts</Link>
      </div>
    </div>
  );
}
