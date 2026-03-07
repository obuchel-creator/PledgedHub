
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TextInput from '../components/TextInput';
import PasswordInput from '../components/PasswordInput';
import { uiDebug } from '../utils/debug';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Only clear error if user is editing a field after an error
    if (error) setError(null);
    // Real-time validation for password strength
    if (name === 'password' && value.length > 0 && value.length < 6) {
      setError('Password must be at least 6 characters.');
    }
    if (name === 'phone' && value) {
      // Only allow digits, must start with 256, exactly 12 digits
      if (!/^256\d{9}$/.test(value)) {
        setError('Phone number must be in format 256XXXXXXXXX (no plus, 12 digits)');
      }
    }
    if (name === 'password' && value) {
      // Password must match backend: 8+ chars, upper, lower, number, special
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!strongPasswordRegex.test(value)) {
        setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      }
    }
    if (name === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
      setError('Invalid email address');
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return false;
    }
    if (!/^256\d{9}$/.test(formData.phone)) {
      setError('Phone number must be in format 256XXXXXXXXX (no plus, 12 digits)');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Invalid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required.');
      return false;
    }
    // Password must match backend: 8+ chars, upper, lower, number, special
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      // Don't clear error here; let validateForm set it
      return;
    }

    setLoading(true);

    try {
      const { firstName, lastName, confirmPassword, ...rest } = formData;
      const registerData = {
        ...rest,
        name: `${firstName} ${lastName}`.trim(),
      };
      const response = await register(registerData);
      uiDebug('[Register] Registration response:', response);
      // Only navigate if registration returns a token (success)
      if (response && (response.token || response.accessToken)) {
        navigate('/dashboard');
      } else if (response && response.error) {
        setError(response.error);
      } else {
        setError('Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 16,
    marginBottom: '8px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: '4px',
    color: '#374151',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 20,
        maxWidth: 400,
        margin: '40px auto',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, color: '#111' }}>Register</h1>
        <p style={{ color: '#666', marginTop: 8 }}>Create your account</p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        aria-label="Register form" 
        role="form" 
        tabIndex={0} 
        autoComplete="on"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          zIndex: 11,
          position: 'relative',
        }}
      >
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              style={{
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                color: '#dc2626',
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>


        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <TextInput
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            autoComplete="given-name"
            placeholder="First Name"
            required
            disabled={loading}
            data-cy="register-firstName"
          />
        </div>
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <TextInput
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            autoComplete="family-name"
            placeholder="Last Name"
            required
            disabled={loading}
            data-cy="register-lastName"
          />
        </div>
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <TextInput
            id="username"
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="Username"
            required
            disabled={loading}
            data-cy="register-username"
          />
        </div>
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <TextInput
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            placeholder="e.g. 256771234567"
            required
            disabled={loading}
            data-cy="register-phone"
            maxLength={12}
          />
        </div>
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <TextInput
            id="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="Email"
            required
            disabled={loading}
            type="email"
            data-cy="register-email"
          />
        </div>
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 12 }}>
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Password"
            required
            disabled={loading}
            data-cy="register-password"
            show={false}
            onToggleShow={() => {}}
            aria-describedby="registerPasswordHelp"
          />
          <div id="registerPasswordHelp" style={{ fontSize: 12, color: '#888', marginTop: -8, marginBottom: 8 }}>
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </div>
        </div>
        <div style={{ marginBottom: 24, position: 'relative', zIndex: 12 }}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Confirm Password"
            required
            disabled={loading}
            data-cy="register-confirmPassword"
            show={false}
            onToggleShow={() => {}}
          />
        </div>

        <button
          type="submit"
          aria-label="Register"
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}


