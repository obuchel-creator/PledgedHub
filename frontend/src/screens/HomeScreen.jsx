import React, { useEffect, useMemo, useState, useContext } from 'react';

import { FaSortAmountUp, FaSortAmountDown, FaFire, FaDownload, FaUserShield, FaHistory, FaMoon, FaSun, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import { CSVLink } from 'react-csv';
import { getViteEnv } from '../utils/getViteEnv';
import { Link } from 'react-router-dom';
import { getCampaigns, getAnalyticsOverview } from '../services/api';
import AIFeatureBanner from '../components/AIFeatureBanner';
import HeroBanner from '../components/HeroBanner';
import { FaChartBar, FaMoneyBillWave, FaUsers, FaRobot, FaMobileAlt, FaShieldAlt } from 'react-icons/fa'; // Only this import for icons used in stats/features
import FeedbackButton from '../components/FeedbackButton';
import ShareButton from '../components/ShareButton';
import PledgesList from '../components/PledgesList';
import RecentPayments from '../components/RecentPayments';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function HomeScreen() {
  const { user, loading: authLoading } = useContext(AuthContext);

  // State hooks FIRST
  const [campaigns, setCampaigns] = useState([]);
  // Defensive: always use array for mapping/filtering
  const campaignList = Array.isArray(campaigns) ? campaigns : [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignStats, setCampaignStats] = useState({
    count: 0,
    totalGoal: '0',
    averageSuggested: '0'
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [highContrast, setHighContrast] = useState(false);
  const [realStats, setRealStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const isAuthenticated = localStorage.getItem('token');

  // Notifications/reminders logic
  useEffect(() => {
    if (!user || authLoading) return;
    // Example: Remind if user has unpaid pledges
    if (user.pledges && user.pledges.length > 0) {
      const unpaid = user.pledges.filter(p => !p.paid);
      if (unpaid.length > 0) {

        toast.info(`You have ${unpaid.length} unpaid pledge(s). Please complete your payment.`, {
          position: 'top-right',
          autoClose: 8000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    // Example: Show recent activity
    if (user.recentPayments && user.recentPayments.length > 0) {
      const last = user.recentPayments[0];
      toast.success(`Thank you for your recent payment of UGX ${last.amount}!`, {
        position: 'top-right',
        autoClose: 6000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  }, [user, authLoading]);

  // Demo: Custom theming (logo/color)
  const orgLogo = getViteEnv().ORG_LOGO || null;
  const orgColor = getViteEnv().ORG_COLOR || '#16a34a';

  // CSV Export Data
  const campaignCSV = useMemo(() => campaignList.map(c => ({
    Title: c.title,
    Description: c.description,
    Goal: c.goalAmount,
    Raised: c.raisedAmount,
    Status: c.status,
    Category: c.category,
    Created: c.createdAt
  })), [campaigns]);

  // CSV Export for pledges (if user)
  const pledgesCSV = useMemo(() =>
    (user?.pledges || []).map(p => ({
      Campaign: p.campaignTitle || '',
      Amount: p.amount,
      Paid: p.paid ? 'Yes' : 'No',
      DueDate: p.dueDate,
      Created: p.createdAt
    })),
    [user]
  );

  // Pie chart for categories
  const categoryPie = useMemo(() => {/* Lines 75-87 omitted */}, [campaignList]);

  // Pie chart for donors (demo: by status)
  const donorPie = useMemo(() => {/* Lines 91-103 omitted */}, [campaignList]);
  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCampaigns();
        setCampaigns(data || []);
        // Calculate stats
        if (Array.isArray(data) && data.length > 0) {
          const count = data.length;
          const totalGoal = data.reduce((sum, c) => sum + (Number(c.goalAmount) || 0), 0);
          const averageSuggested = Math.round(totalGoal / count).toLocaleString();
          setCampaignStats({
            count,
            totalGoal: totalGoal.toLocaleString(),
            averageSuggested
          });
        } else {
          setCampaignStats({ count: 0, totalGoal: '0', averageSuggested: '0' });
        }
      } catch (err) {
        setError(err?.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  // Fetch real statistics for authenticated users
  useEffect(() => {
    async function fetchStats() {
      if (!isAuthenticated) {
        setStatsLoading(false);
        return;
      }
      try {
        const response = await getAnalyticsOverview();
        if (response.success) {
          setRealStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [isAuthenticated]);

  // Chart data for analytics
  // Insights calculations
  const totalRaised = useMemo(() =>
    campaignList.reduce((sum, c) => sum + (Number(c.raisedAmount) || 0), 0),
    [campaignList]
  );
  const mostFunded = useMemo(() =>
    campaignList.reduce((max, c) => (Number(c.raisedAmount) > Number(max.raisedAmount || 0) ? c : max), {}),
    [campaignList]
  );

  const chartData = useMemo(() => {
    const filtered = campaignList.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
    return {
      labels: filtered.map(c => c.title),
      datasets: [
        {
          label: 'Goal Amount (UGX)',
          data: filtered.map(c => Number(c.goalAmount) || 0),
          backgroundColor: 'rgba(34,197,94,0.7)',
        },
      ],
    };
  }, [campaigns, search]);

  const filteredCampaigns = useMemo(() => {
    let filtered = campaignList.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'goal') {
      filtered = filtered.slice().sort((a, b) => (Number(b.goalAmount) || 0) - (Number(a.goalAmount) || 0));
    } else if (sort === 'progress') {
      filtered = filtered.slice().sort((a, b) => {
        const aProgress = a.raisedAmount && a.goalAmount ? a.raisedAmount / a.goalAmount : 0;
        const bProgress = b.raisedAmount && b.goalAmount ? b.raisedAmount / b.goalAmount : 0;
        return bProgress - aProgress;
      });
    } else {
      filtered = filtered.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return filtered;
  }, [campaigns, search, sort]);

  // Format currency helper
  const formatCurrency = (amount) => {
    if (!amount) return 'UGX 0';
    return `UGX ${Number(amount).toLocaleString()}`;
  };

  // Dynamic stats from real data
  const homeStats = realStats ? [
    { icon: <FaUsers />, label: 'Active Donors', value: realStats.totalDonors || '0' },
    { icon: <FaMoneyBillWave />, label: 'Total Pledges', value: formatCurrency(realStats.totalAmount || 0) },
    { icon: <FaChartBar />, label: 'Campaigns', value: realStats.totalCampaigns || '0' },
    { icon: <FaMobileAlt />, label: 'Collected', value: formatCurrency(realStats.totalCollected || 0) },
    { icon: <FaRobot />, label: 'Pending Pledges', value: realStats.pendingPledges || '0' },
    { icon: <FaShieldAlt />, label: 'Collection Rate', value: realStats.collectionRate ? `${realStats.collectionRate}%` : '0%' },
  ] : [];
  const homeFeatures = [
    {
      icon: <FaRobot style={{ color: '#16a34a', fontSize: '2rem' }} />, title: 'AI Reminders',
      desc: 'Automated SMS, WhatsApp, and email reminders boost your collection rates.'
    },
    {
      icon: <FaMobileAlt style={{ color: '#22d3ee', fontSize: '2rem' }} />, title: 'Mobile Money',
      desc: 'Collect payments via MTN, Airtel, and PayPal with instant reconciliation.'
    },
    {
      icon: <FaChartBar style={{ color: '#f59e42', fontSize: '2rem' }} />, title: 'Analytics',
      desc: 'Track pledges, payments, and campaign performance with real-time dashboards.'
    },
    {
      icon: <FaShieldAlt style={{ color: '#6366f1', fontSize: '2rem' }} />, title: 'Security',
      desc: 'Multi-layered security, audit logs, and role-based access for peace of mind.'
    },
  ];

  return (
    <>
      <ToastContainer />
      <main
        style={{ padding: '0', background: highContrast ? '#111' : '#f8fafc', minHeight: '100vh', fontFamily: 'inherit', color: highContrast ? '#fff' : undefined }}
        aria-label="Dashboard main content"
        aria-live="polite"
        tabIndex={0}
      >
        {/* Hero Banner Section */}
        <section className="home-hero">
          <h1 className="home-hero__title">Welcome to PledgeHub</h1>
          <p className="home-hero__desc">
            Transform your pledge collection with intelligent automation and real-time insights.
            <br />
            Streamline campaigns, payments, and reminders—all in one powerful platform.
          </p>
          <a href="/explore" className="home-hero__cta">Explore Features</a>
        </section>

        {/* Stats Section */}
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '0 0 2.5rem 0' }}>
          {!isAuthenticated ? (
            <div style={{ background: '#f0fdf4', borderRadius: 14, boxShadow: '0 2px 8px #16a34a0a', padding: '2rem', textAlign: 'center', minWidth: 300 }}>
              <div style={{ fontSize: '2.2rem', color: '#16a34a', marginBottom: 12 }}><FaUsers /></div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Sign in to view your statistics</div>
              <Link to="/login" style={{ display: 'inline-block', background: orgColor, color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '8px', textDecoration: 'none', marginTop: '0.5rem' }}>Sign In</Link>
            </div>
          ) : statsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading your statistics...</div>
          ) : homeStats.length > 0 ? (
            homeStats.map((stat, i) => (
              <div key={i} style={{ background: '#f0fdf4', borderRadius: 14, boxShadow: '0 2px 8px #16a34a0a', padding: '1.2rem 2.2rem', minWidth: 160, textAlign: 'center', flex: '1 1 180px', maxWidth: 220 }}>
                <div style={{ fontSize: '2.2rem', color: '#16a34a', marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                <div style={{ fontSize: '1.01rem', color: '#64748b' }}>{stat.label}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No data available yet. <Link to="/pledges/create" style={{ color: orgColor }}>Create your first pledge</Link> to get started!
            </div>
          )}
        </section>

        {/* Feature Highlights Section */}
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '0 0 2.5rem 0' }}>
          {homeFeatures.map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #16a34a11', padding: '2rem 1.5rem 1.5rem 1.5rem', minWidth: 220, maxWidth: 320, textAlign: 'center', flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {f.icon}
              <h3 style={{ fontWeight: 700, fontSize: '1.18rem', margin: '0.7rem 0 0.3rem 0' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '1.01rem', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ...existing header, controls, and analytics sections... */}
        <section style={{ marginBottom: '2.5rem' }}>
          {filteredCampaigns.length === 0 ? (
            <div className="empty-state" aria-live="polite">
              <p style={{ marginBottom: '0.75rem' }}>No active campaigns found.</p>
              <div className="empty-state__actions">
                <Link to="/campaigns/create" className="btn btn-primary">Create the first campaign</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              {filteredCampaigns.map((c) => {
                const goal = Number(c.goalAmount) || 0;
                const raised = Number(c.raisedAmount) || 0;
                const progress = goal > 0 ? Math.min(raised / goal, 1) : 0;
                return (
                  <div key={c.id} className="campaign-card" style={{ background: highContrast ? '#111' : '#f1f5f9', borderRadius: '14px', padding: '1.5rem', minWidth: 260, maxWidth: 350, flex: 1, boxShadow: '0 2px 8px rgba(16,185,129,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: '0.5rem', color: highContrast ? '#fff' : undefined }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: orgColor, marginBottom: '0.5rem' }} title={c.title}>{c.title}</h3>
                    <p style={{ color: highContrast ? '#e5e7eb' : '#334155', fontSize: '1rem', marginBottom: '0.5rem', minHeight: 40 }} title={c.description}>{c.description}</p>
                    <div style={{ color: orgColor, fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Goal: UGX {goal.toLocaleString()}</div>
                    <div style={{ color: highContrast ? '#e5e7eb' : '#64748b', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Status: {c.status || 'Active'}</div>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: '0.5rem' }} title="Progress towards goal">
                      <div style={{ height: 10, background: highContrast ? '#333' : '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 2 }}>
                        <div style={{ width: `${progress * 100}%`, background: progress > 0.99 ? orgColor : '#f59e0b', height: '100%', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: '0.95rem', color: highContrast ? '#e5e7eb' : '#334155', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Raised: UGX {raised.toLocaleString()}</span>
                        <span>{Math.round(progress * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <Link to={`/campaign/${c.id}`} className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '0.5rem 1rem', borderRadius: '8px', background: orgColor, color: '#fff', border: 'none', textDecoration: 'none' }} title="View campaign details">View</Link>
                    <ShareButton url={window.location.origin + '/campaign/' + c.id} contentType="campaign" />
                    {/* Integrations: WhatsApp, Email, Payment */}
                    <a href={`https://wa.me/?text=Support%20${encodeURIComponent(c.title)}%20at%20${window.location.origin}/campaign/${c.id}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp" style={{ color: orgColor, fontSize: 20, marginLeft: 4 }}><FaWhatsapp /></a>
                    <a href={`mailto:?subject=Support%20${encodeURIComponent(c.title)}&body=Check%20out%20this%20campaign:%20${window.location.origin}/campaign/${c.id}`} target="_blank" rel="noopener noreferrer" title="Share via Email" style={{ color: orgColor, fontSize: 20, marginLeft: 4 }}><FaEnvelope /></a>
                    <a href={`/pay/${c.id}`} title="Make a payment" style={{ color: orgColor, fontSize: 20, marginLeft: 4 }}><FaMoneyBillWave /></a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <FeedbackButton />

      {/* Responsive styles */}
      <style>{`
        .home-hero {
          background: linear-gradient(120deg, #16a34a 0%, #22d3ee 100%);
          color: #fff;
          border-radius: 18px;
          padding: 3rem 2rem;
          margin-bottom: 2.5rem;
          text-align: center;
          box-shadow: 0 4px 32px rgba(16,185,129,0.12);
          position: relative;
          overflow: hidden;
        }
        .home-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
        }
        .home-hero__title {
          font-size: 2.8rem;
          font-weight: 900;
          margin-bottom: 1rem;
          letter-spacing: -1.5px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.1);
          position: relative;
          z-index: 1;
        }
        .home-hero__desc {
          font-size: 1.25rem;
          font-weight: 500;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          color: rgba(255,255,255,0.95);
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 1;
        }
        .home-hero__cta {
          display: inline-block;
          background: rgba(255,255,255,0.95);
          color: #16a34a;
          font-weight: 700;
          font-size: 1.1rem;
          padding: 0.85rem 2.5rem;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }
        .home-hero__cta:hover {
          background: #fff;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        @media (max-width: 900px) {
          .home-hero__title {
            font-size: 2.2rem;
          }
          .home-hero__desc {
            font-size: 1.1rem;
          }
          .stat-card, .campaign-card, .section__title, .section.card.card--muted {
            min-width: 180px !important;
            max-width: 100% !important;
          }
          main > section {
            flex-direction: column !important;
            gap: 1.2rem !important;
          }
        }
        @media (max-width: 600px) {
          .home-hero {
            padding: 2rem 1.5rem;
            border-radius: 12px;
          }
          .home-hero__title {
            font-size: 1.8rem;
          }
          .home-hero__desc {
            font-size: 1rem;
          }
          .home-hero__cta {
            font-size: 1rem;
            padding: 0.75rem 2rem;
          }
          main {
            padding: 0.5rem !important;
          }
          .stat-card, .campaign-card {
            padding: 1rem !important;
          }
          .section.card.card--muted {
            padding: 1rem !important;
          }
        }
      `}</style>
      </main>
    </>
  );
}

export default HomeScreen;
