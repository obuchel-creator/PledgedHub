// ...existing code...
import React, { useState } from 'react';
import { createPledge } from '../services/api';

export default function PledgeForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    goal: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const title = (form.title || '').trim();
    const description = (form.description || '').trim();
    const goal = form.goal ? Number(form.goal) : null;
    const amount = form.amount ? Number(form.amount) : null;

    console.log('🔵 [FORM] Form validation - title:', title, 'goal:', goal, 'amount:', amount);
    console.log('🔵 [FORM] Form validation - types:', typeof title, typeof goal, typeof amount);
    console.log('🔵 [FORM] Raw form data:', form);

    if (!title) return setError('Title is required.');
    if (!goal && !amount) return setError('Either campaign goal or suggested amount is required.');
    if (form.goal && (Number.isNaN(goal) || goal <= 0))
      return setError('Goal must be a positive number.');
    if (form.amount && (Number.isNaN(amount) || amount <= 0))
      return setError('Amount must be a positive number.');

    // Map frontend form fields to backend expected format
    const payload = {
      title,
      message: description, // Backend expects 'message' not 'description'
      amount: amount || goal || 1000, // Use suggested amount first, then goal, then default
      donorName: 'Anonymous', // Default donor name
    };

    console.log('🔵 [FORM] Submitting pledge with payload:', JSON.stringify(payload, null, 2));
    setLoading(true);
    try {
      const res = await createPledge(payload);
      console.log('✅ [FORM] Pledge created successfully:', res);
      // createPledge may return created object or id depending on backend
      setSuccess('Pledge created successfully.');
      setForm({ title: '', description: '', goal: '', amount: '' });
    } catch (err) {
      console.error('❌ [FORM] Error creating pledge:', err);
      console.error('❌ [FORM] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });

      // Enhanced error message parsing
      let errorMessage = 'Failed to create pledge.';

      if (err.message) {
        if (err.message.includes('400')) {
          // Try to extract the detailed error from 400 responses
          try {
            const match = err.message.match(/400\s+(.+)/);
            if (match) {
              errorMessage = `Bad Request: ${match[1]}`;
            } else {
              errorMessage = err.message;
            }
          } catch (parseError) {
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 720, margin: '0 auto' }}
    >
      <h1>New Pledge</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Create a pledge
        <br />
        Capture the key details below to launch a campaign your community can rally around.
      </p>

      <h2 style={{ fontSize: '18px', marginBottom: 16 }}>Pledge details</h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            required
            aria-required="true"
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            placeholder="Describe your pledge campaign..."
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>
            Total campaign goal (UGX)
            <input
              name="goal"
              type="number"
              min="1"
              step="1"
              value={form.goal}
              onChange={onChange}
              placeholder="e.g., 100000000"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              The total amount you want to raise from all donors
            </small>
          </label>

          <label style={{ width: 200 }}>
            Suggested amount per person (UGX)
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={onChange}
              placeholder="e.g., 10000000"
              style={{ display: 'block', width: '100%', padding: 8, marginTop: 6 }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Recommended contribution for each individual donor
            </small>
          </label>
        </div>

        <div>
          <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>
            {loading ? 'Creating…' : 'Create Pledge'}
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'crimson' }}>
            {error}
          </p>
        )}
        {success && (
          <p role="status" style={{ color: 'green' }}>
            {success}
          </p>
        )}
      </form>
    </main>
  );
}
// ...existing code...
