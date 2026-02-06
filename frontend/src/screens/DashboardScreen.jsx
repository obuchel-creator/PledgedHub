import React, { useEffect } from 'react';
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

  // Pre-fill name from user profile if available
  useEffect(() => {
    if (user?.name && !pledgeForm.fullName) {
      handlePledgeFieldChange({
        target: { name: 'fullName', value: user.name },
      });
    }
  }, [user?.name, pledgeForm.fullName, handlePledgeFieldChange]);

  if (loading) {
    return (
      <div className="campaigns-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="campaigns-container">
      {/* Hero/Intro Section */}
      <div className="explore-hero">
        <h1 className="explore-hero__title">Dashboard Overview</h1>
        <p className="explore-hero__desc">Manage your pledges, track collection, and monitor donor engagement in one place.</p>
      </div>

      <div className="campaigns-header">
        <h2>Dashboard</h2>
      </div>

      {/* KPI Metrics Grid */}
      <DashboardMetrics pledges={pledges} payments={payments} />

      {/* Main Content Grid (mirroring campaigns grid) */}
      <div className="campaigns-grid">
        {/* Pledges List Section */}
        <div className="campaign-card polished-card">
          <h3>Pledges</h3>
          <PledgesList pledges={pledges} isLoading={false} />
        </div>

        {/* Pledge Form Section */}
        <div className="campaign-card polished-card">
          <h3>New Pledge</h3>
          <PledgeFormSection
            onSubmit={handlePledgeSubmit}
            pledgeForm={pledgeForm}
            onFieldChange={handlePledgeFieldChange}
            isSubmitting={creatingPledge}
            message={pledgeMessage}
          />
        </div>

        {/* Recent Payments Section */}
        <div className="campaign-card polished-card">
          <h3>Recent Payments</h3>
          <RecentPayments payments={payments} error={paymentsError} />
        </div>

        {/* Referral & Sharing */}
        <div className="campaign-card polished-card">
          <h3>Referral & Sharing</h3>
          <ReferralShare style="card" />
        </div>

        {/* Achievement Section - Shown when milestones reached */}
        {pledges.length >= 5 && (
          <div className="campaign-card polished-card">
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
    </div>
  );
}


// Add Dashboard.propTypes here if/when props are introduced in the future.

export default Dashboard;


