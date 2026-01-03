import React, { useEffect, useState } from 'react';
import { fetchWithAuth, postWithAuth } from '../utils/api';
import Logo from '../components/Logo';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function loadReminders() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/reminders/upcoming');
        if (res.success) {
          setReminders(res.data.reminders || []);
        } else {
          setError(res.error || 'Failed to load reminders');
        }
      } catch (err) {
        setError('Server error');
      }
      setLoading(false);
    }
    loadReminders();
  }, []);

  const handleSendReminder = async (pledgeId) => {
    setStatus('');
    setError('');
    try {
      const res = await postWithAuth(`/api/notifications/reminder/${pledgeId}`);
      if (res.success) {
        setStatus('Reminder sent successfully');
      } else {
        setError(res.error || 'Failed to send reminder');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="reminders-bg">
      <Logo size="large" showText={false} />
      <h2>Upcoming Reminders</h2>
      {loading && <div>Loading reminders...</div>}
      {error && <div className="error-message">{error}</div>}
      {status && <div className="success-message">{status}</div>}
      <ul className="reminder-list">
        {reminders.map(reminder => (
          <li key={reminder.pledgeId}>
            <div>
              <strong>{reminder.title || reminder.name}</strong> - Due: {reminder.collection_date}
            </div>
            <button className="btn-primary" onClick={() => handleSendReminder(reminder.pledgeId)}>
              Send Reminder
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
