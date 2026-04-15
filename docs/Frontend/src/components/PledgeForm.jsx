import React, { useState } from 'react';
import Button from './Button';

// Accept userPhone prop for logged-in user's phone
const PledgeForm = ({ onSubmit, onCancel, initialData = {}, loading = false, userPhone }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    amount: initialData.amount || '',
    donor_name: initialData.donor_name || '',
    phone: userPhone || initialData.phone || '',
    email: initialData.email || '',
    message: initialData.message || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.donor_name.trim()) {
      newErrors.donor_name = 'Donor name is required';
    }

    // Phone is required
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^\+\d{9,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Phone must be in format: +256771234567';
      }
    }

    // Validate email (optional but if provided, must be valid)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    marginBottom: '4px',
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: '12px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: '4px',
    color: '#374151',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="title">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          style={inputStyle}
          placeholder="Enter pledge title"
          disabled={loading}
        />
        {errors.title && <div style={errorStyle}>{errors.title}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="amount">
          Amount ($) *
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          style={inputStyle}
          placeholder="0.00"
          disabled={loading}
        />
        {errors.amount && <div style={errorStyle}>{errors.amount}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="donor_name">
          Donor Name *
        </label>
        <input
          id="donor_name"
          name="donor_name"
          type="text"
          value={formData.donor_name}
          onChange={handleChange}
          style={inputStyle}
          placeholder="Enter donor name"
          disabled={loading}
        />
        {errors.donor_name && <div style={errorStyle}>{errors.donor_name}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="phone">
          Phone Number *
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          style={inputStyle}
          placeholder="e.g. +256771234567"
          disabled={loading || !!userPhone}
          required
        />
        {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          For SMS reminders about this pledge
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
          placeholder="donor@example.com"
          disabled={loading}
        />
        {errors.email && <div style={errorStyle}>{errors.email}</div>}
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          For email notifications
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle} htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          placeholder="Optional message"
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle} htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ minWidth: 100, padding: '6px 14px', fontSize: '0.95rem' }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          style={{ minWidth: 120, padding: '6px 16px', fontSize: '0.95rem' }}
        >
          {loading ? 'Creating...' : 'Create Pledge'}
        </Button>
      </div>
    </form>
  );
};

export default PledgeForm;


