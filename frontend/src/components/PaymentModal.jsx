
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getViteEnv } from '../utils/getViteEnv';

export default function PaymentModal({ pledge, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: pledge?.amount || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'mobile_money',
    reference: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'mobile_money', label: '📱 Mobile Money' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'cheque', label: '📝 Cheque' },
    { value: 'other', label: '💳 Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('pledgehub_token');
      const API_URL = getViteEnv().API_URL || 'http://localhost:5001';

      // Support all possible user id fields
      const userId = Number(user?.id || user?._id || user?.userId);
      const pledgeId = Number(pledge.id);
      const amount = Number(formData.amount);

      await axios.post(
        `${API_URL}/payments`,
        {
          pledgeId,
          userId,
          amount,
          paymentMethod: formData.paymentMethod,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Call success handler and close after a brief delay to show success state
      await onSuccess?.();
      
      // Close modal after a short delay so user sees the success feedback
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      // Try to extract error message from axios, fetch, or plain error
      let backendError = 'Failed to record payment';
      if (err.response && err.response.data && err.response.data.error) {
        backendError = err.response.data.error;
      } else if (err.message) {
        backendError = err.message;
      } else if (typeof err === 'string') {
        backendError = err;
      }
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px -20px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>💰 Record Payment</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              color: '#64748b',
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background:
                'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
              borderRadius: '10px',
              border: '1px solid rgba(37, 99, 235, 0.15)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
              Pledge by:
            </p>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: '#0f172a',
              }}
            >
              {pledge?.donor_name || pledge?.donorName}
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              <strong>Total Pledged:</strong> UGX {(pledge?.amount || 0).toLocaleString()}
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#334155',
              }}
            >
              Amount Received (UGX) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              className="input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              step="1000"
              placeholder="e.g. 50000"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#334155',
              }}
            >
              Payment Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              className="input"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              max={new Date().toISOString().split('T')[0]}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#334155',
              }}
            >
              Payment Method <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="select"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
              style={{ width: '100%', appearance: 'none', paddingRight: '2.5rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '2.5rem', fontSize: '1rem', color: '#334155', cursor: 'pointer' }}
            >
              {/* No hidden/disabled option; default is always valid */}
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {/* Down arrow icon for select */}
            <span style={{
              position: 'absolute',
              right: '1rem',
              top: '2.3rem',
              pointerEvents: 'none',
              color: '#64748b',
              fontSize: '1.2rem',
            }}>
              ▼
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '0.25rem',
              display: 'block',
            }}>
              Choose your payment method: Mobile Money, Cash, Bank Transfer, Cheque, or Other.
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#334155',
              }}
            >
              Reference/Receipt Number
              <span
                className="reference-tooltip-parent"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                tabIndex={0}
                title="Enter the transaction ID, receipt number, or bank reference provided by your payment provider."
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" stroke="#64748b" strokeWidth="2" fill="#f1f5f9" />
                  <text x="10" y="15" textAnchor="middle" fontSize="12" fill="#64748b" fontFamily="Arial" fontWeight="bold">i</text>
                </svg>
                <span
                  style={{
                    visibility: 'hidden',
                    opacity: 0,
                    width: '220px',
                    background: '#f1f5f9',
                    color: '#334155',
                    textAlign: 'left',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    position: 'absolute',
                    zIndex: 10,
                    left: '110%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: '0.85rem',
                    transition: 'opacity 0.2s',
                  }}
                  className="reference-tooltip"
                >
                  Enter the transaction ID, receipt number, or bank reference provided by your payment provider. This helps us verify your payment.
                </span>
                <style>{`
                  .reference-tooltip-parent:hover .reference-tooltip,
                  .reference-tooltip-parent:focus .reference-tooltip {
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                `}</style>
              </span>
            </label>
            <input
              type="text"
              className="input"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g. MM-123456 or Receipt #45"
              style={{ width: '100%' }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                marginTop: '0.25rem',
                display: 'block',
              }}
            >
              Enter the transaction ID, receipt number, or bank reference provided by your payment provider. This helps us verify your payment.
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#334155',
              }}
            >
              Notes
            </label>
            <textarea
              className="textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Any additional notes about this payment..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Recording...' : '✓ Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


