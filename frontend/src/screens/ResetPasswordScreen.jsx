import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import Logo from '../components/Logo';
import '../authOutlook.css';

export default function ResetPasswordScreen() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => document.body.classList.remove('auth-bg');
  }, []);

  const passwordValidation = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, allValid: Object.values(checks).every(Boolean), score };
  }, [password]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][passwordValidation.score] || '';
  const strengthColor = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'][passwordValidation.score] || '#333';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }
    if (!passwordValidation.allValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  /* ── SUCCESS state ── */
  if (success) {
    return (
      <div className="auth-bg">
        <main>
          <section className="auth-center-card" aria-label="Password updated">
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '28px' }}>
              <Logo size="medium" showText={false} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)',
                border: '2px solid #10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28,
              }}>✓</div>
              <h2 style={{ color: '#10b981', marginBottom: 8 }}>Password Updated!</h2>
              <p className="subtitle" style={{ color: '#e2e8f0' }}>
                Your password has been set successfully. Redirecting you to sign in…
              </p>
            </div>
            <Link
              to="/login"
              style={{
                display: 'block', textAlign: 'center',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f0f0f', borderRadius: 8, padding: '12px 24px',
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
                marginBottom: 16, boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
              }}
            >
              Sign in to PledgedHub
            </Link>
            <div className="auth-meta-links">
              <Link to="/help" className="auth-footer-link-light">Help</Link>
              <Link to="/privacy" className="auth-footer-link-light">Privacy</Link>
              <Link to="/terms" className="auth-footer-link-light">Terms</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ── FORM state ── */
  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card" aria-label="Set new password">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '28px' }}>
            <Logo size="medium" showText={false} />
          </div>

          <h2>Set new password</h2>
          <p className="subtitle" style={{ color: '#e2e8f0' }}>
            Create a strong password for your account.
          </p>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="auth-alert-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* New Password */}
            <div>
              <label htmlFor="password">New Password</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className="auth-password-input"
                />
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, fontWeight: 700, marginBottom: 6,
                  color: strengthColor,
                }}>
                  <span>Password strength</span>
                  <span>{strengthLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: passwordValidation.score >= i ? strengthColor : '#333',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <ul style={{ background: 'transparent', border: 'none', padding: '0 0 0 16px', fontSize: 11, margin: 0, color: '#9ca3af' }}>
                  {[
                    { label: 'At least 8 characters', met: passwordValidation.checks.length },
                    { label: 'Uppercase letter', met: passwordValidation.checks.uppercase },
                    { label: 'Lowercase letter', met: passwordValidation.checks.lowercase },
                    { label: 'Number', met: passwordValidation.checks.number },
                    { label: 'Special character (!@#$%^&*...)', met: passwordValidation.checks.special },
                  ].map((req, i) => (
                    <li key={i} style={{ color: req.met ? '#10b981' : '#9ca3af', marginBottom: 2 }}>
                      {req.met ? '✓' : '○'} {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-password-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  className="auth-password-input"
                  style={confirmPassword && !passwordsMatch ? { borderColor: '#ef4444' } : {}}
                />
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={loading}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 10 }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !passwordValidation.allValid || !passwordsMatch}
              aria-busy={loading}
              style={{ padding: '13px 24px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? 'Updating password…' : 'Set new password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600 }}>
                ← Back to Sign In
              </Link>
            </div>
          </form>

          <div style={{
            borderTop: '1px solid #333', paddingTop: 20, marginTop: 24,
            display: 'flex', justifyContent: 'center', gap: 20,
          }}>
            <Link to="/help" className="auth-footer-link-light">Help</Link>
            <Link to="/privacy" className="auth-footer-link-light">Privacy</Link>
            <Link to="/terms" className="auth-footer-link-light">Terms</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
