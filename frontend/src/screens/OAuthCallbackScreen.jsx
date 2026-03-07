import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div
      style={{
        background: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        {status === 'processing' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #1a73e8',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite',
              }}
            ></div>
            <h2
              style={{
                fontSize: '24px',
                color: '#202124',
                marginBottom: '12px',
              }}
            >
              Signing you in...
            </h2>
            <p
              style={{
                color: '#5f6368',
                fontSize: '14px',
              }}
            >
              Please wait while we complete your authentication
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#34a853',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
                color: 'white',
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontSize: '24px',
                color: '#202124',
                marginBottom: '12px',
              }}
            >
              Success!
            </h2>
            <p
              style={{
                color: '#5f6368',
                fontSize: '14px',
              }}
            >
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '60px',
                height: '60px',
                background: '#ea4335',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '32px',
                color: 'white',
              }}
            >
              ✕
            </div>
            <h2
              style={{
                fontSize: '24px',
                color: '#202124',
                marginBottom: '12px',
              }}
            >
              Authentication Failed
            </h2>
            <p
              style={{
                color: '#5f6368',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              {error || 'Something went wrong. Please try again.'}
            </p>
            <a
              href="/login"
              style={{
                color: '#1a73e8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Return to login
            </a>
          </>
        )}

        <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
      </div>
    </div>
  );
}


