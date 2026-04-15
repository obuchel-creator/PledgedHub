import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import ValidationItem from '../components/ValidationItem';

export default function PasswordChangeScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    setValidations({
      minLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      passwordsMatch: newPassword.length > 0 && newPassword === confirmPassword,
    });
  }, [newPassword, confirmPassword]);

  const allValidationsPassed =
    Object.values(validations).every((v) => v) && currentPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!allValidationsPassed) {
      setMessage({ type: 'error', text: 'Please meet all password requirements' });
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result && result.success === false) {
        setMessage({
          type: 'error',
          text:
            result.error ||
            'Failed to change password. Please verify your current password is correct.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Password changed successfully! You can now use your new password to log in.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.error ||
          error?.message ||
          'Failed to change password. Please verify your current password is correct.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #e0e7ff 0%, #f8fafc 100%)',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <main
        className="page page--narrow"
        aria-labelledby="password-title"
        style={{
          maxWidth: '950px',
          width: '100%',
          padding: '2rem 0',
        }}
      >
        {/* Header */}
        <header
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '20px',
            padding: '2.5rem 2rem 2rem 2rem',
            marginBottom: '2.5rem',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              🔒
            </div>
            <div>
              <h1
                id="password-title"
                style={{
                  margin: '0 0 0.25rem',
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1f2937',
                }}
              >
                Change Password
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                Update your password to keep your account secure
              </p>
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '2.5rem',
            alignItems: 'flex-start',
            maxWidth: '950px',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '24px',
            boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.10)',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Main Form */}
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '18px',
              padding: '2.5rem 2rem',
              boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.08)',
              border: '1px solid rgba(229,231,235,0.5)',
              minWidth: 0,
            }}
          >
            {message.text && (
              <div
                className={`alert ${message.type === 'error' ? 'alert--error' : 'alert--success'}`}
                role={message.type === 'error' ? 'alert' : 'status'}
                style={{
                  marginBottom: '1.5rem',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: message.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>
                  {message.type === 'error' ? '⚠️' : '✅'}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            <form className="form" onSubmit={handleSubmit} autoComplete="off">
              {/* Current Password */}
              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="currentPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem',
                  }}
                >
                  Current Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required
                    disabled={loading}
                    placeholder="Enter your current password"
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 1rem',
                      fontSize: '1.08rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      background: 'rgba(243,244,246,0.7)',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.35rem',
                      color: '#2563eb',
                      padding: 0,
                    }}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="newPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem',
                  }}
                >
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    required
                    disabled={loading}
                    placeholder="Enter your new password"
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 1rem',
                      fontSize: '1.08rem',
                      border: `2px solid ${newPassword && !validations.minLength ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      background: 'rgba(243,244,246,0.7)',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = newPassword && !validations.minLength ? '#fca5a5' : '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.35rem',
                      color: '#2563eb',
                      padding: 0,
                    }}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-field" style={{ marginBottom: '2rem' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.95rem',
                  }}
                >
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    required
                    disabled={loading}
                    placeholder="Re-enter your new password"
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 1rem',
                      fontSize: '1.08rem',
                      border: `2px solid ${confirmPassword && !validations.passwordsMatch ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      background: 'rgba(243,244,246,0.7)',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = confirmPassword && !validations.passwordsMatch ? '#fca5a5' : '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.35rem',
                      color: '#2563eb',
                      padding: 0,
                    }}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingTop: '1.5rem',
                  borderTop: '2px solid #f3f4f6',
                }}
              >
                <button
                  type="submit"
                  disabled={loading || !allValidationsPassed}
                  style={{
                    flex: 1,
                    padding: '0.875rem 2rem',
                    background:
                      loading || !allValidationsPassed
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1rem',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow:
                      loading || !allValidationsPassed
                        ? 'none'
                        : '0 4px 12px rgba(37, 99, 235, 0.3)',
                    cursor: loading || !allValidationsPassed ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? '🔄 Changing Password...' : '✓ Change Password'}
                </button>
                <Link
                  to="/dashboard"
                  style={{
                    flex: 1,
                    padding: '0.875rem 2rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '700',
                    fontSize: '1rem',
                    border: 'none',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#e5e7eb')}
                  onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Validation Sidebar */}
          <div>
            {/* User Info Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: 'white',
                  }}
                >
                  👤
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: '#1f2937' }}>
                    {user?.name || 'User'}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1.25rem',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>📋</span> Password Requirements
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ValidationItem label="At least 8 characters" isValid={validations.minLength} />
                <ValidationItem label="One uppercase letter" isValid={validations.hasUpperCase} />
                <ValidationItem label="One lowercase letter" isValid={validations.hasLowerCase} />
                <ValidationItem label="One number" isValid={validations.hasNumber} />
                <ValidationItem label="Passwords match" isValid={validations.passwordsMatch} />
              </div>

              {/* Security Tip */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                  <div>
                    <p
                      style={{
                        margin: '0 0 0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        color: '#1e40af',
                      }}
                    >
                      Security Tip
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: '#475569',
                        lineHeight: '1.5',
                      }}
                    >
                      Use a unique password that you don't use for other accounts. Consider using a
                      password manager to generate and store strong passwords.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


