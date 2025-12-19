import { getViteEnv } from '../utils/getViteEnv';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * OAuth Callback Handler Component
 * Processes OAuth redirects and completes authentication
 */
const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your login...');

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const provider = urlParams.get('provider');
        const error = urlParams.get('error');

        // Handle OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error.replace(/_/g, ' ')}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Handle missing token
        if (!token) {
          setStatus('error');
          setMessage('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log(
          `🔄 Processing ${provider} OAuth callback with token:`,
          token.substring(0, 20) + '...',
        );

        // Save token to localStorage
        localStorage.setItem('pledgehub_token', token);
        localStorage.setItem('authProvider', provider || 'unknown');

        // Verify token with backend
        const API_BASE = getViteEnv().API_URL || 'http://localhost:5001';

        const response = await fetch(`${API_BASE}/api/auth/verify`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log(`✅ Authentication successful via ${provider}:`, data.user);

          // Store user info
          localStorage.setItem('user', JSON.stringify(data.user));

          setStatus('success');
          setMessage(`Welcome back! Logged in via ${provider}.`);

          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.error('❌ Token verification failed:', data);
          setStatus('error');
          setMessage(data.message || 'Token verification failed');

          // Clear invalid token
          localStorage.removeItem('pledgehub_token');
          localStorage.removeItem('authProvider');

          setTimeout(() => navigate('/login?error=verification_failed'), 3000);
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');

        // Clear potentially invalid token
        localStorage.removeItem('pledgehub_token');
        localStorage.removeItem('authProvider');

        setTimeout(() => navigate('/login?error=callback_error'), 3000);
      }
    };

    processAuthCallback();
  }, [location, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return '#4285f4';
      case 'success':
        return '#34a853';
      case 'error':
        return '#ea4335';
      default:
        return '#4285f4';
    }
  };

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        <div className="auth-callback-icon" style={{ color: getStatusColor() }}>
          {getStatusIcon()}
        </div>
        <h2 className="auth-callback-title">
          {status === 'processing' && 'Processing Authentication'}
          {status === 'success' && 'Welcome Back!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>
        <p className="auth-callback-message">{message}</p>

        {status === 'processing' && (
          <div className="auth-callback-loader">
            <div className="loader-spinner"></div>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-callback-actions">
            <button onClick={() => navigate('/login')} className="auth-callback-btn">
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-callback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          padding: 2rem;
        }

        .auth-callback-content {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }

        .auth-callback-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: ${status === 'processing' ? 'spin 2s linear infinite' : 'none'};
        }

        .auth-callback-title {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .auth-callback-message {
          margin: 0 0 2rem 0;
          color: #666;
          font-size: 1rem;
          line-height: 1.5;
        }

        .auth-callback-loader {
          margin: 2rem 0;
        }

        .loader-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #4285f4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .auth-callback-actions {
          margin-top: 2rem;
        }

        .auth-callback-btn {
          background: #4285f4;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .auth-callback-btn:hover {
          background: #3367d6;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .auth-callback {
            padding: 1rem;
          }

          .auth-callback-content {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;


