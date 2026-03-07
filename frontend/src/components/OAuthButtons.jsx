import React from 'react';
import { getViteEnv } from '../utils/getViteEnv';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.43c-.24 1.24-.95 2.29-2.02 3l3.27 2.54c1.9-1.75 3-4.33 3-7.4 0-.7-.06-1.38-.2-2.04H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.27-2.54c-.9.6-2.04.95-3.35.95-2.58 0-4.76-1.74-5.55-4.08H3.08v2.63A9.99 9.99 0 0012 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.45 13.9A6.03 6.03 0 016.1 12c0-.65.12-1.28.35-1.9V7.47H3.08A9.99 9.99 0 002 12c0 1.62.39 3.14 1.08 4.53l3.37-2.63z"
      />
      <path
        fill="#4285F4"
        d="M12 5.98c1.47 0 2.8.5 3.84 1.47l2.88-2.88A9.98 9.98 0 0012 2 9.99 9.99 0 003.08 7.47l3.37 2.63c.79-2.34 2.97-4.12 5.55-4.12z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.02 10.12 11.93v-8.44H7.08v-3.5h3.04V9.4c0-3.02 1.79-4.68 4.53-4.68 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.94-1.96 1.9v2.28h3.34l-.53 3.5h-2.81V24C19.61 23.09 24 18.1 24 12.07z"
      />
      <path fill="#fff" d="M16.67 15.56l.53-3.5h-3.34V9.78c0-.96.46-1.9 1.96-1.9h1.52V4.91s-1.38-.24-2.69-.24c-2.74 0-4.53 1.67-4.53 4.68v2.7H7.08v3.5h3.04V24c.61.1 1.24.15 1.88.15s1.27-.05 1.88-.15v-8.44h2.79z" />
    </svg>
  );
}

/**
 * OAuth Login Buttons Component
 * Handles Google and Facebook OAuth authentication
 */
const OAuthButtons = ({ className = '' }) => {
  // Use Vite env variable (REACT_APP_API_URL fallback for legacy, but Vite uses VITE_API_URL)
  const env = getViteEnv();
  const API_BASE = env.API_URL || 'http://localhost:5001';

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${API_BASE}/api/auth/facebook`;
  };

  return (
    <div className={`oauth-buttons ${className}`}>
      <p className="oauth-caption">Continue with</p>

      <div className="oauth-buttons-container">
        <button
          onClick={handleGoogleLogin}
          className="oauth-btn google-btn"
          type="button"
          aria-label="Continue with Google"
        >
          <span className="oauth-icon-badge" aria-hidden="true">
            <GoogleIcon />
          </span>
          <span className="oauth-text">Continue with Google</span>
        </button>

        <button
          onClick={handleFacebookLogin}
          className="oauth-btn facebook-btn"
          type="button"
          aria-label="Continue with Facebook"
        >
          <span className="oauth-icon-badge" aria-hidden="true">
            <FacebookIcon />
          </span>
          <span className="oauth-text">Continue with Facebook</span>
        </button>
      </div>

      <div className="oauth-divider">
        <span>or use email</span>
      </div>

      <div className="oauth-fallback">
        <p>
          <a href="/register">Create an account</a> or <a href="/login">sign in with email</a>
        </p>
      </div>

      <style jsx>{`
        .oauth-buttons {
          width: 100%;
          margin: 0 auto;
          padding: 0.2rem 0 0.45rem;
          text-align: center;
        }

        .oauth-caption {
          margin: 0 0 0.55rem;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1px;
        }

        .oauth-buttons-container {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          margin-bottom: 0.65rem;
        }

        .oauth-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.55rem;
          padding: 7px 10px;
          border: 1px solid rgba(203, 213, 225, 0.24);
          border-radius: 7px;
          background: #242424;
          color: #f1f5f9;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          min-height: 36px;
        }

        .oauth-btn:hover {
          border-color: rgba(148, 163, 184, 0.5);
          background: #2b2b2b;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(2, 6, 23, 0.3);
        }

        .oauth-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .google-btn:hover {
          border-color: rgba(66, 133, 244, 0.55);
        }

        .facebook-btn:hover {
          border-color: rgba(24, 119, 242, 0.55);
        }

        .oauth-icon-badge {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
          flex-shrink: 0;
        }

        .oauth-text {
          flex: 1;
          text-align: left;
        }

        .oauth-divider {
          position: relative;
          margin: 0.75rem 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .oauth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(148, 163, 184, 0.26);
          z-index: 1;
        }

        .oauth-divider span {
          position: relative;
          background: #1f1f1f;
          padding: 0 0.6rem;
          z-index: 2;
        }

        .oauth-fallback p {
          margin: 0;
          color: #cbd5e1;
          font-size: 11px;
        }

        .oauth-fallback a {
          color: #fbbf24;
          text-decoration: none;
        }

        .oauth-fallback a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .oauth-buttons {
            padding: 0.1rem 0 0.35rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OAuthButtons;


