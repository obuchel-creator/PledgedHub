import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns, getPledges } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboardScreen.css';

export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalPledges: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load campaigns
      const campaignsResult = await getCampaigns('active');
      const campaignsData = campaignsResult?.data || [];
      setCampaigns(campaignsData);

      // Load recent pledges
      const pledgesResult = await getPledges();
      const pledgesData = pledgesResult?.data || [];
      setPledges(pledgesData.slice(0, 5)); // Latest 5 pledges

      // Calculate stats
      const activeCampaigns = campaignsData.filter((c) => c.status === 'active').length;
      const totalAmount = pledgesData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({
        totalCampaigns: campaignsData.length,
        activeCampaigns,
        totalPledges: pledgesData.length,
        totalAmount,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    navigate('/create-campaign');
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleCreatePledge = () => {
    navigate('/fundraise');
  };

  if (loading) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#2563eb' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '3rem',
      }}
    >
      <main className="page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <header
          className="page-header"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <p
                className="page-header__eyebrow"
                style={{ color: '#2563eb', fontWeight: '600', marginBottom: '0.5rem' }}
              >
                Admin Dashboard
              </p>
              <h1
                className="page-header__title"
                style={{ color: '#1a202c', marginBottom: '0.5rem', fontSize: '2rem' }}
              >
                Pledge Management
              </h1>
              <p className="page-header__subtitle" style={{ color: '#4a5568', fontSize: '1rem' }}>
                Overview of campaigns and pledges
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCreateCampaign}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
              >
                ➕ Create Campaign
              </button>
              <button
                onClick={handleCreatePledge}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', whiteSpace: 'nowrap' }}
              >
                📝 Create Pledge
              </button>
              {/* Analytics Dashboard button for staff/admin only */}
              {user && (user.role === 'admin' || user.role === 'staff') && (
                <button
                  onClick={() => navigate('/analytics')}
                  className="btn btn-accent"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', whiteSpace: 'nowrap', background: '#1976d2', color: '#fff' }}
                >
                  📈 Analytics Dashboard
                </button>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            className="card"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>📊</div>
              <div>
                <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem', fontWeight: '600' }}>
                  Total Campaigns
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: '#1a202c',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                  }}
                >
                  {stats.totalCampaigns}
                </p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>🎯</div>
              <div>
                <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem', fontWeight: '600' }}>
                  Active Campaigns
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: '#2563eb',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                  }}
                >
                  {stats.activeCampaigns}
                </p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>📝</div>
              <div>
                <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem', fontWeight: '600' }}>
                  Total Pledges
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: '#1a202c',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                  }}
                >
                  {stats.totalPledges}
                </p>
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>💰</div>
              <div>
                <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem', fontWeight: '600' }}>
                  Total Amount
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    color: '#10b981',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                  }}
                >
                  UGX {stats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Campaigns Section */}
        <section
          className="card"
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ color: '#1a202c', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              📊 Active Campaigns
            </h2>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No active campaigns yet
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                Create your first campaign to start raising funds
              </p>
              <button onClick={handleCreateCampaign} className="btn btn-primary">
                Create Campaign
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {campaigns.map((campaign) => {
                const goalAmount = parseFloat(campaign.goal_amount || 0);
                const totalPledged = parseFloat(campaign.total_pledged || 0);
                const progress = goalAmount > 0 ? (totalPledged / goalAmount) * 100 : 0;

                return (
                  <div
                    key={campaign.id}
                    onClick={() => handleViewCampaign(campaign.id)}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3
                        style={{
                          color: '#1a202c',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {campaign.title}
                      </h3>
                      {campaign.description && (
                        <p style={{ color: '#4a5568', fontSize: '0.875rem', margin: 0 }}>
                          {campaign.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', color: '#718096' }}>
                          UGX {totalPledged.toLocaleString()} raised
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#718096' }}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: '100%',
                            backgroundColor: progress >= 100 ? '#10b981' : '#2563eb',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                          Goal: UGX {goalAmount.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {campaign.pledge_count || 0}{' '}
                          {campaign.pledge_count === 1 ? 'pledge' : 'pledges'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: campaign.status === 'active' ? '#dbeafe' : '#f3f4f6',
                          color: campaign.status === 'active' ? '#1e40af' : '#4b5563',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {campaign.status === 'active' ? '🟢 Active' : '⚪ ' + campaign.status}
                      </span>
                      {campaign.suggested_amount && (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}
                        >
                          💡 UGX {parseFloat(campaign.suggested_amount).toLocaleString()} suggested
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Pledges Section */}
        <section
          className="card"
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ color: '#1a202c', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              📝 Recent Pledges
            </h2>
          </div>

          {pledges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No pledges yet
              </p>
              <p style={{ marginBottom: '1.5rem' }}>Start recording donor commitments</p>
              <button onClick={handleCreatePledge} className="btn btn-primary">
                Create Pledge
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        color: '#718096',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      Donor
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        color: '#718096',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        color: '#718096',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        color: '#718096',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pledges.map((pledge) => {
                    const pledgeDate = pledge.collection_date || pledge.date || pledge.createdAt;
                    return (
                      <tr key={pledge.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                color: '#1a202c',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                              }}
                            >
                              {pledge.donorName || pledge.donor_name || 'Anonymous'}
                            </p>
                            {(pledge.donor_email || pledge.email) && (
                              <p style={{ margin: 0, color: '#718096', fontSize: '0.75rem' }}>
                                {pledge.donor_email || pledge.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#1a202c', fontWeight: '600' }}>
                          UGX {parseFloat(pledge.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              backgroundColor:
                                pledge.status === 'paid'
                                  ? '#d1fae5'
                                  : pledge.status === 'pending'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                              color:
                                pledge.status === 'paid'
                                  ? '#065f46'
                                  : pledge.status === 'pending'
                                    ? '#92400e'
                                    : '#991b1b',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            }}
                          >
                            {pledge.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.875rem' }}>
                          {pledgeDate
                            ? new Date(pledgeDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


