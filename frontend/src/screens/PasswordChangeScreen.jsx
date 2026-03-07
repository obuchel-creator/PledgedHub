import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import '../authOutlook.css';

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

  // Real-time password validation
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
      await changePassword({
        currentPassword,
        newPassword,
      });

      setMessage({
        type: 'success',
        text: 'Password changed successfully! You can now use your new password to log in.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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

  const ValidationItem = ({ label, isValid }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '8px',
        background: isValid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(148, 163, 184, 0.05)',
        border: `1px solid ${isValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isValid ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: 'white',
          transition: 'all 0.3s ease',
          boxShadow: isValid ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
        }}
      >
        {isValid ? '✓' : '○'}
      </div>
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: isValid ? '#059669' : '#64748b',
          transition: 'color 0.3s ease',
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '3rem',
      }}
    >
      <main
        className="page page--narrow"
        aria-labelledby="password-title"
        style={{ maxWidth: '900px' }}
      >
        {/* Header */}
        <header
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Form */}
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
            }}
          >
            {message.text && (
              <div
                className={`auth-alert ${
                  message.type === 'error' ? 'auth-alert-error' : 'auth-alert-success'
                }`}
                role={message.type === 'error' ? 'alert' : 'status'}
                style={{ marginBottom: '1rem', fontWeight: 600 }}
              >
                <span className="auth-alert-icon">
                  {message.type === 'error' ? '⚠️' : '✅'}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            <form className="form" onSubmit={handleSubmit}>
              {/* Current Password */}
              <div className="form-field auth-input-group">
                <label htmlFor="currentPassword" className="auth-form-label-light">
                  Current Password *
                </label>
                <div className="auth-password-wrap auth-password-wrap-light">
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
                    className="auth-input-light auth-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="auth-toggle-btn auth-toggle-btn-light"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-field auth-input-group">
                <label htmlFor="newPassword" className="auth-form-label-light">
                  New Password *
                </label>
                <div className="auth-password-wrap auth-password-wrap-light">
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
                    className={`auth-input-light auth-password-input ${
                      newPassword && !validations.minLength ? 'auth-input-light-error' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="auth-toggle-btn auth-toggle-btn-light"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-field auth-input-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="confirmPassword" className="auth-form-label-light">
                  Confirm New Password *
                </label>
                <div className="auth-password-wrap auth-password-wrap-light">
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
                    className={`auth-input-light auth-password-input ${
                      confirmPassword && !validations.passwordsMatch ? 'auth-input-light-error' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-toggle-btn auth-toggle-btn-light"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="auth-actions-row">
                <button
                  type="submit"
                  disabled={loading || !allValidationsPassed}
                  className="auth-submit-btn auth-submit-btn-light auth-submit-btn-slim"
                >
                  {loading ? 'Changing password...' : 'Change password'}
                </button>
                <Link
                  to="/dashboard"
                  className="auth-secondary-link-light"
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


