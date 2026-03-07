import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import '../authOutlook.css';

import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';

const phonePattern = /^(\+?256|0)?\d{9,10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterScreen({ disableRequired = false }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => document.body.classList.remove('auth-bg');
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) {
      const errorLower = error.toLowerCase();
      const fieldName = name.toLowerCase();
      if (
        (errorLower.includes('first name') && fieldName === 'firstname') ||
        (errorLower.includes('last name') && fieldName === 'lastname') ||
        (errorLower.includes('phone') && fieldName === 'phone') ||
        (errorLower.includes('email') && fieldName === 'email')
      ) {
        setError('');
      }
    }
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!phonePattern.test(form.phone.trim())) return 'Phone number must be in format +256XXXXXXXXX or 0XXXXXXXXX.';
    if (form.email && !emailPattern.test(form.email)) return 'Invalid email address.';
    return '';
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 3000);
    } catch {
      // fallback — browser doesn't support clipboard API
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Validating form...');
    const err = validate();
    if (err) {
      setError(err);
      setStatus('');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('Creating account...');
    try {
      const phoneDigits = form.phone.replace(/\D/g, '');
      const base = form.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = phoneDigits.slice(-4);
      const username = `${base}${suffix}`;
      const payload = {
        name: (form.firstName + ' ' + form.lastName).trim(),
        email: form.email.trim() ? form.email.trim() : null,
        phone: form.phone.trim(),
        username,
        // No password — backend auto-generates one
      };
      setStatus('Sending to server...');
      const result = await register(payload);
      if (result && result.token) {
        if (result.generatedPassword) {
          // Show generated password before navigating
          setGeneratedPassword(result.generatedPassword);
          setStatus('');
        } else {
          setStatus('Account created! Redirecting...');
          navigate('/dashboard', { replace: true });
        }
      } else {
        const errorMsg = result?.error || result?.message || 'Registration failed. Please try again.';
        setError(errorMsg);
        setStatus('');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || err?.toString();
      setError(msg || 'Server error. Please try again.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Post-registration: show the generated password exactly once
  if (generatedPassword) {
    return (
      <div className="auth-bg">
        <main>
          <section className="auth-center-card">
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '28px' }}>
              <Logo size="large" showText={false} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)',
                border: '2px solid #10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28,
              }}>✓</div>
              <h2 style={{ color: '#10b981', marginBottom: 8 }}>Account Created!</h2>
              <p className="subtitle" style={{ color: '#e2e8f0' }}>
                Your account is ready. A secure password has been generated for you.
              </p>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '2px solid #f59e0b',
              borderRadius: 12,
              padding: '20px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Your generated password</p>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: '0.12em',
                marginBottom: 12,
                wordBreak: 'break-all',
              }}>{generatedPassword}</p>
              <button
                type="button"
                onClick={handleCopyPassword}
                style={{
                  background: passwordCopied ? '#10b981' : 'rgba(245,158,11,0.2)',
                  color: passwordCopied ? '#fff' : '#f59e0b',
                  border: `1px solid ${passwordCopied ? '#10b981' : '#f59e0b'}`,
                  borderRadius: 6,
                  padding: '6px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {passwordCopied ? 'Copied!' : 'Copy Password'}
              </button>
            </div>

            <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 20 }}>
              <span className="auth-alert-icon">⚠</span>
              <span>Save this password — it will not be shown again. You can change it in Settings.</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              style={{ width: '100%' }}
            >
              I have saved my password — Continue
            </button>

            <div className="auth-meta" style={{ marginTop: 16 }}>
              <Link to="/change-password" className="auth-inline-link">Change my password later</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="large" showText={false} />
          </div>

          <h2>Create your PledgedHub account</h2>
          <p className="subtitle" style={{ color: '#e2e8f0' }}>Sign up — a secure password will be generated for you</p>

          <OAuthButtons className="mb-4" />

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="auth-alert-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {status && (
            <div className="auth-alert auth-alert-success" role="status">
              <span>{status}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="auth-row">
              <div>
                <label htmlFor="firstName">
                  First Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  placeholder="First Name"
                  disabled={loading}
                  required={!disableRequired}
                />
              </div>
              <div>
                <label htmlFor="lastName">
                  Last Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  placeholder="Last Name"
                  disabled={loading}
                  required={!disableRequired}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone">
                Phone Number <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="e.g. +256771234567"
                disabled={loading}
                required={!disableRequired}
              />
            </div>

            <div>
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="Email address"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Register"
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-meta">
            Already have an account?{' '}
            <Link to="/login" className="auth-inline-link">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

RegisterScreen.propTypes = {
  disableRequired: PropTypes.bool,
};

export default RegisterScreen;
