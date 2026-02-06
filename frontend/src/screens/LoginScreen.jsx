
import React, { useState, useEffect } from 'react';
import '../authOutlook.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { socialLogos } from '../assets/social-logos';

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
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
            <Logo size="medium" showText={false} />
          </div>

          <h2>Sign in to PledgeHub</h2>
          
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
                <div style={{ position: 'relative', marginBottom: '20px' }}>
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
                    {showPassword ? '👁️ Hide' : '👁️ Show'}
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
              {step === 1 ? 'Next' : loading ? 'Signing in...' : 'Login'}
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


