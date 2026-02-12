
import React, { useState, useEffect } from 'react';
import '../styles/quickbooks-auth.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

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
    // Clear error when user starts typing again
    if (error) {
      setError('');
    }
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
      const result = await login({ email: form.email, password: form.password });
      
      if (result && result.success === false) {
        const errorMsg = result.error || result.message || 'Login failed. Please check your credentials.';
        
        let displayMsg = errorMsg;
        if (typeof errorMsg === 'string') {
          if (errorMsg.toLowerCase().includes('invalid credentials') || 
              errorMsg.toLowerCase().includes('invalid password')) {
            displayMsg = '❌ Incorrect email/phone or password. Please try again.';
          } else if (errorMsg.toLowerCase().includes('user not found')) {
            displayMsg = '❌ No account found. Please sign up first.';
          } else if (errorMsg.toLowerCase().includes('too many failed')) {
            displayMsg = '⏱️ Too many failed attempts. Please try again in 15 minutes.';
          } else if (!errorMsg.startsWith('❌') && !errorMsg.startsWith('⏱️')) {
            displayMsg = '❌ ' + errorMsg;
          }
        }
        setError(displayMsg);
        setSuccess('');
      } else if (result && result.token) {
        setSuccess('Login successful! Redirecting to dashboard...');
        setError('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else if (result && result.user && !result.token) {
        setError('Login failed: No authentication token received');
        setSuccess('');
      } else if (!result) {
        setError('No response from server. Please check your connection.');
        setSuccess('');
      } else {
        setError(result?.error || 'Login failed. Please check your credentials.');
        setSuccess('');
      }
    } catch (err) {
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
          <div>
            <Logo size="medium" showText={false} />
          </div>

          <h2>Let's get you in to PledgeHub</h2>
          <p className="subtitle">Access your account securely</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} noValidate>
            {/* Email/Username/Phone field */}
            <div className="form-group">
              <label htmlFor="email">
                Email, Username, or Phone <span className="required">*</span>
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
              <div className="form-group">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    👁️
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {step >= 2 && (
              <div className="form-checkbox">
                <input
                  id="remember"
                  type="checkbox"
                  checked={step === 2}
                  onChange={() => {}}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
            )}

            {/* Next/Login button */}
            <button
              type={step === 1 ? 'button' : 'submit'}
              onClick={step === 1 ? handleNext : undefined}
              disabled={loading}
              aria-busy={loading}
            >
              <span className="btn-icon">
                {step === 1 ? '→' : '🔒'}
              </span>
              {step === 1 ? 'Next' : loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="form-footer-text">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </form>

          <p className="form-footer-text">
            New to PledgeHub?{' '}
            <Link to="/register">Create an account</Link>
          </p>

          <p className="auth-footer">
            By signing in, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link>
            {' and '}
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </section>
      </main>
    </div>
  );
}


