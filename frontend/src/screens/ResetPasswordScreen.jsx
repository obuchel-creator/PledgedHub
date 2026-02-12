import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import Logo from '../components/Logo';
import '../styles/quickbooks-auth.css';

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

  // Password validation
  const passwordValidation = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const allValid = Object.values(checks).every((v) => v);
    return { checks, allValid };
  }, [password]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
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

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div>
            <Logo size="large" showText={false} />
          </div>

          {!success ? (
            <>
              <h2>Set new password</h2>
              <p className="subtitle">Create a strong password to protect your account</p>
            </>
          ) : (
            <>
              <h2>Password updated!</h2>
              <p className="subtitle">Your password has been reset successfully</p>
            </>
          )}

          {error && <div className="error-message" role="alert">{error}</div>}

          {!success ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="password">
                  New Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    tabIndex="-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    👁️
                  </button>
                </div>
              </div>

              {confirmPassword && !passwordsMatch && (
                <div style={{
                  color: 'var(--qb-error)',
                  fontSize: '13px',
                  marginBottom: '16px',
                  padding: '8px 12px',
                  background: 'rgba(211, 47, 47, 0.08)',
                  borderRadius: '4px'
                }}>
                  Passwords do not match
                </div>
              )}

              {/* Password Requirements */}
              {password && (
                <div style={{
                  background: 'var(--qb-primary-light)',
                  border: '1px solid #D4DBEB',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: 'var(--qb-text)' }}>
                    Password requirements:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--qb-text-secondary)', listStyle: 'none' }}>
                    <li style={{ color: passwordValidation.checks.length ? 'var(--qb-success)' : 'var(--qb-text-secondary)' }}>
                      {passwordValidation.checks.length ? '✓' : '○'} At least 8 characters
                    </li>
                    <li style={{ color: passwordValidation.checks.uppercase ? 'var(--qb-success)' : 'var(--qb-text-secondary)' }}>
                      {passwordValidation.checks.uppercase ? '✓' : '○'} One uppercase letter
                    </li>
                    <li style={{ color: passwordValidation.checks.lowercase ? 'var(--qb-success)' : 'var(--qb-text-secondary)' }}>
                      {passwordValidation.checks.lowercase ? '✓' : '○'} One lowercase letter
                    </li>
                    <li style={{ color: passwordValidation.checks.number ? 'var(--qb-success)' : 'var(--qb-text-secondary)' }}>
                      {passwordValidation.checks.number ? '✓' : '○'} One number
                    </li>
                    <li style={{ color: passwordValidation.checks.special ? 'var(--qb-success)' : 'var(--qb-text-secondary)' }}>
                      {passwordValidation.checks.special ? '✓' : '○'} One special character (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passwordValidation.allValid || !passwordsMatch}
                aria-busy={loading}
              >
                <span className="btn-icon">✓</span>
                {loading ? 'Updating password...' : 'Reset password'}
              </button>

              <p className="form-footer-text">
                <Link to="/login">← Back to sign in</Link>
              </p>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="success-message" style={{ marginBottom: '24px' }}>
                ✓ Your password has been reset successfully
              </div>
              <button
                onClick={() => navigate('/login')}
                type="button"
                style={{
                  width: '100%',
                  background: 'var(--qb-primary)',
                  color: 'var(--qb-white)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '12px'
                }}
                onMouseOver={(e) => e.target.style.background = 'var(--qb-primary-dark)'}
                onMouseOut={(e) => e.target.style.background = 'var(--qb-primary)'}
              >
                <span style={{ marginRight: '8px' }}>→</span>
                Continue to sign in
              </button>
              <p className="form-footer-text">
                Redirecting in a moment...
              </p>
            </div>
          )}

          <p className="auth-footer">
            <Link to="/help">Help</Link>
            <span> • </span>
            <Link to="/privacy">Privacy</Link>
            <span> • </span>
            <Link to="/terms">Terms</Link>
          </p>
        </section>
      </main>
    </div>
  );
}


