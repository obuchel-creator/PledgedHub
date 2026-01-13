
import React, { useState, useRef, useEffect } from 'react';

// Error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ContributionForm error boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', fontWeight: 700 }}>ContributionForm error: {this.state.error?.toString()}</div>;
    }
    return this.props.children;
  }
}

const quickAmounts = [50000, 100000];

function ContributionFormInner({ campaign, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const amountInputRef = useRef(null);
  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('+256');
  const [donorEmail, setDonorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const normalizePhone = (phone) => {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) {
      normalized = '256' + normalized.substring(1);
    } else if (!normalized.startsWith('256')) {
      normalized = '256' + normalized;
    }
    return normalized;
  };

  const handleQuickAmount = (amt) => {
    setAmount(amt.toString());
    setAmountTouched(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMsg(null);
    setAmountTouched(true);
    setPhoneTouched(true);

    // Validate all fields
    if (!donorName || donorName.trim().length < 2) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!donorPhone || !donorPhone.match(/^256\d{9}$/)) {
      setSubmitError('Invalid phone number. Must be 256XXXXXXXXX');
      return;
    }
    if (!donorEmail || !donorEmail.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid amount');
      return;
    }
    if (!campaign?.id) {
      setSubmitError('No campaign selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          donorName,
          donorPhone,
          donorEmail,
          campaignId: campaign.id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error || 'Payment failed. Please try again.');
      } else {
        setSuccessMsg('Thank you! Please check your phone for a payment prompt.');
        setAmount('');
        setDonorName('');
        setDonorPhone('+256');
        setDonorEmail('');
        if (onSuccess) onSuccess(data);
      }
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 440, margin: '0 auto', padding: '2.7rem 2.5rem 2.2rem 2.5rem' }} autoComplete="off">
      <div className="form-group" style={{ marginBottom: 0 }}>
        <h2 className="card-title" style={{ margin: 0 }}>Make Your Contribution</h2>
        <div className="form-help" style={{ marginBottom: 12 }}>Support this campaign with a secure mobile money payment.</div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="contribution-amount">Contribution Amount</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
          {quickAmounts.map((amt) => (
            <button
              type="button"
              key={amt}
              onClick={() => handleQuickAmount(amt)}
              className={`btn btn-outline${amount === amt.toString() ? ' btn-primary' : ''}`}
              style={{ minWidth: 90 }}
            >
              {amt.toLocaleString()} UGX
            </button>
          ))}
        </div>
        <input
          ref={amountInputRef}
          id="contribution-amount"
          type="number"
          min="1000"
          step="100"
          placeholder="Enter amount (UGX)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onBlur={() => setAmountTouched(true)}
          className={`form-input${amountTouched && (!amount || parseFloat(amount) <= 0) ? ' error' : ''}`}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="contribution-name">Name</label>
        <input
          id="contribution-name"
          type="text"
          placeholder="Your name"
          value={donorName}
          onChange={e => setDonorName(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="contribution-phone">Phone Number <span className="form-help">(Uganda: 256XXXXXXXXX)</span></label>
        <input
          id="contribution-phone"
          type="tel"
          placeholder="e.g. 256771234567"
          value={donorPhone}
          onChange={e => setDonorPhone(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          className={`form-input${phoneTouched && !donorPhone.match(/^\+?256\d{9}$/) ? ' error' : ''}`}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="contribution-email">Email <span className="form-help">(optional)</span></label>
        <input
          id="contribution-email"
          type="email"
          placeholder="Your email (optional)"
          value={donorEmail}
          onChange={e => setDonorEmail(e.target.value)}
          className="form-input"
        />
      </div>
      {/* Show error/success messages above the button, always visible */}
      <div style={{ minHeight: 32, marginBottom: 8 }}>
        {submitError && <div className="form-error">{submitError}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} style={{ marginTop: 10 }}>
        {isSubmitting ? 'Processing...' : 'Contribute Now'}
      </button>
    </form>
  );
}

export default function ContributionForm(props) {
  return (
    <ErrorBoundary>
      <ContributionFormInner {...props} />
    </ErrorBoundary>
  );
}
