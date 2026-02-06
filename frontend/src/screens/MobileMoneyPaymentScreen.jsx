import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postWithAuth } from '../utils/api';
import Logo from '../components/Logo';
import { formatFormErrorMessage } from '../utils/formErrors';

export default function MobileMoneyPaymentScreen() {
  const { pledgeId } = useParams();
  const [provider, setProvider] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');
    if (!phone || !amount) {
      setError('Please enter a phone number and amount.');
      setLoading(false);
      return;
    }
    try {
      const payload = {
        provider,
        phoneNumber: phone,
        amount,
        pledgeId: pledgeId
      };
      const res = await postWithAuth('/api/payments/mobile-money', payload);
      if (res.success) {
        setStatus('Payment initiated. Please check your phone for a USSD prompt.');
      } else {
        setError(formatFormErrorMessage(res.error || 'Failed to initiate payment', 'Failed to initiate payment. Please try again.'));
      }
    } catch (err) {
      setError(formatFormErrorMessage(err?.message || 'Server error', 'Server error. Please try again.'));
    }
    setLoading(false);
  };

  return (
    <div className="mobile-money-bg">
      <Logo size="large" showText={false} />
      <h2>Mobile Money Payment</h2>
      <form onSubmit={handleSubmit} className="payment-form" noValidate>
        <div>
          <label htmlFor="provider">Provider</label>
          <select id="provider" value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="mtn">MTN</option>
            <option value="airtel">Airtel</option>
          </select>
        </div>
        <div>
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="2567XXXXXXXX" required aria-label="Phone Number" />
        </div>
        <div>
          <label htmlFor="amount">Amount (UGX)</label>
          <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required aria-label="Amount (UGX)" />
        </div>
        {error && <div className="error-message">{error}</div>}
        {status && <div className="success-message">{status}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Pay Now'}</button>
      </form>
      <div className="ussd-instructions">
        <h4>USSD Instructions</h4>
        <p>After submitting, you will receive a USSD prompt on your phone. Enter your PIN to complete the payment.</p>
        <p>If you do not receive a prompt, dial *165# for MTN or *185# for Airtel and follow the instructions.</p>
      </div>
      <button className="btn-link" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}
