
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[LoginScreen] Attempting login with:', { email: form.email });
      const result = await login({ email: form.email, password: form.password });
      
      console.log('[LoginScreen] Login result:', result);
      
      if (result && result.token) {
        console.log('[LoginScreen] Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('[LoginScreen] Login failed:', result?.error);
        setError(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('[LoginScreen] Login error:', err);
      setError(err?.response?.data?.error || err?.message || 'Login failed. Please try again.');
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

          <h2>Sign in to PledgeHub</h2>
          
          {error && <div className="error-message">{error}</div>}
          
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

            {/* Password field */}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
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
