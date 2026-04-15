import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/quickbooks-auth.css';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

// More flexible phone pattern - accepts various formats
// +256, 0256, 256, or just numbers starting with common prefixes
const phonePattern = /^(\+?256|0)?\d{9,10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

console.log('🟠 RegisterScreen.jsx: File loaded');

console.log('🟠 RegisterScreen.jsx: File loaded');

function RegisterScreen({ disableRequired = false }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  console.log('🟢 RegisterScreen: Component rendered');
  
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
  const [status, setStatus] = useState(''); // For showing real-time status
  
  console.log('📊 RegisterScreen: Current form state:', form);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('📝 Input changed:', name, '=', value);
    setForm({ ...form, [name]: value });
    
    // Only clear error if it's related to the field being edited
    if (error) {
      const errorLower = error.toLowerCase();
      const fieldName = name.toLowerCase();
      
      // Clear error if user is fixing the field that caused it
      if (
        (errorLower.includes('password') && (fieldName === 'password' || fieldName === 'confirmpassword')) ||
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
    if (!phonePattern.test(form.phone.trim())) return 'Phone number must be in format';
    if (form.email && !emailPattern.test(form.email)) return 'Invalid email address';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 RegisterScreen: handleSubmit called!');
    console.log('📋 Form data:', form);
    setStatus('⏳ Validating form...');
    const err = validate();
    console.log('✓ Validation result:', err || 'PASSED');
    if (err) {
      console.log('❌ Validation failed:', err);
      setError(err);
      setStatus('');
      // Don't auto-clear validation errors - user needs to see and fix them
      return;
    }
    setLoading(true);
    setError('');
    setStatus('⏳ Creating account...');
    try {
      // Auto-generate username: firstName + last 4 digits of phone
      const phoneDigits = form.phone.replace(/\D/g, '');
      const base = form.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = phoneDigits.slice(-4);
      const username = `${base}${suffix}`;
      const payload = {
        name: (form.firstName + ' ' + form.lastName).trim(),
        email: form.email.trim() ? form.email.trim() : null,
        phone: form.phone.trim(),
        password: form.password,
        username,
      };
      console.log('📝 RegisterScreen: Submitting registration with payload:', payload);
      setStatus('⏳ Sending to server...');
      // Use context's register function which handles token + user data loading
      const result = await register(payload);
      console.log('✅ RegisterScreen: Registration result:', result);
      if (result && result.token) {
        console.log('✅ RegisterScreen: Token received and user context loaded');
        setStatus('✅ Account created! Redirecting to dashboard...');
        // The context's register() already called refreshUser() and set loading=false
        // Now we can safely navigate
        console.log('✅ RegisterScreen: Navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        // Show backend error (duplicate phone/email, password strength, etc)
        let errorMsg = result?.error || result?.message || 'Registration failed. Please try again.';
        if (typeof errorMsg === 'string') {
          // Match backend messages exactly
          if (errorMsg.toLowerCase().includes('phone number already in use') || 
              errorMsg.toLowerCase().includes('phone already')) {
            errorMsg = '❌ This phone number is already registered. Please use a different number or log in.';
          } else if (errorMsg.toLowerCase().includes('email already in use') || 
                     errorMsg.toLowerCase().includes('email already')) {
            errorMsg = '❌ This email is already registered. Please use a different email or log in.';
          } else if (errorMsg.toLowerCase().includes('password must')) {
            // Password validation errors - show as-is with emoji
            errorMsg = '❌ ' + errorMsg;
          }
        }
        setError(errorMsg);
        setStatus('');
      }
    } catch (err) {
      // Show network/server error
      console.error('❌ RegisterScreen: Catch error:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || err?.toString();
      setError(msg || 'Server error. Please try again.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <main>
        <section className="auth-center-card">
          <div>
            <Logo size="large" showText={false} />
          </div>

          <h2>Create your PledgeHub account</h2>
          <p className="subtitle">Join thousands of successful pledge managers</p>

          {error && <div className="error-message">{error}</div>}
          {status && <div className="success-message">{status}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  placeholder="John"
                  disabled={loading}
                  required={!disableRequired}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  placeholder="Doe"
                  disabled={loading}
                  required={!disableRequired}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="+256 771 234567"
                disabled={loading}
                required={!disableRequired}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="john@example.com"
                disabled={loading}
              />
            </div>

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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={loading}
                  required={!disableRequired}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={loading}
                  required={!disableRequired}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={loading}
                  tabIndex="-1"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  👁️
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              <span className="btn-icon">✓</span>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="form-footer-text">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-footer">
            By signing up, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link>
            {' and '}
            <Link to="/privacy">Privacy Policy</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

RegisterScreen.propTypes = {
  disableRequired: PropTypes.bool,
};

export default RegisterScreen;



