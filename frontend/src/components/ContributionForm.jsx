
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
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/public/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_slug: campaign.slug,
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
      setSuccessMsg('Thank you for your contribution!');
      setAmount('');
      setDonorName('');
      setDonorPhone('+256');
      setDonorEmail('');
      setAmountTouched(false);
      setPhoneTouched(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      padding: 32,
      boxShadow: '0 6px 32px 0 rgba(37,99,235,0.10)',
      maxWidth: 440,
      margin: '2rem auto',
      border: '1.5px solid #e5e7eb',
      position: 'relative',
      fontFamily: 'inherit',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b', letterSpacing: 0.2 }}>Make Your Contribution</h2>
      </div>
      <div style={{ color: '#64748b', fontSize: 15, marginBottom: 18 }}>
        Support this campaign with a secure mobile money payment.
      </div>
      {submitError && <div style={{ color: '#ef4444', background: '#fef2f2', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontWeight: 500, display: 'flex', alignItems: 'center' }}><span style={{marginRight:6}}>⚠️</span>{submitError}</div>}
      {successMsg && (
        <div style={{
          color: '#10b981',
          background: '#f0fdf4',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 10,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          animation: 'fadeInScale 0.7s',
        }}>
          <span style={{ marginRight: 6 }}>✅</span>{successMsg}
          <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }`}</style>
        </div>
      )}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, color: '#2563eb', marginBottom: 6, display: 'block' }}>Contribution Amount</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {quickAmounts.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                style={{
                  background: amount === amt.toString() ? 'linear-gradient(90deg,#2563eb 60%,#60a5fa 100%)' : '#f1f5f9',
                  color: amount === amt.toString() ? '#fff' : '#2563eb',
                  border: amount === amt.toString() ? '2px solid #2563eb' : 'none',
                  borderRadius: 8,
                  padding: '7px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: amount === amt.toString() ? '0 2px 8px #2563eb22' : 'none',
                  transition: 'all 0.15s',
                  outline: amount === amt.toString() ? '2px solid #2563eb55' : 'none',
                  transform: amount === amt.toString() ? 'scale(1.06)' : 'none',
                }}
                aria-pressed={amount === amt.toString()}
              >
                {amt.toLocaleString()} UGX
              </button>
            ))}
          </div>
          <input
            type="number"
            ref={amountInputRef}
            value={amount}
            onChange={e => { setAmount(e.target.value); setAmountTouched(true); }}
            min="1000"
            required
            placeholder="Enter custom amount"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: (!amount && amountTouched) || (amountTouched && parseFloat(amount) <= 0) ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
              fontSize: 16,
              marginTop: 2,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              transition: 'border 0.2s',
            }}
            onBlur={() => setAmountTouched(true)}
            aria-invalid={(!amount && amountTouched) || (amountTouched && parseFloat(amount) <= 0)}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600, color: '#2563eb', marginBottom: 4, display: 'block' }}>Name</label>
          <input
            type="text"
            value={donorName}
            onChange={e => setDonorName(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 16,
              background: '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600, color: '#2563eb', marginBottom: 4, display: 'block' }}>
            Phone Number
            <span title="Uganda format only: 256XXXXXXXXX" style={{ marginLeft: 6, color: '#64748b', cursor: 'help', fontSize: 15 }}>ⓘ</span>
          </label>
          <input
            type="text"
            value={donorPhone}
            onChange={e => { setDonorPhone(e.target.value); setPhoneTouched(true); }}
            required
            placeholder="e.g. +256771234567"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: (!donorPhone && phoneTouched) || (phoneTouched && !normalizePhone(donorPhone).match(/^256\d{9}$/)) ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
              fontSize: 16,
              background: '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={(!donorPhone && phoneTouched) || (phoneTouched && !normalizePhone(donorPhone).match(/^256\d{9}$/))}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, color: '#2563eb', marginBottom: 4, display: 'block' }}>Email <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="email"
            value={donorEmail}
            onChange={e => setDonorEmail(e.target.value)}
            placeholder="you@email.com"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 16,
              background: '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: isSubmitting ? '#93c5fd' : 'linear-gradient(90deg,#2563eb 60%,#60a5fa 100%)',
            color: '#fff',
            padding: '12px 0',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 17,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            width: '100%',
            boxShadow: '0 2px 8px #2563eb22',
            marginTop: 6,
            letterSpacing: 0.2,
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {isSubmitting ? (
            <>
              <span className="ph-spinner" style={{
                width: 18, height: 18, border: '2.5px solid #fff', borderTop: '2.5px solid #60a5fa', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', marginRight: 6
              }} />
              Submitting...
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </>
          ) : 'Contribute'}
        </button>
      </form>
      <div style={{ marginTop: 18, color: '#64748b', fontSize: 13, textAlign: 'center' }}>
        <span style={{ fontSize: 16, marginRight: 4 }}>🔒</span>
        Secure mobile money payment. Your info is confidential.
      </div>
    </div>
  );
}
