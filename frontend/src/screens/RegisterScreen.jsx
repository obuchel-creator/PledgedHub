import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import '../authOutlook.css';
import Logo from '../components/Logo';

const phonePattern = /^\+256\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

import { registerUser } from '../services/api';

function RegisterScreen({ disableRequired = false }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!phonePattern.test(form.phone.trim())) return 'Phone number must be in format';
    if (form.email && !emailPattern.test(form.email)) return 'Invalid email address';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: (form.firstName + ' ' + form.lastName).trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      console.log('📝 RegisterScreen: Submitting registration with payload:', payload);
      const result = await registerUser(payload);
      console.log('✅ RegisterScreen: Registration result:', result);
      if (result && result.token) {
        console.log('✅ RegisterScreen: Token received, redirecting to dashboard');
        localStorage.setItem('pledgehub_token', result.token);
        navigate('/dashboard');
      } else {
        console.log('❌ RegisterScreen: No token in result:', result);
        setError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      // If the error has a specific message, use it; otherwise, use 'Server error'
      console.error('❌ RegisterScreen: Catch error:', err);
      const msg = err?.response?.data?.message || err?.message;
      if (msg && (
        msg.toLowerCase().includes('invalid email address') ||
        msg.toLowerCase().includes('passwords do not match') ||
        msg.toLowerCase().includes('phone number must be in format')
      )) {
        setError(msg);
      } else {
        setError('Server error: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="medium" showText={true} />
          </div>

          <h2>Create your account</h2>
          <p className="subtitle">Sign up to PledgeHub</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
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
              <div style={{ flex: 1 }}>
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

            <div>
              <label htmlFor="password">
                Password <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Password"
                  disabled={loading}
                  required={!disableRequired}
                  style={{ paddingRight: '90px !important', marginBottom: '0' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#3498db',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 8px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    lineHeight: 1,
                    height: 'auto',
                    width: 'auto',
                    margin: '0'
                  }}
                >
                  {showPassword ? '??? Hide' : '??? Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword">
                Confirm Password <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  disabled={loading}
                  required={!disableRequired}
                  style={{ paddingRight: '90px !important', marginBottom: '0' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#3498db',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 8px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    lineHeight: 1,
                    height: 'auto',
                    width: 'auto',
                    margin: '0'
                  }}
                >
                  {showConfirmPassword ? '??? Hide' : '??? Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="Register"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '15px', color: '#475569', fontWeight: '500' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3498db', fontWeight: '600', textDecoration: 'none', borderBottom: '1px solid #3498db' }}>
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



