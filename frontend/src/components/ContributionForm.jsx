
import React, { useState, useRef, useEffect } from 'react';

const quickAmounts = [50000, 100000, 250000, 500000];

export default function ContributionForm({ campaign, onSuccess }) {
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
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('Please enter a valid amount');
      return;
    }
    const normalizedPhone = normalizePhone(donorPhone);
    if (!normalizedPhone.match(/^256\d{9}$/)) {
      setSubmitError('Invalid phone number. Must be 256XXXXXXXXX');
      return;
    }
    // Submission logic here (API call, etc.)
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 12px 40px 0 rgba(37,99,235,0.13)',
        maxWidth: 440,
        margin: '0 auto',
        padding: '2.7rem 2.5rem 2.2rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      }}
      autoComplete="off"
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b', letterSpacing: 0.2 }}>Make Your Contribution</h2>
      </div>
      <div style={{ color: '#64748b', fontSize: 16, marginBottom: 12, lineHeight: 1.6 }}>
        Support this campaign with a secure mobile money payment.
      </div>
      <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16, marginBottom: 8 }}>Contribution Amount</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {quickAmounts.map((amt) => (
          <button
            type="button"
            key={amt}
            onClick={() => handleQuickAmount(amt)}
            style={{
              background: amount === amt.toString() ? '#2563eb' : '#f1f5f9',
              color: amount === amt.toString() ? '#fff' : '#2563eb',
              border: 'none',
              borderRadius: 12,
              padding: '0.7rem 1.3rem',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background 0.18s',
              boxShadow: amount === amt.toString() ? '0 2px 8px rgba(37,99,235,0.10)' : 'none',
            }}
          >
            {amt.toLocaleString()} UGX
          </button>
        ))}
      </div>
      <input
        ref={amountInputRef}
        type="number"
        min="1000"
        step="100"
        placeholder="Enter amount (UGX)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        onBlur={() => setAmountTouched(true)}
        style={{
          border: amountTouched && (!amount || parseFloat(amount) <= 0) ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
          borderRadius: 14,
          padding: '1.1rem 1.2rem',
          fontSize: 18,
          marginBottom: 10,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: 'none',
          transition: 'border 0.18s',
        }}
        required
      />
      <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16, marginBottom: 8 }}>Name</div>
      <input
        type="text"
        placeholder="Your name"
        value={donorName}
        onChange={e => setDonorName(e.target.value)}
        style={{
          border: '1.5px solid #cbd5e1',
          borderRadius: 14,
          padding: '1.1rem 1.2rem',
          fontSize: 18,
          marginBottom: 10,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: 'none',
          transition: 'border 0.18s',
        }}
      />
      <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16, marginBottom: 8 }}>Phone Number <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }}>(Uganda: 256XXXXXXXXX)</span></div>
      <input
        type="tel"
        placeholder="e.g. 256771234567"
        value={donorPhone}
        onChange={e => setDonorPhone(e.target.value)}
        onBlur={() => setPhoneTouched(true)}
        style={{
          border: phoneTouched && !donorPhone.match(/^\+?256\d{9}$/) ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
          borderRadius: 14,
          padding: '1.1rem 1.2rem',
          fontSize: 18,
          marginBottom: 10,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: 'none',
          transition: 'border 0.18s',
        }}
        required
      />
      <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16, marginBottom: 8 }}>Email <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13 }}>(optional)</span></div>
      <input
        type="email"
        placeholder="Your email (optional)"
        value={donorEmail}
        onChange={e => setDonorEmail(e.target.value)}
        style={{
          border: '1.5px solid #cbd5e1',
          borderRadius: 14,
          padding: '1.1rem 1.2rem',
          fontSize: 18,
          marginBottom: 10,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: 'none',
          transition: 'border 0.18s',
        }}
      />
      {submitError && <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 10 }}>{submitError}</div>}
      {successMsg && <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 10 }}>{successMsg}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: isSubmitting ? '#a5b4fc' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          padding: '1.2rem 0',
          fontWeight: 800,
          fontSize: 19,
          marginTop: 10,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(37,99,235,0.10)',
          transition: 'background 0.18s',
        }}
      >
        {isSubmitting ? 'Processing...' : 'Contribute Now'}
      </button>
    </form>
  );
}
