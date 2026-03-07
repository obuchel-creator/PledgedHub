import React, { useEffect } from 'react';
import OnboardingModal from '../components/OnboardingModal';
import useOnboardingModal from '../hooks/useOnboardingModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import useDashboardData from '../hooks/useDashboardData';
import DashboardMetrics from '../components/DashboardMetrics';
import PledgesList from '../components/PledgesList';
import PledgeFormSection from '../components/PledgeFormSection';
import Logo from '../components/Logo';
import RecentPayments from '../components/RecentPayments';
import ReferralShare from '../components/ReferralShare';
import ShareButton from '../components/ShareButton';

/**
 * Dashboard Screen - Professional Main Dashboard
 * Displays pledge metrics, list, form, and recent payments
 * Fully refactored with extracted components for maintainability
 */
function Dashboard() {
  const { user } = useAuth();
  const [showOnboarding, closeOnboarding] = useOnboardingModal(user);
  const {
    loading,
    pledges,
    payments,
    paymentsError,
    pledgeForm,
    pledgeMessage,
    creatingPledge,
    handlePledgeFieldChange,
    handlePledgeSubmit,
    resetPledgeForm,
  } = useDashboardData();

  // Format large numbers to short form
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  // Inject critical CSS directly into document head (bypasses ALL caching)
  useEffect(() => {
    const styleId = 'milestone-fix-critical';
    let styleTag = document.getElementById(styleId);
    
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
      .achievement-stat {
        max-width: 40px !important;
        min-width: 40px !important;
        width: 40px !important;
        overflow: hidden !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }
      .achievement-stat strong {
        font-size: 0.55rem !important;
        line-height: 1.1 !important;
        max-width: 40px !important;
        width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        display: block !important;
        padding: 0 !important;
        margin: 0 0 1px 0 !important;
        box-sizing: border-box !important;
      }
      .achievement-stat span {
        font-size: 0.4rem !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        display: block !important;
        max-width: 40px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .achievement-stats {
        gap: 0.3rem !important;
        display: flex !important;
        align-items: center !important;
      }
    `;
  }, []);

  // Pre-fill phone from user profile if available
  useEffect(() => {
    if (user?.phone && !pledgeForm.phone) {
      handlePledgeFieldChange({
        target: { name: 'phone', value: user.phone },
      });
    }
  }, [user?.phone, pledgeForm.phone, handlePledgeFieldChange]);


  if (loading) {
    return (
      <>
        <OnboardingModal isOpen={false} onClose={closeOnboarding} />
        <main className="page page--wide" aria-busy="true" aria-label="Loading dashboard">
          <div className="loading-state" role="status" aria-live="polite">
            ⏳ Loading pledges and recent payments...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
      <style dangerouslySetInnerHTML={{__html: `
        .achievement-stats {
          display: flex !important;
          gap: 0.4rem !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }
        .achievement-stat {
          max-width: 45px !important;
          min-width: 45px !important;
          width: 45px !important;
          overflow: hidden !important;
          flex-shrink: 0 !important;
          text-align: center !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 1px !important;
        }
        .achievement-stat strong {
          font-size: 0.6rem !important;
          max-width: 45px !important;
          width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          display: block !important;
          font-weight: 700 !important;
          line-height: 1 !important;
        }
        .achievement-stat span {
          font-size: 0.45rem !important;
          white-space: nowrap !important;
          display: block !important;
          opacity: 0.85 !important;
          max-width: 45px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .stat-separator {
          opacity: 0.5 !important;
          padding: 0 2px !important;
          flex-shrink: 0 !important;
          font-size: 0.6rem !important;
        }
      `}} />
      <main className="page page--wide" role="main" aria-label="Dashboard">
        {/* Dashboard Header with Metrics */}
        <div className="dashboard-header">
          <div className="dashboard-header__content" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Logo size="xlarge" showText={false} />
            <div>
              <h1 className="dashboard-header__title">Dashboard</h1>
              <p className="dashboard-header__subtitle">
                Manage your pledges, track collection, and monitor donor engagement
              </p>
            </div>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <DashboardMetrics pledges={pledges} payments={payments} />

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Pledges List Section */}
          <div className="dashboard-grid__section dashboard-grid__section--primary">
            <PledgesList pledges={pledges} isLoading={false} />
          </div>

          {/* Pledge Form Section */}
          <div className="dashboard-grid__section dashboard-grid__section--secondary">
            <PledgeFormSection
              onSubmit={handlePledgeSubmit}
              pledgeForm={pledgeForm}
              onFieldChange={handlePledgeFieldChange}
              isSubmitting={creatingPledge}
              message={pledgeMessage}
            />
          </div>

          {/* Recent Payments Section */}
          <div className="dashboard-grid__section dashboard-grid__section--primary">
            <RecentPayments payments={payments} error={paymentsError} />
          </div>

          {/* Referral & Sharing */}
          <div className="dashboard-grid__section dashboard-grid__section--secondary">
            <section className="card card--glass" aria-labelledby="sharing-title">
              <h2 id="sharing-title" className="sr-only">Referral and Sharing</h2>
              <ReferralShare style="card" />
            </section>
          </div>

          {/* Achievement Section - Shown when milestones reached */}
          {pledges.length >= 5 && (
            <div className="dashboard-grid__section dashboard-grid__section--full">
              <section
                className="card card--achievement"
                aria-labelledby="achievement-title"
              >
                <div className="achievement-content">
                  <div className="achievement-info">
                    <h2 id="achievement-title" className="achievement-title">
                      🏆 Milestone Unlocked!
                    </h2>
                    <p className="achievement-description">
                      You've successfully collected <strong>{pledges.length}</strong> pledges! 
                      Share this achievement with your network.
                    </p>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      maxWidth: '40px',
                      minWidth: '40px',
                      width: '40px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px'
                    }}>
                      <strong style={{
                        fontSize: '0.55rem',
                        maxWidth: '40px',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        padding: 0,
                        margin: '0 0 1px 0'
                      }}>{pledges.length}</strong>
                      <span style={{
                        fontSize: '0.4rem',
                        whiteSpace: 'nowrap',
                        display: 'block',
                        opacity: 0.85,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '40px'
                      }}>Pledges</span>
                    </div>
                    {payments.length > 0 && (
                      <>
                        <span style={{
                          opacity: 0.5,
                          padding: '0 1px',
                          flexShrink: 0,
                          fontSize: '0.5rem'
                        }}>•</span>
                        <div style={{
                          maxWidth: '40px',
                          minWidth: '40px',
                          width: '40px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1px'
                        }}>
                          <strong style={{
                            fontSize: '0.55rem',
                            maxWidth: '40px',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            padding: 0,
                            margin: '0 0 1px 0'
                          }}>{payments.length}</strong>
                          <span style={{
                            fontSize: '0.4rem',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            opacity: 0.85,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '40px'
                          }}>Payments</span>
                        </div>
                      </>
                    )}
                    {pledges.length > 0 && (
                      <>
                        <span style={{
                          opacity: 0.5,
                          padding: '0 1px',
                          flexShrink: 0,
                          fontSize: '0.5rem'
                        }}>•</span>
                        <div style={{
                          maxWidth: '40px',
                          minWidth: '40px',
                          width: '40px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1px'
                        }}>
                          <strong style={{
                            fontSize: '0.55rem',
                            maxWidth: '40px',
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            padding: 0,
                            margin: '0 0 1px 0'
                          }}>
                            {formatNumber(pledges.reduce((sum, p) => sum + (p.amount || 0), 0))}
                          </strong>
                          <span style={{
                            fontSize: '0.4rem',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            opacity: 0.85,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '40px'
                          }}>Total</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="achievement-action">
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
          </div>
        )}
      </div>
    </main>
    </>
  );
}


// Add Dashboard.propTypes here if/when props are introduced in the future.

export default Dashboard;


