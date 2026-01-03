import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import '../styles/dashboard.css';

function DashboardScreen() {
  const navigate = useNavigate();
  const { stats, pledges, loading, error } = useDashboardData();

  // Format large numbers to prevent overflow
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <>
      {/* Ultra aggressive inline styles - v3 cache bust */}
      <style dangerouslySetInnerHTML={{__html: `
        .achievement-stat {
          max-width: 50px !important;
          min-width: 50px !important;
          width: 50px !important;
          overflow: hidden !important;
          flex-shrink: 0 !important;
        }
        .achievement-stat strong {
          font-size: 0.65rem !important;
          max-width: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          display: block !important;
          padding: 0 !important;
          margin: 0 0 2px 0 !important;
        }
        .achievement-stat span {
          font-size: 0.45rem !important;
          white-space: nowrap !important;
          display: block !important;
        }
        .achievement-stats {
          gap: 0.4rem !important;
        }
        .stat-card .stat-value {
          font-size: 1.25rem !important;
          word-break: break-word !important;
          max-width: 100% !important;
        }
      `}} />
      
      <main className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome to PledgeHub</h1>
          <p>Manage your pledges efficiently</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Pledges</h3>
            <div className="stat-value">{stats?.totalPledges || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Campaigns</h3>
            <div className="stat-value">{stats?.activeCampaigns || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Amount</h3>
            <div className="stat-value">
              UGX {(stats?.totalAmount || 0).toLocaleString()}
            </div>
          </div>
          <div className="stat-card">
            <h3>Collection Rate</h3>
            <div className="stat-value">{stats?.collectionRate || 0}%</div>
          </div>
        </div>

        {/* Milestone Section with EXTREME constraints */}
        {pledges && pledges.length >= 5 && (
          <div className="milestone-section" style={{ overflow: 'hidden' }}>
            <div className="milestone-content">
              <div className="milestone-text">
                <h2>🎉 Milestone Unlocked!</h2>
                <p>Keep up the great work managing pledges</p>
              </div>
              <div className="achievement-stats" style={{ gap: '0.4rem', display: 'flex', alignItems: 'center' }}>
                {/* Pledges */}
                <div className="achievement-stat" style={{ 
                  width: '50px', 
                  maxWidth: '50px', 
                  minWidth: '50px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <strong style={{ 
                    fontSize: '0.65rem',
                    display: 'block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    padding: 0
                  }}>
                    {stats?.totalPledges || 0}
                  </strong>
                  <span style={{ 
                    fontSize: '0.45rem',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}>
                    Pledges
                  </span>
                </div>
                
                <div className="stat-separator" style={{ opacity: 0.5 }}>•</div>
                
                {/* Total Amount - MOST CRITICAL */}
                <div className="achievement-stat" style={{ 
                  width: '50px', 
                  maxWidth: '50px', 
                  minWidth: '50px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <strong style={{ 
                    fontSize: '0.65rem',
                    display: 'block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    padding: 0
                  }}>
                    {formatNumber(stats?.totalAmount || 0)}
                  </strong>
                  <span style={{ 
                    fontSize: '0.45rem',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}>
                    Total
                  </span>
                </div>
                
                <div className="stat-separator" style={{ opacity: 0.5 }}>•</div>
                
                {/* Campaigns */}
                <div className="achievement-stat" style={{ 
                  width: '50px', 
                  maxWidth: '50px', 
                  minWidth: '50px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <strong style={{ 
                    fontSize: '0.65rem',
                    display: 'block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    padding: 0
                  }}>
                    {stats?.activeCampaigns || 0}
                  </strong>
                  <span style={{ 
                    fontSize: '0.45rem',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}>
                    Campaigns
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn primary" onClick={() => navigate('/pledges/create')}>
            Create New Pledge
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/pledges')}>
            View All Pledges
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/campaigns')}>
            Manage Campaigns
          </button>
        </div>

        {/* Recent Pledges */}
        {pledges && pledges.length > 0 && (
          <div className="recent-pledges">
            <h2>Recent Pledges</h2>
            <div className="pledges-list">
              {pledges.slice(0, 5).map(pledge => (
                <div key={pledge.id} className="pledge-item" onClick={() => navigate(`/pledges/${pledge.id}`)}>
                  <div className="pledge-info">
                    <strong>{pledge.donor_name || pledge.donorName || 'Anonymous'}</strong>
                    <span>UGX {(pledge.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="pledge-status">
                    <span className={`status-badge ${pledge.status}`}>{pledge.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default DashboardScreen;
