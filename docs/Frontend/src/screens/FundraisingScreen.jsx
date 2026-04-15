import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import './FundraisingScreen.css';

export default function FundraisingScreen() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('recent');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, [filterStatus, sortBy]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        status: filterStatus,
        sort: sortBy
      }).toString();

      const response = await fetch(`/api/campaigns?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setToast({
        type: 'error',
        message: 'Failed to load fundraising campaigns',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const getProgressPercentage = (current, target) => {
    if (!target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: '#4caf50', label: 'Active' },
      upcoming: { color: '#2196f3', label: 'Upcoming' },
      completed: { color: '#9c27b0', label: 'Completed' },
      paused: { color: '#ff9800', label: 'Paused' }
    };
    const config = statusConfig[status] || statusConfig.active;
    return config;
  };

  return (
    <div className="fundraising-page">
      {/* Header Section */}
      <section className="fundraising-header">
        <div className="fundraising-header-content">
          <h1>Fundraising Campaigns</h1>
          <p>Support causes that matter. Browse active campaigns and make a difference today.</p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary btn-lg" onClick={handleCreateCampaign}>
              <span className="btn-icon">+</span>
              Create Campaign
            </button>
          )}
        </div>
      </section>

      {/* Filters & Sorting */}
      <section className="fundraising-controls">
        <div className="controls-group">
          <label htmlFor="filter-status">Filter by Status:</label>
          <select 
            id="filter-status"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="control-select"
          >
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="controls-group">
          <label htmlFor="sort-by">Sort by:</label>
          <select 
            id="sort-by"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="control-select"
          >
            <option value="recent">Most Recent</option>
            <option value="progress">Most Funded</option>
            <option value="target">Highest Goal</option>
            <option value="ending">Ending Soon</option>
          </select>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button className="btn btn-secondary" onClick={fetchCampaigns}>
            Try Again
          </button>
        </div>
      )}

      {/* Campaigns Grid */}
      {!loading && !error && (
        <section className="fundraising-grid">
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h2>No campaigns found</h2>
              <p>There are currently no {filterStatus === 'all' ? '' : filterStatus} campaigns.</p>
              {user?.role === 'admin' && (
                <button className="btn btn-primary" onClick={handleCreateCampaign}>
                  Create the first campaign
                </button>
              )}
            </div>
          ) : (
            campaigns.map((campaign) => {
              const progress = getProgressPercentage(campaign.raised || 0, campaign.goal || 1);
              const statusConfig = getStatusBadge(campaign.status);

              return (
                <div key={campaign.id} className="campaign-card">
                  {/* Campaign Image */}
                  {campaign.image && (
                    <div className="campaign-image">
                      <img src={campaign.image} alt={campaign.title} />
                      <div className="campaign-status" style={{ backgroundColor: statusConfig.color }}>
                        {statusConfig.label}
                      </div>
                    </div>
                  )}

                  {/* Campaign Content */}
                  <div className="campaign-content">
                    <h3 className="campaign-title">{campaign.title}</h3>
                    <p className="campaign-description">{campaign.description}</p>

                    {/* Progress Bar */}
                    <div className="progress-section">
                      <div className="progress-header">
                        <span className="progress-label">Progress</span>
                        <span className="progress-percent">{Math.round(progress)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="campaign-stats">
                      <div className="stat">
                        <span className="stat-label">Raised</span>
                        <span className="stat-value">{formatCurrency(campaign.raised || 0)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Goal</span>
                        <span className="stat-value">{formatCurrency(campaign.goal || 0)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Pledges</span>
                        <span className="stat-value">{campaign.pledges_count || 0}</span>
                      </div>
                    </div>

                    {/* Campaign Meta */}
                    <div className="campaign-meta">
                      <span className="meta-item">
                        📅 Ends: {formatDate(campaign.end_date)}
                      </span>
                      <span className="meta-item">
                        👥 By: {campaign.created_by_name || 'Anonymous'}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button 
                      className="btn btn-primary campaign-button"
                      onClick={() => handleViewCampaign(campaign.id)}
                    >
                      View Campaign
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


