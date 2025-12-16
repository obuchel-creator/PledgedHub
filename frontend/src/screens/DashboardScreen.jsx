import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateShort, formatDateTime } from '../utils/formatters';
import { parsePledgeMessage } from '../utils/pledgeHelpers';
import { PLEDGE_PURPOSE_OPTIONS } from '../constants/pledge';
import useDashboardData from '../hooks/useDashboardData';
import ShareButton from '../components/ShareButton';
import ReferralShare from '../components/ReferralShare';

// ...all hooks, state, handlers, and helpers above...

function Dashboard() {
  const { user } = useAuth();
  // Custom hook to fetch pledges and payments, and manage form state
  const {
    loading,
    pledges,
    payments,
    pledgeForm,
    pledgeMessage,
    creatingPledge,
    handlePledgeFieldChange,
    handlePledgeSubmit,
    resetPledgeForm,
  } = useDashboardData();

  // Pre-fill pledgeForm.phone with user.phone if not already set
  useEffect(() => {
    if (user && user.phone && !pledgeForm.phone) {
      handlePledgeFieldChange({
        target: { name: 'phone', value: user.phone }
      });
    }
  }, [user, pledgeForm.phone, handlePledgeFieldChange]);

  return (
    <main className="page page--wide" aria-labelledby="dashboard-title">
      {loading ? (
        <div className="loading-state" aria-live="polite">
          Loading pledges and recent payments...
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Pledges Section */}
          <section className="card" id="pledges-section" aria-labelledby="dashboard-pledges-title">
            <h2 id="dashboard-pledges-title" className="card__title">
              Pledges
            </h2>
            <p className="card__subtitle">
              Active pledges from supporters.{' '}
              {pledges.length > 0 &&
                `Showing ${pledges.length} pledge${pledges.length > 1 ? 's' : ''}.`}
            </p>
            {pledges.length === 0 ? (
              <div className="empty-state" aria-live="polite">
                <p>No pledges found. Start one to rally your supporters.</p>
                <div className="empty-state__actions">
                  <Link to="/create" className="btn btn-primary btn--small">
                    Create a pledge
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '1rem' }}>
                <ul className="list list--divided" aria-live="polite">
                  {pledges.map((pledge, index) => {
                    const id = pledge?.id || pledge?._id || pledge?.pledgeId || index;
                    const baseTitle = pledge?.title || pledge?.name || `Pledge ${id}`;
                    const details = parsePledgeMessage(pledge?.message);
                    const purposeDisplay = details.purpose || baseTitle;
                    const donorName = pledge?.donorName || pledge?.fullName || 'Anonymous';
                    const pledgeDateDisplay = formatDateShort(details.pledgeDate || pledge?.date);
                    const collectionDateDisplay = formatDateShort(details.collectionDate);
                    const amountDisplay =
                      formatCurrency(pledge?.amount ?? pledge?.goal) || 'Amount unavailable';
                    return (
                      <li key={id} className="list-item">
                        <div className="list-item__meta">
                          <span
                            className="list-item__title"
                            style={{ color: '#9333ea', fontWeight: '600' }}
                          >
                            {amountDisplay}
                          </span>
                          <span className="list-item__subtitle" style={{ fontWeight: '500' }}>
                            {purposeDisplay} • {donorName}
                          </span>
                          <span className="list-item__subtitle" style={{ fontSize: '0.875rem' }}>
                            Pledged: {pledgeDateDisplay}{' '}
                            {collectionDateDisplay && `• Due: ${collectionDateDisplay}`}
                          </span>
                        </div>
                        <div
                          className="list-item__actions"
                          style={{ display: 'flex', gap: '0.5rem' }}
                        >
                          <Link
                            to={`/pledges/${id}`}
                            className="btn btn-ghost btn--small"
                            style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Make a Pledge Section */}
          <section
            className="card card--glass"
            id="make-pledge"
            aria-labelledby="dashboard-make-pledge-title"
          >
            <h2 id="dashboard-make-pledge-title" className="card__title">
              Make a pledge
            </h2>
            <p className="card__subtitle">
              Capture wedding pledges with contact details and pickup dates so nothing slips through
              the cracks.
            </p>
            {pledgeMessage.text && (
              <div
                className={`alert ${pledgeMessage.type === 'error' ? 'alert--error' : 'alert--success'}`}
                role={pledgeMessage.type === 'error' ? 'alert' : 'status'}
              >
                {pledgeMessage.text}
              </div>
            )}
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <form
                className="form"
                onSubmit={handlePledgeSubmit}
                noValidate
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div className="form-grid form-grid--two" style={{ gap: '1.25rem' }}>
                  <div className="form-field">
                    <label htmlFor="pledge-fullName" className="form-label">
                      Pledger name *
                    </label>
                    <input
                      id="pledge-fullName"
                      name="fullName"
                      type="text"
                      className="input"
                      value={pledgeForm.fullName}
                      onChange={handlePledgeFieldChange}
                      autoComplete="name"
                      placeholder="e.g. Sarah Namaganda"
                      disabled={creatingPledge}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="pledge-phone" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      id="pledge-phone"
                      name="phone"
                      type="tel"
                      className="input"
                      value={pledgeForm.phone || ''}
                      onChange={handlePledgeFieldChange}
                      placeholder="e.g. +256700000000"
                      disabled={creatingPledge}
                      required
                    />
                    <small
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      Required for SMS/WhatsApp reminders
                    </small>
                  </div>
                </div>
                <div className="form-grid form-grid--two" style={{ gap: '1.25rem' }}>
                  <div className="form-field">
                    <label htmlFor="pledge-email" className="form-label">
                      Email (Optional)
                    </label>
                    <input
                      id="pledge-email"
                      name="email"
                      type="email"
                      className="input"
                      value={pledgeForm.email || ''}
                      onChange={handlePledgeFieldChange}
                      placeholder="e.g. sarah@example.com"
                      disabled={creatingPledge}
                    />
                    <small
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      Optional - for email notifications
                    </small>
                  </div>
                  <div className="form-field">
                    <label htmlFor="pledge-amount" className="form-label">
                      Amount pledged (UGX) *
                    </label>
                    <input
                      id="pledge-amount"
                      name="amount"
                      type="number"
                      min="0"
                      max="500000000"
                      step="1000"
                      className="input"
                      value={pledgeForm.amount}
                      onChange={handlePledgeFieldChange}
                      placeholder="e.g. 500000"
                      disabled={creatingPledge}
                      required
                    />
                    <small
                      style={{
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block',
                      }}
                    >
                      Maximum: 500,000,000 UGX
                    </small>
                  </div>
                </div>
                <div className="form-grid form-grid--two" style={{ gap: '1.25rem' }}>
                  <div className="form-field">
                    <label htmlFor="pledge-purpose" className="form-label">
                      What are you pledging for? *
                    </label>
                    <select
                      id="pledge-purpose"
                      name="purpose"
                      className="select"
                      value={pledgeForm.purpose}
                      onChange={handlePledgeFieldChange}
                      disabled={creatingPledge}
                    >
                      {PLEDGE_PURPOSE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {pledgeForm.purpose === 'Other' && (
                  <div className="form-field" style={{ marginTop: '-0.5rem' }}>
                    <label htmlFor="pledge-customPurpose" className="form-label">
                      Describe the pledge
                    </label>
                    <input
                      id="pledge-customPurpose"
                      name="customPurpose"
                      type="text"
                      className="input"
                      value={pledgeForm.customPurpose}
                      onChange={handlePledgeFieldChange}
                      placeholder="e.g. Choir honorarium"
                      disabled={creatingPledge}
                      required
                    />
                  </div>
                )}
                <div className="form-grid form-grid--two" style={{ gap: '1.25rem' }}>
                  <div className="form-field">
                    <label htmlFor="pledge-date" className="form-label">
                      Date pledged
                    </label>
                    <input
                      id="pledge-date"
                      name="pledgeDate"
                      type="date"
                      className="input"
                      value={pledgeForm.pledgeDate}
                      onChange={handlePledgeFieldChange}
                      disabled={creatingPledge}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label
                      htmlFor="pledge-collectionDate"
                      className="form-label"
                      style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '600' }}
                    >
                      When will the pledge be fulfilled?
                    </label>
                    <input
                      id="pledge-collectionDate"
                      name="collectionDate"
                      type="date"
                      className="input"
                      value={pledgeForm.collectionDate}
                      onChange={handlePledgeFieldChange}
                      disabled={creatingPledge}
                    />
                    <p
                      className="form-hint"
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '1rem',
                        color: '#ffffff',
                        fontWeight: '600',
                        lineHeight: '1.5',
                      }}
                    >
                      Expected fulfillment or delivery date (optional)
                    </p>
                  </div>
                </div>
                <div
                  className="form-actions"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'nowrap',
                    marginTop: '1.5rem',
                    paddingRight: '1rem',
                    overflow: 'visible',
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingPledge}
                    style={{
                      flex: '0 0 auto',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content',
                      background: creatingPledge
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: '700',
                      padding: '0.7rem 1.1rem',
                      fontSize: '0.9rem',
                      border: 'none',
                      borderRadius: '10px',
                      boxShadow: creatingPledge ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                      cursor: creatingPledge ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {creatingPledge ? (
                      <>
                        <span
                          style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}
                        >
                          ⏳
                        </span>
                        Saving...
                      </>
                    ) : (
                      <>✅ Record</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetPledgeForm}
                    disabled={creatingPledge}
                    style={{
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '2px solid #e2e8f0',
                      fontWeight: '600',
                      padding: '0.6rem 1rem',
                      flex: '0 0 auto',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      cursor: creatingPledge ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    🔄 Reset
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Payments Section */}
          <section
            className="card"
            id="payments-section"
            aria-labelledby="dashboard-payments-title"
          >
            <h2 id="dashboard-payments-title" className="card__title">
              Recent payments
            </h2>
            <p className="card__subtitle">
              Latest donations logged across campaigns.{' '}
              {payments.length > 0 &&
                `Showing ${payments.length} payment${payments.length > 1 ? 's' : ''}.`}
            </p>
            {payments.length === 0 ? (
              <div className="empty-state" aria-live="polite">
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '1rem' }}>
                <ul className="list list--divided" aria-live="polite">
                  {payments.map((payment, index) => {
                    const id =
                      payment?.id || payment?._id || `${payment?.pledge_id || 'pledge'}-${index}`;
                    const amount = formatCurrency(payment?.amount) || 'Amount unavailable';
                    const pledgeLabel =
                      payment?.pledgeTitle ||
                      payment?.pledgeName ||
                      (payment?.pledgeDonor ? `Pledge from ${payment.pledgeDonor}` : null) ||
                      `Pledge #${payment?.pledge_id || ''}`;
                    const paymentMethod = payment?.payment_method || 'Unknown';
                    const methodDisplay = paymentMethod
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    return (
                      <li key={id} className="list-item">
                        <div className="list-item__meta">
                          <span
                            className="list-item__title"
                            style={{ color: '#10b981', fontWeight: '600' }}
                          >
                            {amount}
                          </span>
                          <span className="list-item__subtitle" style={{ fontWeight: '500' }}>
                            {pledgeLabel}
                          </span>
                          <span className="list-item__subtitle" style={{ fontSize: '0.875rem' }}>
                            {methodDisplay} •{' '}
                            {formatDateTime(
                              payment?.created_at || payment?.createdAt || payment?.date,
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Referral & Sharing Section */}
          <section className="card card--glass" aria-labelledby="dashboard-sharing-title">
            <ReferralShare style="card" />
          </section>

          {/* Achievement Sharing (if user has milestones) */}
          {pledges.length >= 5 && (
            <section
              className="card"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                color: 'white',
                border: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
                    🏆 Milestone Unlocked!
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', opacity: 0.95, fontSize: '1rem' }}>
                    You've received {pledges.length} pledges! Share this achievement with your network.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total pledges: {pledges.length}</span>
                    {payments.length > 0 && (
                      <>
                        <span style={{ opacity: 0.7 }}>•</span>
                        <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Payments: {payments.length}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <ShareButton
                    contentType="achievement"
                    contentData={{
                      milestone: `${pledges.length} Pledges`,
                      description: `I've successfully collected ${pledges.length} pledges on PledgeHub! 🎉`,
                    }}
                    shareUrl={`${window.location.origin}/dashboard`}
                    style="button"
                    size="medium"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}


// Add Dashboard.propTypes here if/when props are introduced in the future.

export default Dashboard;
