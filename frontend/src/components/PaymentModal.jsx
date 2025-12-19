
import React, { useState } from 'react';
import axios from 'axios';
import { getViteEnv } from '../utils/getViteEnv';

export default function PaymentModal({ pledge, onClose, onSuccess }) {
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
      const token = localStorage.getItem('token');
      const API_URL = getViteEnv().API_URL || 'http://localhost:5001';
      await axios.post(
        `${API_URL}/payments`,
        {
          pledgeId: pledge.id,
          ...formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
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
              Payment Method <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="select"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
              style={{ width: '100%' }}
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
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
              Reference/Receipt Number
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
              Optional transaction or receipt reference
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


