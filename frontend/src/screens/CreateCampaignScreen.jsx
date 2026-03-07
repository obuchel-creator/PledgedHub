import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCampaign } from '../services/api';
import './FormScreens.css';

const PAYOUT_METHODS = [
  { value: 'mtn_momo',    label: 'MTN Mobile Money',  icon: '📱', hint: 'Enter the MTN number that will receive funds (e.g. 0771234567)' },
  { value: 'airtel_money',label: 'Airtel Money',       icon: '📲', hint: 'Enter the Airtel number that will receive funds (e.g. 0751234567)' },
  { value: 'paypal',      label: 'PayPal',             icon: '💳', hint: 'Enter the PayPal email address that will receive funds' },
  { value: 'bank',        label: 'Bank Transfer',      icon: '🏦', hint: 'Enter your bank name and account number' },
];

export default function CreateCampaignScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('mtn_momo');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutEmail, setPayoutEmail] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutBankAccount, setPayoutBankAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setTitle(''); setDescription(''); setGoalAmount(''); setSuggestedAmount('');
    setPayoutMethod('mtn_momo'); setPayoutPhone(''); setPayoutEmail('');
    setPayoutBankName(''); setPayoutBankAccount('');
  };

  const selectedMethod = PAYOUT_METHODS.find(m => m.value === payoutMethod);

  const validate = () => {
    if (!title.trim()) { setError('Campaign title is required.'); return false; }
    const goalNum = Number(goalAmount);
    if (!goalAmount || Number.isNaN(goalNum) || goalNum <= 0) { setError('Goal amount must be a positive number.'); return false; }
    if (suggestedAmount) {
      const suggestedNum = Number(suggestedAmount);
      if (Number.isNaN(suggestedNum) || suggestedNum <= 0) { setError('Suggested amount must be a positive number.'); return false; }
    }
    if (payoutMethod === 'mtn_momo' || payoutMethod === 'airtel_money') {
      if (!payoutPhone.trim() || !/^0[0-9]{9}$/.test(payoutPhone.replace(/\s/g, ''))) {
        setError('Enter a valid 10-digit Ugandan phone number (e.g. 0771234567).'); return false;
      }
    }
    if (payoutMethod === 'paypal') {
      if (!payoutEmail.trim() || !payoutEmail.includes('@')) {
        setError('Enter a valid PayPal email address.'); return false;
      }
    }
    if (payoutMethod === 'bank') {
      if (!payoutBankName.trim() || !payoutBankAccount.trim()) {
        setError('Bank name and account number are required.'); return false;
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
        payoutMethod,
        payoutPhone: (payoutMethod === 'mtn_momo' || payoutMethod === 'airtel_money') ? payoutPhone.replace(/\s/g, '') : null,
        payoutEmail: payoutMethod === 'paypal' ? payoutEmail.trim().toLowerCase() : null,
        payoutBankName: payoutMethod === 'bank' ? payoutBankName.trim() : null,
        payoutBankAccount: payoutMethod === 'bank' ? payoutBankAccount.trim() : null,
      });
      setMessage('Campaign created successfully!');
      setTimeout(() => {
        if (result?.data?.id) navigate(`/campaigns/${result.data.id}`);
        else navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', backgroundImage: 'var(--gradient-1), var(--gradient-2), var(--gradient-3)', backgroundAttachment: 'fixed', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <main className="page page--narrow" aria-labelledby="create-campaign-title">
        <header className="page-header" style={{ background: 'var(--surface)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px -4px rgba(15,23,42,0.1)' }}>
          <p className="page-header__eyebrow" style={{ color: 'rgba(16,185,129,0.9)', fontWeight: '600' }}>New Campaign</p>
          <h1 id="create-campaign-title" className="page-header__title" style={{ color: 'var(--text)', marginBottom: '0.75rem' }}>Create a fundraising campaign</h1>
          <p className="page-header__subtitle" style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Set up a campaign that multiple donors can contribute to. Money collected is sent directly to your chosen account.
          </p>
        </header>

        <section className="card" style={{ background: 'var(--surface)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px -4px rgba(15,23,42,0.1)' }}>
          <h2 className="section__title" style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Campaign details</h2>

          {message && <div className="alert alert--success" role="status">{message}</div>}
          {error && <div className="alert alert--error" role="alert">{error}</div>}

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="title" className="form-label">Campaign title *</label>
              <input id="title" name="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" required disabled={loading} placeholder="e.g., Wedding fundraise for Sarah &amp; David" />
            </div>

            <div className="form-field">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} className="textarea" disabled={loading} placeholder="Share the story behind this campaign" rows={4} />
            </div>

            <div className="form-grid form-grid--two">
              <div className="form-field">
                <label htmlFor="goalAmount" className="form-label">Total campaign goal (UGX) *</label>
                <input id="goalAmount" name="goalAmount" type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} className="input" required step="any" min="0" disabled={loading} placeholder="e.g., 5000000" />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>The total amount you want to raise</p>
              </div>
              <div className="form-field">
                <label htmlFor="suggestedAmount" className="form-label">Suggested amount per donor (UGX)</label>
                <input id="suggestedAmount" name="suggestedAmount" type="number" value={suggestedAmount} onChange={e => setSuggestedAmount(e.target.value)} className="input" step="any" min="0" disabled={loading} placeholder="e.g., 100000" />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>Recommended per-donor contribution (optional)</p>
              </div>
            </div>

            {/* ── Payout / Receive Funds Section ── */}
            <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid var(--border, #e2e8f0)' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text, #0f172a)' }}>Where should collected funds go?</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', marginBottom: '1.1rem' }}>
                When pledgers pay their contributions, the money will be sent directly to the account you specify here.
              </p>

              {/* Method selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {PAYOUT_METHODS.map(m => (
                  <label
                    key={m.value}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                      border: `2px solid ${payoutMethod === m.value ? '#2563eb' : 'var(--border, #e2e8f0)'}`,
                      borderRadius: 12, padding: '0.85rem 0.5rem',
                      background: payoutMethod === m.value ? 'rgba(37,99,235,0.06)' : 'var(--surface, #fff)',
                      cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                      fontSize: '0.82rem', fontWeight: payoutMethod === m.value ? 700 : 500,
                      color: payoutMethod === m.value ? '#2563eb' : 'var(--text-muted, #475569)',
                      textAlign: 'center',
                    }}
                  >
                    <input type="radio" name="payoutMethod" value={m.value} checked={payoutMethod === m.value} onChange={() => setPayoutMethod(m.value)} style={{ display: 'none' }} disabled={loading} />
                    <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                    {m.label}
                  </label>
                ))}
              </div>

              {/* Hint text */}
              <p style={{ fontSize: '0.83rem', color: 'var(--text-subtle, #64748b)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                {selectedMethod?.hint}
              </p>

              {/* Conditional input fields */}
              {(payoutMethod === 'mtn_momo' || payoutMethod === 'airtel_money') && (
                <div className="form-field">
                  <label className="form-label" htmlFor="payoutPhone">
                    {payoutMethod === 'mtn_momo' ? 'MTN' : 'Airtel'} phone number *
                  </label>
                  <input
                    id="payoutPhone" name="payoutPhone" type="tel"
                    value={payoutPhone} onChange={e => setPayoutPhone(e.target.value)}
                    className="input" disabled={loading}
                    placeholder={payoutMethod === 'mtn_momo' ? '0771234567' : '0751234567'}
                    required
                  />
                  <p className="form-hint" style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#64748b' }}>
                    Must be a registered {payoutMethod === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money'} number
                  </p>
                </div>
              )}

              {payoutMethod === 'paypal' && (
                <div className="form-field">
                  <label className="form-label" htmlFor="payoutEmail">PayPal email address *</label>
                  <input
                    id="payoutEmail" name="payoutEmail" type="email"
                    value={payoutEmail} onChange={e => setPayoutEmail(e.target.value)}
                    className="input" disabled={loading}
                    placeholder="your-paypal@email.com"
                    required
                  />
                </div>
              )}

              {payoutMethod === 'bank' && (
                <div className="form-grid form-grid--two">
                  <div className="form-field">
                    <label className="form-label" htmlFor="payoutBankName">Bank name *</label>
                    <input
                      id="payoutBankName" name="payoutBankName" type="text"
                      value={payoutBankName} onChange={e => setPayoutBankName(e.target.value)}
                      className="input" disabled={loading}
                      placeholder="e.g., Stanbic Bank"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="payoutBankAccount">Account number *</label>
                    <input
                      id="payoutBankAccount" name="payoutBankAccount" type="text"
                      value={payoutBankAccount} onChange={e => setPayoutBankAccount(e.target.value)}
                      className="input" disabled={loading}
                      placeholder="e.g., 9030012345678"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Security note */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '0.75rem 1rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔒</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                  Your payout details are encrypted and only used to transfer your campaign proceeds. PledgeHub takes a small platform fee before disbursement.
                </p>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create campaign'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>Clear form</button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')} disabled={loading}>Cancel</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}


  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoalAmount('');
    setSuggestedAmount('');
  };

  const validate = () => {
    if (!title.trim()) {
      setError('Campaign title is required.');
      return false;
    }

    const goalNum = Number(goalAmount);
    if (goalAmount === '' || Number.isNaN(goalNum) || goalNum <= 0) {
      setError('Goal amount must be a positive number.');
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

      setMessage('Campaign created successfully!');

      // Redirect to campaign details page after 1.5 seconds
      setTimeout(() => {
        if (result?.data?.id) {
          navigate(`/campaigns/${result.data.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Failed to create campaign.');
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
      <main className="page page--narrow" aria-labelledby="create-campaign-title">
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
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
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
        </section>
      </main>
    </div>
  );
}


