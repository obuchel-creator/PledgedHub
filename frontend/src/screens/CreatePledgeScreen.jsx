import React, { useState, useEffect } from 'react';
import { createPledge, getCampaigns } from '../services/api';

export default function CreatePledgeScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

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
    setAmount('');
    setPurpose('');
    setCollectionDate('');
  };

  const validate = () => {
    if (!donorName.trim()) {
      setError('Donor name is required.');
      return false;
    }

    if (!donorEmail.trim()) {
      setError('Donor email is required.');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    const amountNum = Number(amount);
    if (amount === '' || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number.');
      return false;
    }

    if (!collectionDate) {
      setError('Collection date is required.');
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
        title: purpose.trim() || `Pledge from ${donorName.trim()}`,
        amount: Number(amount),
        donorName: donorName.trim(),
        donor_name: donorName.trim(),
        donor_email: donorEmail.trim().toLowerCase(),
        donor_phone: null,
        purpose: purpose.trim() || 'General donation',
        collection_date: collectionDate,
        status: 'pending',
        message: purpose.trim() || 'General donation',
        date: new Date().toISOString(),
      });
      setMessage('Pledge recorded successfully.');
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
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
          }}
        >
          <p className="page-header__eyebrow" style={{ color: 'rgba(147, 51, 234, 0.9)', fontWeight: '600' }}>
            New Pledge
          </p>
          <h1
            id="create-pledge-title"
            className="page-header__title"
            style={{ color: 'var(--text)', marginBottom: '0.75rem' }}
          >
            Record a pledge
          </h1>
          <p
            className="page-header__subtitle"
            style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}
          >
            Capture a donor's commitment to contribute to a campaign or as a standalone pledge.
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
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
            }}
          >
            Pledge details
          </h2>

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
                <label htmlFor="donorName" className="form-label">
                  Donor name *
                </label>
                <input
                  id="donorName"
                  name="donorName"
                  type="text"
                  value={donorName}
                  onChange={(event) => setDonorName(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  disabled={loading}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="form-field">
                <label htmlFor="donorEmail" className="form-label">
                  Donor email *
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
                  placeholder="e.g., john@example.com"
                />
              </div>
            </div>

            <div className="form-grid form-grid--two">
              <div className="form-field">
                <label htmlFor="amount" className="form-label">
                  Pledge amount (UGX) *
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  step="any"
                  min="0"
                  disabled={loading}
                  placeholder="e.g., 100000"
                />
              </div>

              <div className="form-field">
                <label htmlFor="collectionDate" className="form-label">
                  Collection date *
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
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="purpose" className="form-label">
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="textarea"
                disabled={loading}
                placeholder="e.g., School Library Fund"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create pledge'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Clear form
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
