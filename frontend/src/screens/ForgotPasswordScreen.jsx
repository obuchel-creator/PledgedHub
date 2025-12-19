import React, { useState, useEffect } from 'react';
import '../authOutlook.css';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import Logo from '../components/Logo';
import { socialLogos } from '../assets/social-logos';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSuccess(true);
        setCanResend(false);
        setCountdown(60);
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setError('Failed to send reset link.');
    }
    setLoading(false);
  };

  // Enable resend after countdown
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="medium" showText={true} />
          </div>

          <h2>Reset your password</h2>
          <p className="subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && <div className="error-message">{error}</div>}
          
          {success ? (
            <div className="success-message">
              ✓ Reset link sent! Please check your email inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canResend || !email}
              >
                {loading
                  ? 'Sending...'
                  : canResend
                    ? 'Send reset link'
                    : `Resend in ${countdown}s`}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/login">← Back to sign in</Link>
          </div>

          {/* Footer Links */}
          <div
            style={{
              borderTop: '1px solid #dadce0',
              paddingTop: '24px',
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              fontSize: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/help" style={{ color: '#5f6368', textDecoration: 'none' }}>
              Help
            </Link>
            <Link to="/privacy" style={{ color: '#5f6368', textDecoration: 'none' }}>
              Privacy
            </Link>
            <Link to="/terms" style={{ color: '#5f6368', textDecoration: 'none' }}>
              Terms
            </Link>
          </div>
        </section>
      </main>
      {/* Mobile Responsive Styles */}
      <style>{`
                @media (max-width: 768px) {
                    .auth-center-card {
                        max-width: 98vw !important;
                        min-width: 0 !important;
                        padding: 24px !important;
                    }
                }
            `}</style>
    </div>
  );
}


