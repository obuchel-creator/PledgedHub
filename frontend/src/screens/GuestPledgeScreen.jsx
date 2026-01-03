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
  return (
    <div className="guest-pledge-container">
      <div className="campaign-card">
        {campaign.image_url && (
          <div className="campaign-image">
            <img src={campaign.image_url} alt={campaign.title} />
          </div>
        )}

        <div className="campaign-info">
          <h1>{campaign.title}</h1>
          <p className="campaign-description">{campaign.description}</p>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="progress-text">
              <span className="raised">
                {formatCurrency(campaign.raised_amount)} raised
              </span>
              <span className="goal">Goal: {formatCurrency(campaign.goal_amount)}</span>
            </div>
            <p className="pledge-count">
              {campaign.pledgeCount} {campaign.pledgeCount === 1 ? 'pledge' : 'pledges'}
            </p>
          </div>

          {/* Recent Pledges */}
          {campaign.recentPledges && campaign.recentPledges.length > 0 && (
            <div className="recent-pledges">
              <h3>Recent Support</h3>
              <div className="pledge-list">
                {campaign.recentPledges.map((pledge, idx) => (
                  <div key={idx} className="pledge-item">
                    <span className="donor">{pledge.donor}</span>
                    <span className="amount">{formatCurrency(pledge.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pledge Form */}
      <div className="pledge-form-card">
        <h2>💝 Make Your Pledge</h2>

        {submitError && <div className="error-message">{submitError}</div>}

        <form onSubmit={handlePledgeSubmit}>
          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount (UGX) *</label>
            <input
              id="amount"
              type="number"
              min="1000"
              step="1000"
              placeholder="500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">Your Name (optional)</label>
            <input
              id="name"
              type="text"
              placeholder="Your name (leave blank for Anonymous)"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">Phone Number (for payment) *</label>
            <input
              id="phone"
              type="tel"
              placeholder="+256700000000"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              required
            />
            <small>Format: +256700000000 or 07XXXXXXXX</small>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || !amount}
          >
            {isSubmitting ? '⏳ Creating pledge...' : '✓ Continue to Payment'}
          </button>
        </form>

        <p className="form-note">
          ℹ️ Your phone number is used only for payment notifications and receipts
        </p>
      </div>

      {/* Share Section */}
      <div className="share-section">
        <p>📱 Scan QR code to join the fundraiser</p>
        {campaign.event_code && (
          <p className="event-code">
            Or enter code: <strong>{campaign.event_code}</strong>
          </p>
        )}
        <button
          className="share-btn"
          style={{
            marginTop: '1rem',
            background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.7rem 1.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 12px #3b82f633',
            transition: 'background 0.2s, transform 0.2s',
          }}
          onClick={async () => {
            // Always use a valid slug or fallback
            const slug = campaign.slug || campaign.event_code || campaign.id || '';
            const shareUrl = window.location.origin + `/campaign/${slug}`;
            const shareText = `Support the campaign: ${campaign.title}\n${shareUrl}`;
            if (navigator.share) {
              try {
                await navigator.share({ title: campaign.title, text: shareText, url: shareUrl });
              } catch (e) { /* user cancelled */ }
            } else {
              try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
              } catch (e) {
                window.prompt('Copy this link:', shareUrl);
              }
            }
          }}
        >
          🔗 Share Campaign
        </button>
      </div>
    </div>
  );
}


