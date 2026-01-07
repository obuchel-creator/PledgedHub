import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaMoneyBillWave, FaUsers, FaRobot, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';
import './ExploreScreen.css';

const dummyStats = [
  { icon: <FaUsers />, label: 'Active Donors', value: '2,340+' },
  { icon: <FaMoneyBillWave />, label: 'Total Pledges', value: 'UGX 120M+' },
  { icon: <FaChartBar />, label: 'Campaigns', value: '58' },
  { icon: <FaMobileAlt />, label: 'Mobile Payments', value: 'UGX 80M' },
  { icon: <FaRobot />, label: 'AI Reminders Sent', value: '4,200+' },
  { icon: <FaShieldAlt />, label: 'Security Events', value: '0 Critical' },
];

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
  return (
    <div className="explore-main">
      <section className="explore-hero">
        <h1 className="explore-hero__title">Welcome to PledgeHub</h1>
        <p className="explore-hero__desc">A smarter way to manage pledges, campaigns, and payments across Uganda. Discover the power of automation, analytics, and mobile money—all in one platform.</p>
        <Link to="/register" className="explore-hero__cta">Get Started</Link>
      </section>

      <section className="explore-stats">
        {dummyStats.map((stat, i) => (
          <div className="explore-stat" key={i}>
            <div className="explore-stat__icon">{stat.icon}</div>
            <div className="explore-stat__value">{stat.value}</div>
            <div className="explore-stat__label">{stat.label}</div>
          </div>
        ))}
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
    </div>
  );
}
