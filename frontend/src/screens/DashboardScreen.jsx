import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import useDashboardData from '../hooks/useDashboardData';
import DashboardMetrics from '../components/DashboardMetrics';
import PledgesList from '../components/PledgesList';
import PledgeFormSection from '../components/PledgeFormSection';
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
      <main className="page page--wide" aria-busy="true" aria-label="Loading dashboard">
        <div className="loading-state" role="status" aria-live="polite">
          ⏳ Loading pledges and payments...
        </div>
      </main>
    );
  }

  return (
    <main className="page page--wide" role="main" aria-label="Dashboard">
      {/* Dashboard Header with Metrics */}
      <div className="dashboard-header">
        <div className="dashboard-header__content">
          <h1 className="dashboard-header__title">Dashboard</h1>
          <p className="dashboard-header__subtitle">
            Manage your pledges, track collection, and monitor donor engagement
          </p>
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
          <RecentPayments payments={payments} />
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
                  <div className="achievement-stats">
                    <span className="achievement-stat">
                      <strong>{pledges.length}</strong> Pledges
                    </span>
                    {payments.length > 0 && (
                      <>
                        <span className="achievement-stat__divider">•</span>
                        <span className="achievement-stat">
                          <strong>{payments.length}</strong> Payments
                        </span>
                      </>
                    )}
                    {pledges.length > 0 && (
                      <>
                        <span className="achievement-stat__divider">•</span>
                        <span className="achievement-stat">
                          <strong>{formatCurrency(pledges.reduce((sum, p) => sum + (p.amount || 0), 0))}</strong> Total
                        </span>
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
  );
}


// Add Dashboard.propTypes here if/when props are introduced in the future.

export default Dashboard;


