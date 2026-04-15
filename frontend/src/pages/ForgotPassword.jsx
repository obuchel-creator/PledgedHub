import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise((res) => setTimeout(res, 1200));
      setSuccess('If this email is registered, a password reset link has been sent.');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 16,
    marginBottom: '8px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: '4px',
    color: '#374151',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
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
        <h1 style={{ margin: 0, color: '#111' }}>Forgot Password</h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          Enter your email to receive a password reset link
        </p>
      </div>
      <form onSubmit={handleSubmit} aria-label="Forgot Password form" role="form" tabIndex={0} autoComplete="on">
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
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          aria-label="Send Reset Link"
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
          {loading ? 'Sending...' : 'Send Reset Link'}
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
           Back to Home
        </Link>
      </div>
    </main>
  );
}


