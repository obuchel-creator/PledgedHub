import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GuestPledgeScreen.css';

export default function GuestPledgeScreen() {
  const params = useParams();
  const slug = params.slug;
  const id = params.id;
  const navigate = useNavigate();

  // Campaign data
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('+256');
  const [donorEmail, setDonorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Payment state
  const [pledgeCreated, setPledgeCreated] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mtn');

  // Load campaign
  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line
  }, [slug, id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '';
      if (slug) {
        url = `/api/public/campaigns/${slug}`;
      } else if (id) {
        url = `/api/public/campaigns/id/${id}`;
      } else {
        setError('No campaign identifier provided');
        setLoading(false);
        return;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Campaign not found');
        return;
      }

      setCampaign(data.data);
    } catch (err) {
      console.error('Error loading campaign:', err);
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!campaign) return 0;
    return Math.min(100, (campaign.raised_amount / campaign.goal_amount) * 100);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(num);
  };

  const normalizePhone = (phone) => {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) {
      normalized = '256' + normalized.substring(1);
    } else if (!normalized.startsWith('256')) {
      normalized = '256' + normalized;
    }
    return normalized;
  };

  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid amount');
      return;
    }

    const normalizedPhone = normalizePhone(donorPhone);
    if (!normalizedPhone.match(/^256\d{9}$/)) {
      setSubmitError('Invalid phone number. Must be 256XXXXXXXXX');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch('/api/public/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_slug: slug,
          amount: parseFloat(amount),
          donor_name: donorName || 'Anonymous',
          donor_phone: normalizedPhone,
          donor_email: donorEmail || null
        })
      });

      const data = await res.json();

      if (!data.success) {
        setSubmitError(data.error || 'Failed to create pledge');
        return;
      }

      // Pledge created successfully
      setPledgeCreated(data.data);
    } catch (err) {
      console.error('Error creating pledge:', err);
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!pledgeCreated) return;

    try {
      const res = await fetch(
        `/api/public/pledges/${pledgeCreated.pledgeId}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: paymentMethod,
            donor_phone: normalizePhone(donorPhone)
          })
        }
      );

      const data = await res.json();

      if (!data.success) {
        setSubmitError(data.error || 'Payment failed');
        return;
      }

      // Show success
      alert(`Payment initiated! Receipt #${pledgeCreated.receiptNumber}\n\nCheck your phone for payment prompt.`);
      
      // Refresh campaign
      loadCampaign();
    } catch (err) {
      console.error('Payment error:', err);
      setSubmitError('Payment failed. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="guest-pledge-container">
        <div className="loading">⏳ Loading campaign...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="guest-pledge-container">
        <div className="error-box">
          <h2>Campaign Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>← Back</button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  // If pledge created, show payment screen
  if (pledgeCreated) {
    return (
      <div className="guest-pledge-container">
        <div className="receipt-card">
          <div className="receipt-header">
            <div className="checkmark">✓</div>
            <h2>Pledge Created!</h2>
          </div>

          <div className="receipt-details">
            <p className="receipt-number">Receipt #{pledgeCreated.receiptNumber}</p>
            <p className="pledge-amount">
              {formatCurrency(pledgeCreated.amount)}
            </p>
            <p className="campaign-name">{campaign.title}</p>
          </div>

          <div className="payment-section">
            <h3>💳 Now Complete Your Payment</h3>

            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  value="mtn"
                  checked={paymentMethod === 'mtn'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>📱 MTN Mobile Money</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  value="airtel"
                  checked={paymentMethod === 'airtel'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>📱 Airtel Money</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>🏦 Bank Transfer</span>
              </label>
            </div>

            {submitError && <div className="error-message">{submitError}</div>}

            <button
              onClick={handlePayment}
              className="pay-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Processing...' : `Pay ${formatCurrency(pledgeCreated.amount)}`}
            </button>

            <button
              onClick={() => {
                setPledgeCreated(null);
                setAmount('');
              }}
              className="back-button"
            >
              ← Create Another Pledge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main pledge form
  const progress = calculateProgress();
  const remaining = campaign.goal_amount - campaign.raised_amount;
  
  return (
    <div className="guest-pledge-container">
      {/* Hero Banner */}
      <div className="campaign-hero">
        <div className="hero-badge">🎯 Active Campaign</div>
        <h1 className="hero-title">{campaign.title}</h1>
        {campaign.description && (
          <p className="hero-description">{campaign.description}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card raised">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(campaign.raised_amount)}</div>
            <div className="stat-label">Raised</div>
          </div>
        </div>
        
        <div className="stat-card goal">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(campaign.goal_amount)}</div>
            <div className="stat-label">Goal</div>
          </div>
        </div>
        
        <div className="stat-card backers">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{campaign.pledgeCount || 0}</div>
            <div className="stat-label">{campaign.pledgeCount === 1 ? 'Backer' : 'Backers'}</div>
          </div>
        </div>
        
        <div className="stat-card remaining">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(progress)}%</div>
            <div className="stat-label">Funded</div>
          </div>
        </div>
      </div>

      {/* Progress Bar - Enhanced */}
      <div className="progress-card">
        <div className="progress-header">
          <span className="progress-percent">{Math.round(progress)}% Complete</span>
          <span className="progress-remaining">{formatCurrency(remaining)} to go</span>
        </div>
        <div className="progress-bar-modern">
          <div 
            className="progress-fill-modern" 
            style={{ width: `${progress}%` }}
          >
            <div className="progress-shine"></div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="pledge-layout">
        {/* Left Column - Recent Activity */}
        <div className="activity-column">
          {campaign.recentPledges && campaign.recentPledges.length > 0 && (
            <div className="recent-pledges-modern">
              <h3 className="section-title">
                <span className="title-icon">🔥</span>
                Recent Contributions
              </h3>
              <div className="pledge-timeline">
                {campaign.recentPledges.map((pledge, idx) => (
                  <div key={idx} className="pledge-timeline-item">
                    <div className="pledge-avatar">
                      {pledge.donor.charAt(0)}
                    </div>
                    <div className="pledge-details">
                      <div className="pledge-donor-name">{pledge.donor}</div>
                      <div className="pledge-time">
                        {new Date(pledge.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="pledge-amount-badge">
                      {formatCurrency(pledge.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="trust-section">
            <h4 className="trust-title">Why contribute?</h4>
            <div className="trust-items">
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <span>Secure mobile money payments</span>
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <span>Instant receipt & confirmation</span>
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <span>Track your contribution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pledge Form */}
        <div className="form-column">
          <div className="pledge-form-modern">
            <div className="form-header">
              <h2 className="form-title">💝 Make Your Contribution</h2>
              <p className="form-subtitle">Join {campaign.pledgeCount || 0} others supporting this cause</p>
            </div>

            {submitError && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {submitError}
              </div>
            )}

            <form onSubmit={handlePledgeSubmit} className="modern-form">
              {/* Quick Amount Buttons */}
              <div className="amount-section">
                <label className="modern-label">
                  <span className="label-icon">💰</span>
                  Contribution Amount
                </label>
                <div className="quick-amounts">
                  {[50000, 100000, 250000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`quick-amount-btn ${amount === amt.toString() ? 'active' : ''}`}
                      onClick={() => setAmount(amt.toString())}
                    >
                      {(amt / 1000).toLocaleString()}K
                    </button>
                  ))}
                </div>
                <div className="input-with-icon">
                  <span className="input-icon">UGX</span>
                  <input
                    id="amount"
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="Enter custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="modern-input"
                    required
                  />
                </div>
              </div>

              {/* Name */}
              <div className="form-group-modern">
                <label htmlFor="name" className="modern-label">
                  <span className="label-icon">👤</span>
                  Your Name <span className="optional">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name or stay anonymous"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="modern-input"
                />
              </div>

              {/* Phone */}
              <div className="form-group-modern">
                <label htmlFor="phone" className="modern-label">
                  <span className="label-icon">📱</span>
                  Mobile Money Number <span className="required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="modern-input"
                  required
                />
                <div className="input-hint">
                  MTN or Airtel number for payment
                </div>
              </div>

              {/* Email */}
              <div className="form-group-modern">
                <label htmlFor="email" className="modern-label">
                  <span className="label-icon">✉️</span>
                  Email <span className="optional">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="modern-input"
                />
                <div className="input-hint">
                  Receive receipt and updates
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cta-button"
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Continue to Payment</span>
                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>

              <div className="security-note">
                <span className="lock-icon">🔒</span>
                Secure payment • Your data is protected
              </div>
            </form>
          </div>

          {/* Share Card */}
          <div className="share-card-modern">
            <div className="share-icon-large">📢</div>
            <h3 className="share-title">Help us reach the goal!</h3>
            <p className="share-text">Share this campaign with your network</p>
            <button
              className="share-button-modern"
              onClick={async () => {
                const shareUrl = window.location.href;
                const shareText = `Support the campaign: ${campaign.title}`;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: campaign.title, text: shareText, url: shareUrl });
                  } catch (e) { /* user cancelled */ }
                } else {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('✓ Link copied to clipboard!');
                  } catch (e) {
                    window.prompt('Copy this link:', shareUrl);
                  }
                }
              }}
            >
              <span>Share Campaign</span>
              <span className="share-icon">🔗</span>
            </button>
            {campaign.event_code && (
              <div className="event-code-badge">
                Code: <strong>{campaign.event_code}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


