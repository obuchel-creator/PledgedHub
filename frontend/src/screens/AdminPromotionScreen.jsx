import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import './AdminPromotionScreen.css';

export default function AdminPromotionScreen() {
  const { token, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-promotion-unauthorized">
        <h2>Access Denied</h2>
        <p>Only administrators can promote other users to admin.</p>
      </div>
    );
  }

  const handlePromote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const response = await fetch('/api/users/promote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier })
      });
      if (response.ok) {
        setToast({ type: 'success', message: 'User promoted to admin successfully!' });
        setIdentifier('');
      } else {
        const data = await response.json();
        setToast({ type: 'error', message: data.error || 'Promotion failed.' });
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-promotion-page">
      <header className="admin-promotion-header">
        <h1>Admin Promotion</h1>
        <p>Grant admin privileges to trusted users. Enter their email, phone, or username below.</p>
      </header>
      <form className="admin-promotion-form" onSubmit={handlePromote}>
        <label htmlFor="identifier">User Identifier</label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder="Email, phone, or username"
          required
          disabled={loading}
        />
        <button type="submit" className="promote-btn" disabled={loading || !identifier}>
          {loading ? 'Promoting...' : 'Promote to Admin'}
        </button>
      </form>
      {toast && <Toast type={toast.type} message={toast.message} duration={3000} />}
      <section className="admin-promotion-info">
        <h3>Best Practices</h3>
        <ul>
          <li>Only promote users you trust with sensitive financial and system controls.</li>
          <li>Admins can access accounting, finance, and security modules.</li>
          <li>Revoking admin access requires another admin.</li>
        </ul>
      </section>
    </div>
  );
}
