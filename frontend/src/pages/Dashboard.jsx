import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPledges, getPayments, createPayment } from '../services/api';
import { formatFormErrorMessage } from '../utils/formErrors';

/**
 * Enhanced Dashboard component with statistics and better UX
 * - Statistics cards showing key metrics
 * - Recent activity feed
 * - Quick actions and navigation
 * - Improved visual design
 */
export default function Dashboard() {
  // UI / data state
  const [loading, setLoading] = useState(true);
  const [pledges, setPledges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // donation form state
  const [donation, setDonation] = useState({ pledgeId: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  // mounted flag persisted across renders (object avoids re-renders)
  const [mountedRef] = useState(() => ({ current: true }));

  // normalize helpers to tolerate API variations
  const normalizePledges = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.pledges && Array.isArray(res.pledges)) return res.pledges;
    return [];
  };
  const normalizePayments = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.payments && Array.isArray(res.payments)) return res.payments;
    return [];
  };

  // Fetch pledges and payments on mount
  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes, payRes] = await Promise.all([getPledges(), getPayments()]);
        const pList = normalizePledges(pRes);
        const payList = normalizePayments(payRes);

        if (mountedRef.current) {
          setPledges(pList);
          setPayments(payList);
          // set initial pledgeId to first pledge id when pledges load
          if (pList.length && !donation.pledgeId) {
            setDonation((d) => ({ ...d, pledgeId: String(pList[0].id ?? pList[0]._id ?? '') }));
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err?.message || 'Failed to load data.');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // helper to refresh data (used after successful donation)
  const refreshData = async () => {
    try {
      const [pRes, payRes] = await Promise.all([getPledges(), getPayments()]);
      const pList = normalizePledges(pRes);
      const payList = normalizePayments(payRes);
      if (mountedRef.current) {
        setPledges(pList);
        setPayments(payList);
        // ensure donation.pledgeId exists
        if (pList.length && !donation.pledgeId) {
          setDonation((d) => ({ ...d, pledgeId: String(pList[0].id ?? pList[0]._id ?? '') }));
        }
      }
    } catch (err) {
      if (mountedRef.current) setError(err?.message || 'Failed to refresh data.');
    }
  };

  // handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonation((d) => ({ ...d, [name]: value }));
  };

  // form submission with validation and API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // validation
    const pledgeId = donation.pledgeId && String(donation.pledgeId);
    const amount = parseFloat(String(donation.amount).trim());
    if (!pledgeId) {
      setError('Please select a pledge.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({ userId: null, pledgeId, amount, paymentMethod: 'manual' });
      if (!mountedRef.current) return;
      setMessage('Donation recorded successfully.');
      // clear amount but keep selected pledge
      setDonation((d) => ({ ...d, amount: '' }));
      // refresh lists
      await refreshData();
    } catch (err) {
      if (mountedRef.current) setError(formatFormErrorMessage(err?.message || 'Failed to record donation.', 'Failed to record donation. Please try again.'));
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalPledges = pledges.length;
    const totalDonations = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalPledgeAmount = pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const recentPayments = payments.slice(0, 5); // Last 5 payments

    return {
      totalPledges,
      totalDonations,
      totalPledgeAmount,
      recentPayments,
      avgDonation: payments.length > 0 ? (totalDonations / payments.length).toFixed(2) : 0,
    };
  }, [pledges, payments]);

  // small helpers for display
  const displayPledgeTitle = (p) => p.title || p.name || 'Untitled';
  const displayPledgeAmount = (p) => p.amount ?? p.total ?? p.value ?? null;
  const displayPledgeGoal = (p) => p.goal ?? p.target ?? null;
  const displayPaymentUser = (pay) =>
    (pay.user && (pay.user.name || pay.user.username)) || pay.userName || pay.name || 'Anonymous';
  const displayPaymentAmount = (pay) => pay.amount ?? pay.value ?? 'N/A';
  const displayPaymentTime = (pay) => {
    const t = pay.createdAt || pay.timestamp || pay.date;
    try {
      return t ? new Date(t).toLocaleString() : null;
    } catch {
      return String(t || '');
    }
  };

  // Enhanced styles
  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    title: {
      margin: 0,
      color: '#1f2937',
      fontSize: '2rem',
      fontWeight: 700,
    },
    quickActions: {
      display: 'flex',
      gap: '12px',
    },
    quickActionBtn: {
      padding: '10px 16px',
      background: '#0070f3',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    statValue: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1f2937',
      margin: '8px 0',
    },
    statLabel: {
      color: '#6b7280',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
    },
    section: {
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb',
    },
    sectionTitle: {
      margin: 0,
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1f2937',
    },
    sectionContent: {
      padding: '24px',
    },
    error: {
      background: '#fef2f2',
      color: '#dc2626',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '1px solid #fecaca',
    },
    success: {
      background: '#f0fdf4',
      color: '#16a34a',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '1px solid #bbf7d0',
    },
    listItem: {
      padding: '16px 0',
      borderBottom: '1px solid #f3f4f6',
    },
    listItemLast: {
      borderBottom: 'none',
    },
    pledgeItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pledgeTitle: {
      fontWeight: 600,
      color: '#1f2937',
    },
    pledgeAmount: {
      color: '#059669',
      fontWeight: 600,
    },
    paymentItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentUser: {
      fontWeight: 600,
      color: '#1f2937',
    },
    paymentAmount: {
      color: '#0070f3',
      fontWeight: 600,
    },
    paymentTime: {
      fontSize: '0.875rem',
      color: '#6b7280',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#374151',
    },
    select: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
    },
    input: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
    },
    button: {
      padding: '12px 16px',
      background: '#0070f3',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    disabledButton: {
      background: '#9ca3af',
      cursor: 'not-allowed',
    },
    loading: {
      textAlign: 'center',
      color: '#6b7280',
      padding: '40px',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <div style={styles.quickActions}>
          <Link to="/fundraise" style={styles.quickActionBtn}>
            Fundraise
          </Link>
          <Link to="/" style={{ ...styles.quickActionBtn, background: '#6b7280' }}>
            View Home
          </Link>
        </div>
      </header>

      {loading && <div style={styles.loading}>Loading dashboard...</div>}

      {!loading && (
        <>
          {error && (
            <div role="alert" aria-live="assertive" style={styles.error}>
              {error}
            </div>
          )}

          {message && (
            <div role="status" aria-live="polite" style={styles.success}>
              {message}
            </div>
          )}

          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.totalPledges}</div>
              <div style={styles.statLabel}>Total Pledges</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>${stats.totalDonations.toFixed(2)}</div>
              <div style={styles.statLabel}>Total Donations</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>${stats.totalPledgeAmount.toFixed(2)}</div>
              <div style={styles.statLabel}>Pledge Amounts</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>${stats.avgDonation}</div>
              <div style={styles.statLabel}>Avg Donation</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={styles.contentGrid}>
            {/* Recent Activity */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Recent Activity</h2>
              </div>
              <div style={styles.sectionContent}>
                {stats.recentPayments.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: '40px 0' }}>
                    No recent payments yet.
                  </p>
                ) : (
                  <div>
                    {stats.recentPayments.map((pay, index) => (
                      <div
                        key={pay.id ?? pay._id ?? JSON.stringify(pay)}
                        style={{
                          ...styles.listItem,
                          ...(index === stats.recentPayments.length - 1 ? styles.listItemLast : {}),
                        }}
                      >
                        <div style={styles.paymentItem}>
                          <div>
                            <div style={styles.paymentUser}>{displayPaymentUser(pay)}</div>
                            <div style={styles.paymentTime}>{displayPaymentTime(pay)}</div>
                          </div>
                          <div style={styles.paymentAmount}>${displayPaymentAmount(pay)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Donate */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Quick Donate</h2>
              </div>
              <div style={styles.sectionContent}>
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div>
                    <label htmlFor="pledgeId" style={styles.label}>
                      Choose a pledge
                    </label>
                    <select
                      id="pledgeId"
                      name="pledgeId"
                      value={donation.pledgeId}
                      onChange={handleChange}
                      required
                      style={styles.select}
                      aria-required="true"
                    >
                      <option value="">-- Select a pledge --</option>
                      {pledges.map((p) => {
                        const id = String(p.id ?? p._id ?? '');
                        return (
                          <option key={id} value={id}>
                            {displayPledgeTitle(p)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="amount" style={styles.label}>
                      Amount (USD)
                    </label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={donation.amount}
                      onChange={handleChange}
                      required
                      style={styles.input}
                      placeholder="0.00"
                      aria-required="true"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...styles.button,
                      ...(submitting ? styles.disabledButton : {}),
                    }}
                  >
                    {submitting ? 'Processing...' : 'Make Donation'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* All Pledges Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>All Pledges</h2>
            </div>
            <div style={styles.sectionContent}>
              {pledges.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', margin: '40px 0' }}>
                  No pledges available.{' '}
                  <Link to="/fundraise" style={{ color: '#0070f3' }}>
                    Start Fundraising
                  </Link>
                  .
                </p>
              ) : (
                <div>
                  {pledges.map((p, index) => (
                    <div
                      key={p.id ?? p._id ?? JSON.stringify(p)}
                      style={{
                        ...styles.listItem,
                        ...(index === pledges.length - 1 ? styles.listItemLast : {}),
                      }}
                    >
                      <div style={styles.pledgeItem}>
                        <div>
                          <div style={styles.pledgeTitle}>{displayPledgeTitle(p)}</div>
                          {displayPledgeGoal(p) && (
                            <div
                              style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}
                            >
                              Goal: ${displayPledgeGoal(p)}
                            </div>
                          )}
                        </div>
                        <div style={styles.pledgeAmount}>${displayPledgeAmount(p) ?? '0.00'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


