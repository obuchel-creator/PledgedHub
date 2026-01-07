import React, { useState } from 'react';
import axios from 'axios';

export default function PublicPledgeForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    amount: '',
    purpose: '',
    collection_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const res = await axios.post('/pledges', {
        title: form.name,
        donor_name: form.name,
        donor_phone: form.phone,
        donor_email: form.email,
        amount: form.amount,
        purpose: form.purpose,
        collection_date: form.collection_date,
      });
      if (res.data && res.data.success) {
        setSuccess(true);
        setForm({ name: '', phone: '', email: '', amount: '', purpose: '', collection_date: '' });
      } else {
        setError(res.data.error || 'Submission failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div
        style={{
          color: '#059669',
          fontWeight: 500,
          fontSize: '1.1rem',
          textAlign: 'center',
          margin: '2rem',
        }}
      >
        Thank you for your pledge!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: '2rem auto',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(37,99,235,0.13)',
        padding: '2rem',
      }}
    >
      <h2 style={{ textAlign: 'center', color: '#2563eb', marginBottom: '1.5rem' }}>
        Make a Pledge
      </h2>
      <label>
        Donor Name*
        <input
          name="donor_name"
          value={form.donor_name}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      <label>
        Phone*
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      <label>
        Email
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      <label>
        Amount*
        <input
          name="amount"
          value={form.amount}
          onChange={handleChange}
          required
          type="number"
          min="1"
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      <label>
        Purpose
        <input
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      <label>
        Collection Date
        <input
          name="collection_date"
          value={form.collection_date}
          onChange={handleChange}
          type="date"
          style={{ width: '100%', marginBottom: 12 }}
        />
      </label>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.7rem',
          fontWeight: 500,
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Pledge'}
      </button>
    </form>
  );
}


