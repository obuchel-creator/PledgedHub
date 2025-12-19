import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCampaignDetails } from '../services/api';
import ShareButton from '../components/ShareButton';

export default function CampaignDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCampaignDetails();
  }, [id]);

  const loadCampaignDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCampaignDetails(id);

      if (result?.success && result?.data) {
        setCampaign(result.data);
      } else {
        setError(result?.error || 'Failed to load campaign details');
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setError('Failed to load campaign details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981'; // Green
    if (percentage >= 75) return '#3b82f6'; // Blue
    if (percentage >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: `${color}20`,
          color: color,
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    );
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
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#2563eb' }}>
            Loading campaign details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '1rem' }}>⚠️ {error}</p>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = campaign.stats?.progressPercentage || 0;
  const progressColor = getProgressColor(progressPercentage);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1
                style={{
                  color: 'white',
                  fontSize: '2.5rem',
                  margin: '0 0 0.5rem 0',
                  fontWeight: '700',
                }}
              >
                {campaign.title}
              </h1>
              {campaign.description && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', margin: 0 }}>
                  {campaign.description}
                </p>
              )}
            </div>
            <div style={{ paddingTop: '0.5rem' }}>
              <ShareButton
                contentType="campaign"
                contentData={{
                  title: campaign.title,
                  goalAmount: campaign.goal_amount,
                  raisedAmount: campaign.stats?.totalPledged || 0,
                }}
                contentId={campaign.id}
                shareUrl={`${window.location.origin}/campaigns/${campaign.id}`}
                style="button"
                size="medium"
              />
            </div>
          </div>
        </div>

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
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              GOAL AMOUNT
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              UGX {campaign.goal_amount?.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              TOTAL PLEDGED
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>
              UGX {campaign.stats?.totalPledged?.toLocaleString() || 0}
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              TOTAL PAID
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              UGX {campaign.stats?.totalPaid?.toLocaleString() || 0}
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              PLEDGE COUNT
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {campaign.stats?.pledgeCount || 0}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              Campaign Progress
            </h2>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: progressColor }}>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '24px',
              background: '#f3f4f6',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                width: `${Math.min(progressPercentage, 100)}%`,
                height: '100%',
                background: progressColor,
                transition: 'width 0.3s ease',
                borderRadius: '12px',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              fontSize: '0.875rem',
            }}
          >
            <div>
              <span style={{ color: '#6b7280' }}>Pending: </span>
              <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                UGX {campaign.stats?.totalPending?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Overdue: </span>
              <span style={{ fontWeight: '600', color: '#ef4444' }}>
                UGX {campaign.stats?.totalOverdue?.toLocaleString() || 0}
              </span>
            </div>
            {campaign.suggested_amount && (
              <div>
                <span style={{ color: '#6b7280' }}>Donors Needed: </span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>
                  {campaign.stats?.donorsNeeded || 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pledges Table */}
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              Campaign Pledges
            </h2>
            <button
              onClick={() => navigate('/create')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              + Add Pledge
            </button>
          </div>

          {campaign.pledges && campaign.pledges.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}
                    >
                      DONOR
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}
                    >
                      EMAIL
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}
                    >
                      AMOUNT
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}
                    >
                      STATUS
                    </th>
                    <th
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#6b7280',
                      }}
                    >
                      COLLECTION DATE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.pledges.map((pledge) => (
                    <tr key={pledge.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{pledge.donor_name}</td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>{pledge.donor_email}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                        UGX {parseFloat(pledge.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {getStatusBadge(pledge.status)}
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280' }}>
                        {new Date(pledge.collection_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                No pledges yet for this campaign
              </p>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                Create First Pledge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


