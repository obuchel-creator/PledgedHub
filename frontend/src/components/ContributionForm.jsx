
import React, { useState, useRef, useEffect } from 'react';
import { formatFormErrorMessage } from '../utils/formErrors';

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

// Main form component
function ContributionFormInner(props) {
  const [amount, setAmount] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [donorEmail, setDonorEmail] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountInputRef = useRef(null);

  // Example submit handler (replace with real logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');
    const amountValue = parseFloat(amount);
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      setSubmitError('Please enter a valid amount.');
      amountInputRef.current?.focus();
      return;
    }
    if (!donorName.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (!donorPhone.trim()) {
      setSubmitError('Please enter a phone number.');
      return;
    }
    const phoneClean = donorPhone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^256\d{9}$/;
    if (!phoneRegex.test(phoneClean)) {
      setSubmitError('Please enter a valid phone number (e.g., 256771234567).');
      return;
    }
    // TODO: Add real submission logic here
    setSuccessMsg('Contribution received. Thank you!');
  };

  return (
    <form className="contribution-form" onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      <div className="form-group">
        <label className="form-label" htmlFor="contribution-amount">Amount (UGX)</label>
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
          className={`form-input${phoneTouched && !donorPhone.match(/^?256\d{9}$/) ? ' error' : ''}`}
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
        {submitError && <div className="form-error" style={{ color: '#dc2626', fontWeight: 600 }}>{formatFormErrorMessage(submitError)}</div>}
        {successMsg && <div className="alert alert-success" style={{ color: '#059669', fontWeight: 600 }}>{successMsg}</div>}
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} style={{ marginTop: 10, borderRadius: 8, fontWeight: 700, fontSize: '1.08rem' }}>
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
