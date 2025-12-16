import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import TextInput from '../components/TextInput';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    };
    // Real-time validation for username/phone
    if (e.target.name === 'phone' && e.target.value && !/^\+256\d{9}$/.test(e.target.value)) {
      setError('Phone number must be in format +256XXXXXXXXX');
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Prefer username, then phone, then fallback to email (if backend supports)
      const payload = {
        username: form.username.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      const response = await loginUser(payload);
      if (response && response.success && response.token) {
        login(response.token, response.user);
        localStorage.setItem('authToken', response.token);
        navigate('/dashboard');
      } else {
        setError(response?.message || 'Invalid login response');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 24px #0002',
          padding: 36,
          minWidth: 350,
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
        aria-label="Login form"
        role="form"
        tabIndex={0}
        autoComplete="on"
      >
        <h2 style={{ textAlign: 'center', marginBottom: 8, color: '#222', fontWeight: 700, fontSize: 28 }}>Sign in to PledgeHub</h2>
        <div style={{ color: '#666', textAlign: 'center', fontSize: 15, marginBottom: 8 }}>Enter your credentials to continue</div>

        <TextInput
          id="username"
          name="username"
          label="Username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          placeholder="Username"
          disabled={loading}
          required
        />
        <TextInput
          id="phone"
          name="phone"
          label="Phone Number"
          value={form.phone}
          onChange={handleChange}
          autoComplete="tel"
          placeholder="e.g. +256771234567"
          disabled={loading}
        />
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          disabled={loading}
          required
          show={showPassword}
          onToggleShow={() => setShowPassword((s) => !s)}
        />
        <button
          type="submit"
          aria-label="Login"
          style={{
            marginTop: 8,
            padding: '12px 0',
            background: loading ? '#b3c7e6' : '#0050a8',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
            letterSpacing: 0.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          disabled={loading}
          tabIndex={0}
        >
          {loading && <span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid #0050a8', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              style={{
                background: '#f8d7da',
                color: '#842029',
                border: '1px solid #f5c2c7',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 4,
                textAlign: 'center',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 15, color: '#181818', fontWeight: 600, letterSpacing: 0.1 }}>
          <Link to="/forgot-password" style={{ color: '#0050a8', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.2 }} tabIndex={loading ? -1 : 0} aria-disabled={loading}>
            Forgot password?
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 15, color: '#181818', fontWeight: 600, letterSpacing: 0.1 }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#0050a8', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.2 }}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

