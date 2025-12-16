import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import Logo from '../components/Logo';

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
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          maxWidth: '1200px',
          width: '100%',
          gap: '3rem',
          alignItems: 'center',
        }}
      >
        {/* Left side - Branding */}
        <div
          style={{
            flex: 1,
            color: 'white',
            display: window.innerWidth < 768 ? 'none' : 'block',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: 'white',
              lineHeight: '1.2',
            }}
          >
            Create New Password
          </h2>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: '1.8',
              marginBottom: '2rem',
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            Choose a strong password to keep your account secure.
          </p>

          {/* Info Cards */}
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🔐</span>
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.5rem',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    Strong Password
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                    }}
                  >
                    Use a mix of letters, numbers, and special characters
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.5rem',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    One-Time Link
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                    }}
                  >
                    This reset link can only be used once
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>⏱️</span>
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      marginBottom: '0.5rem',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    Limited Time
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                    }}
                  >
                    Complete within 1 hour before it expires
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset Password Form */}
        <main
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #dadce0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            maxWidth: '450px',
            width: '100%',
            padding: 'clamp(36px, 5vw, 48px) clamp(32px, 5vw, 40px)',
          }}
        >
          <section>
            {/* Header */}
            <header style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Logo size="medium" showText={false} />
              </div>
              <h1
                style={{
                  fontSize: 'clamp(20px, 3vw, 24px)',
                  fontWeight: '400',
                  color: '#202124',
                  marginBottom: '8px',
                  fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
                  margin: '0 0 8px 0',
                }}
              >
                {success ? 'Password updated!' : 'Set new password'}
              </h1>
              <p
                style={{
                  color: '#5f6368',
                  fontSize: 'clamp(14px, 2vw, 16px)',
                  fontWeight: '400',
                  margin: '0',
                  padding: '0',
                }}
              >
                {success
                  ? 'You can now sign in with your new password'
                  : 'Create a strong password for your account'}
              </p>
            </header>

            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  background: '#fce8e6',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#d93025',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '16px', marginTop: '2px' }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success State */}
            {success ? (
              <div>
                <div
                  style={{
                    background: '#e6f4ea',
                    border: '1px solid #c6e1c6',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    color: '#137333',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>✓</span>
                    Password reset successful!
                  </p>
                  <p style={{ margin: 0 }}>
                    Your password has been updated. Redirecting you to sign in...
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Link
                    to="/login"
                    style={{
                      color: '#1a73e8',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '14px',
                      display: 'inline-block',
                    }}
                  >
                    Go to sign in now →
                  </Link>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} noValidate>
                {/* Password Field */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="password"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#5f6368',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    New password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      autoFocus
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '13px 45px 13px 15px',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '16px',
                        color: '#202124',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        opacity: loading ? 0.6 : 1,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
                      onBlur={(e) => (e.target.style.borderColor = '#dadce0')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#5f6368',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '4px 8px',
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="confirmPassword"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#5f6368',
                      marginBottom: '8px',
                      fontWeight: '500',
                    }}
                  >
                    Confirm password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '13px 45px 13px 15px',
                        border: `1px solid ${confirmPassword && !passwordsMatch ? '#d93025' : '#dadce0'}`,
                        borderRadius: '4px',
                        fontSize: '16px',
                        color: '#202124',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        opacity: loading ? 0.6 : 1,
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword && !passwordsMatch ? '#d93025' : '#1a73e8')
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword && !passwordsMatch ? '#d93025' : '#dadce0')
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#5f6368',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '4px 8px',
                      }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p
                      style={{
                        color: '#d93025',
                        fontSize: '12px',
                        marginTop: '6px',
                        marginBottom: 0,
                      }}
                    >
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                {password && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '20px',
                      fontSize: '13px',
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#202124' }}>
                      Password requirements:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#3c4043' }}>
                      <li
                        style={{ color: passwordValidation.checks.length ? '#137333' : '#5f6368' }}
                      >
                        {passwordValidation.checks.length ? '✓' : '○'} At least 8 characters
                      </li>
                      <li
                        style={{
                          color: passwordValidation.checks.uppercase ? '#137333' : '#5f6368',
                        }}
                      >
                        {passwordValidation.checks.uppercase ? '✓' : '○'} One uppercase letter
                      </li>
                      <li
                        style={{
                          color: passwordValidation.checks.lowercase ? '#137333' : '#5f6368',
                        }}
                      >
                        {passwordValidation.checks.lowercase ? '✓' : '○'} One lowercase letter
                      </li>
                      <li
                        style={{ color: passwordValidation.checks.number ? '#137333' : '#5f6368' }}
                      >
                        {passwordValidation.checks.number ? '✓' : '○'} One number
                      </li>
                      <li
                        style={{ color: passwordValidation.checks.special ? '#137333' : '#5f6368' }}
                      >
                        {passwordValidation.checks.special ? '✓' : '○'} One special character
                        (!@#$%^&*...)
                      </li>
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !passwordValidation.allValid || !passwordsMatch}
                  style={{
                    width: '100%',
                    background:
                      loading || !passwordValidation.allValid || !passwordsMatch
                        ? '#dadce0'
                        : '#1a73e8',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    color:
                      loading || !passwordValidation.allValid || !passwordsMatch
                        ? '#5f6368'
                        : 'white',
                    fontWeight: '500',
                    fontSize: '16px',
                    cursor:
                      loading || !passwordValidation.allValid || !passwordsMatch
                        ? 'not-allowed'
                        : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow:
                      loading || !passwordValidation.allValid || !passwordsMatch
                        ? 'none'
                        : '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
                    marginBottom: '16px',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && passwordValidation.allValid && passwordsMatch) {
                      e.target.style.boxShadow =
                        '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
                      e.target.style.background = '#1765cc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && passwordValidation.allValid && passwordsMatch) {
                      e.target.style.boxShadow =
                        '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)';
                      e.target.style.background = '#1a73e8';
                    }
                  }}
                >
                  {loading ? 'Updating password...' : 'Reset password'}
                </button>

                {/* Back to Login Link */}
                <div style={{ textAlign: 'center' }}>
                  <Link
                    to="/login"
                    style={{
                      color: '#1a73e8',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '14px',
                    }}
                  >
                    ← Back to sign in
                  </Link>
                </div>
              </form>
            )}

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
      </div>

      {/* Mobile Responsive Styles */}
      <style>{`
                @media (max-width: 768px) {
                    div[style*="maxWidth: 1200px"] {
                        flex-direction: column !important;
                    }
                }
            `}</style>
    </div>
  );
}
