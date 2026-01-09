import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from query string
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!strongPasswordRegex.test(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    if (!token) {
      setError('Reset token is missing.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res && res.success) {
        setSuccess(res.message || 'Password reset successfully. You can now login.');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 20,
        maxWidth: 400,
        margin: '40px auto',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, color: '#111' }}>Reset Password</h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          Enter your new password below
        </p>
      </div>
      <form onSubmit={handleSubmit} aria-label="Reset Password form" role="form" tabIndex={0} autoComplete="on">
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              style={{
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                color: '#dc2626',
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              aria-live="polite"
              tabIndex={-1}
              style={{
                padding: '12px',
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: 6,
                color: '#047857',
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {success}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4, color: '#374151' }}>New Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, marginBottom: '8px' }}
            placeholder="Enter new password"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, marginBottom: '8px' }}
            placeholder="Confirm new password"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          aria-label="Reset Password"
          style={{
            marginTop: 8,
            padding: '12px 0',
            background: loading ? '#b3c7e6' : '#0050a8',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            letterSpacing: 0.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          disabled={loading}
          tabIndex={0}
        >
          {loading && <span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid #0050a8', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>}
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </form>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        <Link to="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Back to Login
        </Link>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
