import React, { useEffect, useState } from 'react';
import { getAnalyticsOverview, getTopDonors, getAtRiskPledges } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsDashboard() {
  const { token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [topDonors, setTopDonors] = useState([]);
  const [atRiskPledges, setAtRiskPledges] = useState([]);

  useEffect(() => {
    // Only load analytics when auth is ready and token exists
    if (!authLoading && token) {
      console.log('📊 [ANALYTICS] Auth ready, loading analytics...');
      loadAnalytics();
    } else if (!authLoading && !token) {
      console.warn('⚠️ [ANALYTICS] No token available');
      setError('Please log in to view analytics');
      setLoading(false);
    }
  }, [authLoading, token]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');

    console.log('🔄 [ANALYTICS] Fetching analytics data...');
    console.log('🔑 [ANALYTICS] Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    try {
      const [overviewData, donorsData, atRiskData] = await Promise.all([
        getAnalyticsOverview(),
        getTopDonors(5),
        getAtRiskPledges(),
      ]);

      console.log('✅ [ANALYTICS] Data loaded successfully');
      setOverview(overviewData);
      setTopDonors(Array.isArray(donorsData) ? donorsData : []);
      setAtRiskPledges(Array.isArray(atRiskData) ? atRiskData : []);
    } catch (err) {
      console.error('❌ [ANALYTICS] Error loading analytics:', err);
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${Math.round(value || 0)}%`;
  };

  if (loading) {
    return (
      <div
        className="analytics-loading"
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p style={{ color: '#cbd5e1' }}>Loading AI-powered insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="alert alert--error"
        role="alert"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
        }}
      >
        <strong>Analytics Error:</strong> {error}
      </div>
    );
  }

  return (
    <div
      className="analytics-dashboard"
      style={{
        display: 'grid',
        gap: '1.5rem',
        marginTop: '2rem',
      }}
    >
      {/* AI-Powered Overview */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            🤖
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#ffffff',
              }}
            >
              AI Analytics Overview
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Smart Analytics & Insights
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
          }}
        >
          <div
            className="stat-card"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>
              Total Pledged
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#60a5fa',
              }}
            >
              {formatCurrency(overview?.totalPledged)}
            </p>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>
              Total Collected
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#4ade80',
              }}
            >
              {formatCurrency(overview?.totalCollected)}
            </p>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>
              Collection Rate
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#a78bfa',
              }}
            >
              {formatPercent(overview?.collectionRate)}
            </p>
          </div>

          <div
            className="stat-card"
            style={{
              background: 'rgba(251, 146, 60, 0.1)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>
              Active Donors
            </p>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#fb923c',
              }}
            >
              {overview?.activeDonors || 0}
            </p>
          </div>
        </div>
      </section>

      {/* Top Donors */}
      <section
        className="card"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}
        >
          <span style={{ fontSize: '1.5rem' }}>🏆</span>
          <h3
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#1e293b',
            }}
          >
            Top Donors
          </h3>
        </div>

        {topDonors.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              border: '2px dashed #cbd5e1',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p
              style={{
                color: '#1e293b',
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
              }}
            >
              No donors yet
            </p>
            <p
              style={{
                color: '#64748b',
                fontSize: '0.9rem',
                margin: 0,
              }}
            >
              Create pledges to see top donors here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topDonors.map((donor, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background:
                        index === 0
                          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                          : index === 1
                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                            : index === 2
                              ? 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)'
                              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#ffffff',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#ffffff',
                      }}
                    >
                      {donor.donor_name || 'Anonymous'}
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                      }}
                    >
                      {donor.pledge_count} {donor.pledge_count === 1 ? 'pledge' : 'pledges'}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#60a5fa',
                  }}
                >
                  {formatCurrency(donor.total_amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* At-Risk Pledges */}
      {atRiskPledges.length > 0 && (
        <section
          className="card"
          style={{
            background:
              'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#ffffff',
              }}
            >
              At-Risk Pledges
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {atRiskPledges.map((pledge, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#ffffff',
                      }}
                    >
                      {pledge.donor_name || 'Anonymous'}
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0',
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                      }}
                    >
                      Collection: {new Date(pledge.collection_date).toLocaleDateString()}
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.875rem',
                        color: '#fca5a5',
                      }}
                    >
                      {pledge.days_overdue} days overdue • {pledge.reminder_count || 0} reminders
                      sent
                    </p>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#ef4444',
                    }}
                  >
                    {formatCurrency(pledge.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


