import React, { useState } from 'react';
import './AuthenticationScreen.css';

export function SignInScreen() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = `${import.meta.env.BASE_URL}dashboard`;
      } else {
        setError(data.error || 'Sign in failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding visible">
        {/* Removed branding text 'PledgeHub' for cleaner look */}
        <div className="auth-branding-tagline">
          Secure API Access for Pledge Management & Financial Services
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          <div className="auth-header">
            {/* Removed header logo text 'PledgeHub' for cleaner look */}
            <h1 className="auth-header-title">Sign In</h1>
            <p className="auth-header-subtitle">Access your PledgeHub account</p>
          </div>

          {error && (
            <div className="auth-success" style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', borderColor: '#D32F2F', color: '#D32F2F' }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-checkbox">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <a href={`${import.meta.env.BASE_URL}forgot-password`} className="form-link">Forgot Password?</a>
          </div>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <a href={`${import.meta.env.BASE_URL}signup`} className="auth-footer-link">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = `${import.meta.env.BASE_URL}signin`;
        }, 2000);
      } else {
        setError(data.error || 'Sign up failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding visible">
        {/* Removed branding text 'PledgeHub' for cleaner look */}
        <div className="auth-branding-tagline">
          Create a new API Management account and start managing pledges securely
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          <div className="auth-header">
            {/* Removed header logo text 'PledgeHub' for cleaner look */}
            <h1 className="auth-header-title">Create Account</h1>
            <p className="auth-header-subtitle">Sign up for PledgeHub</p>
          </div>

          {error && (
            <div className="auth-success" style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', borderColor: '#D32F2F', color: '#D32F2F' }}>
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="form-input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="form-input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <a href={`${import.meta.env.BASE_URL}signin`} className="auth-footer-link">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Password reset link sent to your email');
        setError('');
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding visible">
        {/* Removed branding text 'PledgeHub' for cleaner look */}
        <div className="auth-branding-tagline">
          Reset your password and regain access to your account
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          <div className="auth-header">
            {/* Removed header logo text 'PledgeHub' for cleaner look */}
            <h1 className="auth-header-title">Reset Password</h1>
            <p className="auth-header-subtitle">Enter your email to receive a password reset link</p>
          </div>

          {error && (
            <div className="auth-success" style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', borderColor: '#D32F2F', color: '#D32F2F' }}>
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Remember your password?{' '}
              <a href={`${import.meta.env.BASE_URL}signin`} className="auth-footer-link">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


