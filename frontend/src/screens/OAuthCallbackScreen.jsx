import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../authOutlook.css';

export default function OAuthCallbackScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth() || {};
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token received');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store token
        localStorage.setItem('token', token);

        // Update auth context if available
        if (typeof setToken === 'function') {
          setToken(token);
        }

        setStatus('success');

        // Redirect to dashboard after brief delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setToken]);

  return (
    <div className="oauth-callback-screen">
      <div className="oauth-callback-card">
        {status === 'processing' && (
          <>
            <div className="oauth-spinner"></div>
            <h2 className="oauth-title">
              Signing you in...
            </h2>
            <p className="oauth-subtitle">
              Please wait while we complete your authentication
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="oauth-status-icon oauth-status-success">
              ✓
            </div>
            <h2 className="oauth-title">
              Success!
            </h2>
            <p className="oauth-subtitle">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="oauth-status-icon oauth-status-error">
              ✕
            </div>
            <h2 className="oauth-title">
              Authentication Failed
            </h2>
            <p className="oauth-subtitle oauth-error-copy">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <a href="/login" className="auth-inline-link auth-inline-link-compact">
              Return to login
            </a>
          </>
        )}
      </div>
    </div>
  );
}


