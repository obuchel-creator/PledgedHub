import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import { formatFormErrorMessage } from '../utils/formErrors';
import './FormScreens.css';

export default function CreateCampaignScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [newCampaignId, setNewCampaignId] = useState(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoalAmount('');
    setSuggestedAmount('');
  };

  const validate = () => {
    if (!title.trim()) {
      setError('Please enter a campaign title.');
      return false;
    }

    const goalNum = Number(goalAmount);
    if (goalAmount === '' || Number.isNaN(goalNum) || goalNum <= 0) {
      setError('Campaign goal must be a positive number.');
      return false;
    }

    if (suggestedAmount) {
      const suggestedNum = Number(suggestedAmount);
      if (Number.isNaN(suggestedNum) || suggestedNum <= 0) {
        setError('Suggested amount must be a positive number.');
        return false;
      }
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
      const result = await createCampaign({
        title: title.trim(),
        description: description.trim(),
        goalAmount: Number(goalAmount),
        suggestedAmount: suggestedAmount ? Number(suggestedAmount) : null,
      });

      if (result?.success) {
        setMessage('Campaign created successfully!');
        setNewCampaignId(result?.data?.id);

        // Redirect to campaign details page after 1.5 seconds
        setTimeout(() => {
          if (result?.data?.id) {
            navigate(`/campaigns/${result.data.id}`);
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        setError(formatFormErrorMessage(
          result?.error || 'Failed to create campaign',
          'Unable to create campaign. Please check your information and try again.'
        ));
      }
    } catch (err) {
      setError(formatFormErrorMessage(
        err?.message || 'An error occurred while creating the campaign',
        'Unable to create campaign. Please check your connection and try again.'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'var(--background)',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <main style={{ maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <p className="page-header__eyebrow" style={{ color: 'rgba(16, 185, 129, 0.9)', fontWeight: '600' }}>
            New Campaign
          </p>
          <h1
            id="create-campaign-title"
            className="page-header__title"
            style={{ color: 'var(--text)', marginBottom: '0.75rem' }}
          >
            Create a fundraising campaign
          </h1>
          <p
            className="page-header__subtitle"
            style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}
          >
            Set up a campaign that multiple donors can contribute to with a collective goal.
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
          aria-labelledby="create-campaign-form"
        >
          <h2
            id="create-campaign-form"
            className="section__title"
            style={{
              color: 'var(--text)',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
            }}
          >
            Campaign details
          </h2>

          {message && (
            <div className="alert alert--success" role="status">
              ✓ {message}
            </div>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form
            className="form"
            onSubmit={handleSubmit}
            aria-describedby="create-campaign-feedback"
          >
            <div className="form-field">
              <label htmlFor="title" className="form-label">
                Campaign title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="input"
                required
                aria-required="true"
                disabled={loading}
                placeholder="e.g., School Library Fund"
              />
            </div>

            <div className="form-field">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="textarea"
                disabled={loading}
                placeholder="Share the story behind this campaign"
                rows={4}
              />
            </div>

            <div className="form-grid form-grid--two">
              <div className="form-field">
                <label htmlFor="goalAmount" className="form-label">
                  Total campaign goal (UGX) *
                </label>
                <input
                  id="goalAmount"
                  name="goalAmount"
                  type="number"
                  value={goalAmount}
                  onChange={(event) => setGoalAmount(event.target.value)}
                  className="input"
                  required
                  aria-required="true"
                  step="any"
                  min="0"
                  disabled={loading}
                  placeholder="e.g., 5000000"
                />
                <p
                  className="form-hint"
                  style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}
                >
                  The total amount you want to raise from all donors
                </p>
              </div>
              <div className="form-field">
                <label htmlFor="suggestedAmount" className="form-label">
                  Suggested amount per donor (UGX)
                </label>
                <input
                  id="suggestedAmount"
                  name="suggestedAmount"
                  type="number"
                  value={suggestedAmount}
                  onChange={(event) => setSuggestedAmount(event.target.value)}
                  className="input"
                  step="any"
                  min="0"
                  disabled={loading}
                  placeholder="e.g., 100000"
                />
                <p
                  className="form-hint"
                  style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}
                >
                  Recommended contribution for each individual donor (optional)
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create campaign'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Clear form
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            <div id="create-campaign-feedback" className="sr-only" aria-live="polite">
              {message || error}
            </div>
          </form>

          {/* Show buttons to add pledge or view campaign if a new campaign was just created */}
          {newCampaignId && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                What would you like to do next?
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => navigate(`/pledges/new?campaignId=${newCampaignId}`)}
                >
                  Add a Pledge to this Campaign
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => navigate(`/campaigns/${newCampaignId}`)}
                >
                  View Campaign
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


