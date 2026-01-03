import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/CampaignsScreen.css';
import ShareButton from '../components/ShareButton';

const CampaignsScreen = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const result = await getCampaigns();
      console.log('Campaigns result:', result);
      
      // Handle both wrapped and unwrapped responses
      if (result.success) {
        setCampaigns(result.data || []);
      } else if (Array.isArray(result)) {
        // Direct array response
        setCampaigns(result);
      } else if (result.data && Array.isArray(result.data)) {
        setCampaigns(result.data);
      } else {
        setError(result.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Error loading campaigns');
      console.error('Campaign fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await createCampaign(formData);
      if (result.success) {
        setShowCreateForm(false);
        setFormData({ name: '', description: '', targetAmount: '', startDate: '', endDate: '' });
        fetchCampaigns();
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Error creating campaign');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="campaigns-container">
        <div className="loading">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h1>🎯 Campaigns</h1>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ Cancel' : '+ New Campaign'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && isAdmin && (
        <div className="campaign-form-card">
          <h2>Create New Campaign</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Campaign Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetAmount">Target Amount (UGX)</label>
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">Create Campaign</button>
          </form>
        </div>
      )}

      <div className="campaigns-grid">
        {campaigns.length === 0 ? (
          <div className="no-campaigns">
            <p>No campaigns yet.</p>
            {isAdmin && <p>Create your first campaign to get started!</p>}
          </div>
        ) : (
          campaigns.map((campaign) => {
            // Prefer slug, fallback to event_code or id
            const slug = campaign.slug || campaign.event_code || campaign.id;
            return (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-header">
                  <h3>{campaign.name}</h3>
                  {campaign.status && (
                    <span className={`campaign-status ${campaign.status}`}>
                      {campaign.status}
                    </span>
                  )}
                </div>
                {campaign.description && (
                  <p className="campaign-description">{campaign.description}</p>
                )}
                {(campaign.targetAmount || campaign.goal) && (
                  <div className="campaign-stats">
                    <div className="stat">
                      <span className="label">Target:</span>
                      <span className="value">
                        UGX {parseInt(campaign.targetAmount || campaign.goal).toLocaleString()}
                      </span>
                    </div>
                    {(campaign.currentAmount || campaign.raised) && (
                      <div className="stat">
                        <span className="label">Raised:</span>
                        <span className="value">
                          UGX {parseInt(campaign.currentAmount || campaign.raised).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {(campaign.startDate || campaign.endDate || campaign.start_date || campaign.end_date) && (
                  <div className="campaign-dates">
                    {(campaign.startDate || campaign.start_date) && (
                      <div className="date">
                        📅 Start: {new Date(campaign.startDate || campaign.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {(campaign.endDate || campaign.end_date) && (
                      <div className="date">
                        🏁 End: {new Date(campaign.endDate || campaign.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Link
                      to={`/campaign/${slug}`}
                      className="btn-primary"
                      style={{
                        padding: '0.5rem 1.2rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.18)',
                        border: '1.5px solid rgba(255,255,255,0.28)',
                        color: '#1e293b',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: '0 2px 12px #3b82f633',
                        transition: 'background 0.2s, transform 0.2s',
                      }}
                    >
                      View & Pledge
                    </Link>
                    <ShareButton
                      contentType="campaign"
                      contentData={{
                        title: campaign.name,
                        goalAmount: campaign.targetAmount || campaign.goal,
                        raisedAmount: campaign.currentAmount || campaign.raised || 0,
                      }}
                      contentId={campaign.id}
                      shareUrl={`${window.location.origin}/campaign/${slug}`}
                      style="button"
                      size="medium"
                      className="btn-primary"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CampaignsScreen;


