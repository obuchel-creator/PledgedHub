import React, { useState } from 'react';
import { postWithAuth } from '../utils/api';
import Logo from '../components/Logo';

export default function AIMessagingScreen() {
  const [pledgeId, setPledgeId] = useState('');
  const [type, setType] = useState('reminder');
  const [tone, setTone] = useState('friendly');
  const [subtype, setSubtype] = useState('7_days');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = { pledgeId, type, tone, subtype, useAI: true, format: 'sms' };
      const res = await postWithAuth('/api/messages/reminder', payload);
      if (res.success && res.data && res.data.message) {
        setMessage(res.data.message);
      } else {
        setError(res.error || 'Failed to generate message');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="ai-messaging-bg">
      <Logo size="large" showText={false} />
      <h2>AI Message Generator</h2>
      <form onSubmit={handleGenerate} className="ai-message-form">
        <div>
          <label htmlFor="pledgeId">Pledge ID</label>
          <input id="pledgeId" value={pledgeId} onChange={e => setPledgeId(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={e => setType(e.target.value)}>
            <option value="reminder">Reminder</option>
            <option value="thankYou">Thank You</option>
            <option value="followUp">Follow Up</option>
            <option value="confirmation">Confirmation</option>
          </select>
        </div>
        <div>
          <label htmlFor="tone">Tone</label>
          <select id="tone" value={tone} onChange={e => setTone(e.target.value)}>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label htmlFor="subtype">Subtype</label>
          <select id="subtype" value={subtype} onChange={e => setSubtype(e.target.value)}>
            <option value="7_days">7 Days</option>
            <option value="3_days">3 Days</option>
            <option value="due_today">Due Today</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate Message'}</button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="ai-message-output"><strong>Generated Message:</strong><br />{message}</div>}
    </div>
  );
}
