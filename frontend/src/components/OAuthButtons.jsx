import React from 'react';
import { getViteEnv } from '../utils/getViteEnv';

/**
 * OAuth Login Buttons Component
 * Handles Google and Facebook OAuth authentication
 */
const OAuthButtons = ({ className = '' }) => {
  // Use Vite env variable (REACT_APP_API_URL fallback for legacy, but Vite uses VITE_API_URL)
  const env = getViteEnv();
  const API_BASE = env.API_URL || 'http://localhost:5001';

  const handleGoogleLogin = () => {
    console.log('🔵 Initiating Google OAuth...');
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    console.log('📘 Initiating Facebook OAuth...');
    window.location.href = `${API_BASE}/api/auth/facebook`;
  };

  return (
    <div className={`oauth-buttons ${className}`}>
      <div className="oauth-title">
        <h3>Sign in to PledgeHub</h3>
        <p>Choose your preferred login method</p>
      </div>

      <div className="oauth-buttons-container">
        <button onClick={handleGoogleLogin} className="oauth-btn google-btn" type="button">
          <span className="oauth-icon">🔵</span>
          <span className="oauth-text">Continue with Google</span>
        </button>

        <button onClick={handleFacebookLogin} className="oauth-btn facebook-btn" type="button">
          <span className="oauth-icon">📘</span>
          <span className="oauth-text">Continue with Facebook</span>
        </button>
      </div>

      <div className="oauth-divider">
        <span>or</span>
      </div>

      <div className="oauth-fallback">
        <p>
          <a href="/register">Create an account</a> or <a href="/login">sign in with email</a>
        </p>
      </div>

      <style jsx>{`
        .oauth-buttons {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        .oauth-title h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.5rem;
        }

        .oauth-title p {
          margin: 0 0 2rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .oauth-buttons-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          color: #333;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          min-height: 48px;
        }

        .oauth-btn:hover {
          border-color: #d1d5db;
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .oauth-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .google-btn:hover {
          border-color: #4285f4;
          background: #f8f9ff;
        }

        .facebook-btn:hover {
          border-color: #1877f2;
          background: #f8f9ff;
        }

        .oauth-icon {
          font-size: 1.2rem;
        }

        .oauth-text {
          flex: 1;
        }

        .oauth-divider {
          position: relative;
          margin: 2rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .oauth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e1e5e9;
          z-index: 1;
        }

        .oauth-divider span {
          position: relative;
          background: white;
          padding: 0 1rem;
          z-index: 2;
        }

        .oauth-fallback p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .oauth-fallback a {
          color: #4285f4;
          text-decoration: none;
        }

        .oauth-fallback a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .oauth-buttons {
            padding: 1rem;
          }

          .oauth-btn {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OAuthButtons;
