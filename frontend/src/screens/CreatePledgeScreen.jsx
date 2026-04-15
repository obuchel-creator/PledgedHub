import React, { useState, useEffect, useContext } from 'react';
import { createPledge, getCampaigns } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './FormScreens.css';

export default function FundraisePledgeScreen() {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [donor_name, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [formattedAmount, setFormattedAmount] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);
  
  // Auto-populate name and phone from logged-in user
  useEffect(() => {
    if (user?.name && !donor_name) {
      setDonorName(user.name);
    }
    if (user?.phone && !donorPhone) {
      setDonorPhone(user.phone);
    }
  }, [user?.name, user?.phone, donor_name, donorPhone]);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const result = await getCampaigns('active');
      if (result?.success && result?.data) {
        setCampaigns(result.data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const resetForm = () => {
    setCampaignId('');
    setDonorName('');
    setDonorEmail('');
    setDonorPhone('');
    setAmount('');
    setFormattedAmount('');
    setPurpose('');
    setCollectionDate('');
  };

  const validate = () => {
    // Validate in CHRONOLOGICAL ORDER as user enters fields
    // Email → Amount → Collection Date
    // (Name and Phone are auto-populated/locked, so skip validation order for those)

    // 1. EMAIL - First field user enters
    if (!donorEmail.trim()) {
      setError('📧 Email address is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail.trim())) {
      setError('📧 Please enter a valid email address.');
      return false;
    }

    // 2. AMOUNT - Second field user enters
    const amountNum = Number(amount);
    if (amount === '' || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('💵 Pledge amount is required and must be greater than zero.');
      return false;
    }

    // 3. COLLECTION DATE - Third field user enters
    if (!collectionDate) {
      setError('📅 Collection date is required.');
      return false;
    }

    // Auto-populated validator (name)
    if (!donor_name.trim()) {
      setError('⚠️ Donor name is required.');
      return false;
    }

    // Auto-populated validator (phone)
    if (!donorPhone.trim()) {
      setError('📱 Phone number is required.');
      return false;
    }
    
    const phoneClean = donorPhone.replace(/[\s\-\(\)]/g, '');
    const ugandaPhoneRegex = /^(\+?256|0)?[7][0-9]{8}$/;
    if (!ugandaPhoneRegex.test(phoneClean)) {
      setError('📱 Please enter a valid Uganda phone number.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await createPledge({
        campaign_id: campaignId || null,
        donor_name: donor_name.trim(),
        donor_email: donorEmail.trim().toLowerCase(),
        donor_phone: donorPhone.trim() || null,
        purpose: purpose.trim() || 'General donation',
        collection_date: collectionDate,
        amount: Number(amount),
        status: 'pending',
        message: purpose.trim() || 'General donation',
        date: new Date().toISOString(),
      });
      setMessage(`✅ Pledge submitted! Check your email (${donorEmail}) to verify your pledge.`);
      resetForm();
    } catch (err) {
      setError((err && err.message) || 'An error occurred while creating the pledge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-base)',
        backgroundImage: 'var(--gradient-1), var(--gradient-2), var(--gradient-3)',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '3rem',
      }}
    >
      <main className="page page--narrow" aria-labelledby="create-pledge-title">
        <header
          className="page-header"
          style={{
            background: 'linear-gradient(135deg, #FCD116 0%, #ffdb4d 100%)',
            borderRadius: '16px',
            padding: '2.5rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px rgba(252, 209, 22, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
            color: '#181818',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>💰</span>
            <p className="page-header__eyebrow" style={{ color: '#181818', fontWeight: '700', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fundraising Campaign
            </p>
          </div>
          <h1
            id="create-pledge-title"
            className="page-header__title"
            style={{ color: '#181818', marginBottom: '0.75rem', fontSize: '2.25rem', fontWeight: '800' }}
          >
            Make a Donation Pledge
          </h1>
          <p
            className="page-header__subtitle"
            style={{ color: 'rgba(24, 24, 24, 0.8)', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}
          >
            Support this fundraising campaign by pledging your contribution. Your commitment helps us reach our goal and make a difference.
          </p>
        </header>

        <section
          className="card"
          style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
          }}
          aria-labelledby="create-pledge-form"
        >
          <h2
            id="create-pledge-form"
            className="section__title"
            style={{
              color: 'var(--text)',
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
            }}
          >
            Your Pledge Information
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
            Fill in your details below to pledge your support. All fields marked with * are required to track and acknowledge your generous contribution.
          </p>

          {message && (
            <div className="alert alert--success" role="status">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit} aria-describedby="create-pledge-feedback">
            <div className="form-field">
              <label htmlFor="campaignId" className="form-label">
                Campaign (optional)
              </label>
              {loadingCampaigns ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading campaigns...</p>
              ) : (
                <select
                  id="campaignId"
                  name="campaignId"
                  value={campaignId}
                  onChange={(event) => setCampaignId(event.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="">-- Standalone pledge --</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title} (Goal: UGX{' '}
                      {Number(campaign.goal_amount || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
              <p
                className="form-hint"
                style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}
              >
                Link this pledge to an existing campaign, or leave blank for standalone
              </p>
            </div>

            <div className="form-grid form-grid--two">
              <div className="form-field">
                <label htmlFor="donorName" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  <span style={{ marginRight: '6px' }}>👤</span> Your Full Name *
                </label>
                <input
                  id="donor_name"
                  name="donor_name"
                  type="text"
                  value={donor_name}
                  onChange={(event) => setDonorName(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  disabled={true}
                  placeholder="Your registered name will appear here"
                  style={{ 
                    fontSize: '1rem', 
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    cursor: 'not-allowed',
                    opacity: 1
                  }}
                />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                  🔒 Your registered account name is used for data integrity and accountability.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="donorEmail" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  <span style={{ marginRight: '6px' }}>📧</span> Email Address *
                </label>
                <input
                  id="donorEmail"
                  name="donorEmail"
                  type="email"
                  value={donorEmail}
                  onChange={(event) => setDonorEmail(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  disabled={loading}
                  placeholder="your.email@example.com"
                  style={{ fontSize: '1rem', padding: '12px 16px' }}
                />
              </div>
            </div>

            <div className="form-grid form-grid--two">
              <div className="form-field">
                <label htmlFor="donorPhone" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  <span style={{ marginRight: '6px' }}>📱</span> Phone Number *
                </label>
                <input
                  id="donorPhone"
                  name="donorPhone"
                  type="tel"
                  value={donorPhone}
                  onChange={(event) => setDonorPhone(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  disabled={true}
                  placeholder="Your registered phone will appear here"
                  style={{ 
                    fontSize: '1rem', 
                    padding: '12px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    cursor: 'not-allowed',
                    opacity: 1
                  }}
                />
                <p
                  className="form-hint"
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}
                >
                  🔒 Your registered phone number is used for SMS notifications and security verification.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="amount" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  <span style={{ marginRight: '6px' }}>💵</span> Pledge Amount (UGX) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      if (event.target.value) {
                        setFormattedAmount(Number(event.target.value).toLocaleString());
                      } else {
                        setFormattedAmount('');
                      }
                    }}
                    className="input"
                    required
                    aria-required="true"
                    step="any"
                    min="1000"
                    disabled={loading}
                    placeholder="e.g., 50000"
                    style={{ fontSize: '1rem', padding: '12px 16px', paddingRight: '140px' }}
                  />
                  {formattedAmount && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#10b981',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        pointerEvents: 'none',
                      }}
                    >
                      UGX {formattedAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="purpose" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                <span style={{ marginRight: '6px' }}>📝</span> Purpose / Message (Optional)
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="textarea"
                disabled={loading}
                placeholder="Share why you're supporting this campaign..."
                rows={3}
                style={{ fontSize: '1rem', padding: '12px 16px', lineHeight: '1.5' }}
              />
            </div>

            <div className="form-field">
              <label htmlFor="collectionDate" className="form-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                <span style={{ marginRight: '6px' }}>📅</span> Collection Date *
              </label>
              <input
                id="collectionDate"
                name="collectionDate"
                type="date"
                value={collectionDate}
                onChange={(event) => setCollectionDate(event.target.value)}
                className="input"
                required
                aria-required="true"
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                style={{ fontSize: '1rem', padding: '12px 16px' }}
              />
              <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                When do you plan to fulfill this pledge?
              </p>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minWidth: 110, padding: '12px 24px', fontSize: '1rem', fontWeight: '600' }}
                disabled={loading}
                onClick={() => { resetForm(); setMessage(null); setError(null); }}
              >
                🔄 Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  minWidth: 160, 
                  padding: '12px 32px', 
                  fontSize: '1rem', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #FCD116 0%, #ffdb4d 100%)',
                  color: '#181818',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(252, 209, 22, 0.3)'
                }}
                disabled={loading}
              >
                {loading ? '⏳ Processing...' : '💰 Pledge Now'}
              </button>
            </div>

            <div id="create-pledge-feedback" className="sr-only" aria-live="polite">
              {message || error}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}


