
import React, { useState, useEffect } from 'react';
import '../authOutlook.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uiDebug } from '../utils/debug';

import Logo from '../components/Logo';
import OAuthButtons from '../components/OAuthButtons';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => document.body.classList.remove('auth-bg');
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // Normalize phone number format (remove spaces, dashes, parentheses, convert 0 prefix to 256)
  const normalizeIdentifier = (input) => {
    if (!input) return '';
    const trimmed = input.trim();
    // Check if it looks like a phone number
    if (/^\+?[1-9]\d{7,14}$/.test(trimmed.replace(/[\s\-()]/g, ''))) {
      let normalized = trimmed.replace(/[\s\-()]/g, '');
      // Convert 0771234567 to +256771234567
      if (normalized.startsWith('0')) {
        normalized = '+256' + normalized.substring(1);
      }
      // Ensure + prefix for international numbers
      if (!normalized.startsWith('+')) {
        normalized = '+' + normalized;
      }
      return normalized;
    }
    // Not a phone number, return as-is (email or username)
    return trimmed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNext();
      return;
    }

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedEmail = normalizeIdentifier(form.email);
      uiDebug('[LoginScreen] Attempting login with:', { email: normalizedEmail });
      const result = await login({ email: normalizedEmail, password: form.password });
      
      uiDebug('[LoginScreen] Login result received:', result);
      
      // Check if login was successful
      if (result && result.success === false && result.error) {
        // Error response from handleRequest
        console.error('[LoginScreen] 🔐 Login API error:', result.error);
        setError(result.error);
        setSuccess('');
      } else if (result && result.token) {
        uiDebug('[LoginScreen] Login successful, token received, showing success and redirecting');
        setSuccess('Login successful! Redirecting to dashboard...');
        setError('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800); // Show success for 0.8s before redirect
      } else if (result && result.user && !result.token) {
        console.error('[LoginScreen] 🔐 User received but no token');
        setError('Login failed: No authentication token received');
        setSuccess('');
      } else if (!result) {
        console.error('[LoginScreen] 🔐 No response from login');
        setError('No response from server. Please check your connection.');
        setSuccess('');
      } else {
        console.error('[LoginScreen] 🔐 Unexpected login response:', result);
        setError(result?.error || 'Login failed. Please check your credentials.');
        setSuccess('');
      }
    } catch (err) {
      console.error('[LoginScreen] 🔐 Login exception:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Login failed. Please try again.';
      setError(errorMsg);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    setStep(2);
  };

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="medium" showText={false} />
          </div>

          <h2>Sign in to PledgedHub</h2>

          {/* OAuth login options */}
          <OAuthButtons className="mb-4" />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
            {/* Email/Username/Phone field */}
            <div>
              <label htmlFor="email">
Email, Username, or Phone <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="text"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email, username, or phone"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            {/* Password field only appears after email step */}
            {step >= 2 && (
              <div>
                <label htmlFor="password">
                  Password <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="auth-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    className="auth-toggle-btn"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* Next/Login button */}
            <button
              type={step === 1 ? 'button' : 'submit'}
              onClick={step === 1 ? handleNext : undefined}
              disabled={loading}
              aria-busy={loading}
            >
              {step === 1 ? 'Next' : loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/register">Create an account</Link>
          </div>
        </section>
      </main>
    </div>
  );
}


