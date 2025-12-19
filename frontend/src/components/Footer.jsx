import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="footer"
      role="contentinfo"
      style={{
        marginTop: 'auto',
        padding: '3rem 1.5rem 2rem',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderTop: '2px solid rgba(15, 23, 42, 0.1)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size="medium" showText={false} />
            </Link>
            <p
              style={{
                color: '#0f172a',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginTop: '1rem',
                fontWeight: '500',
              }}
            >
              Building trust through transparency. Manage pledges with confidence and celebrate
              every contribution.
            </p>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/dashboard"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Dashboard
                </Link>
              </li>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/create"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Create Pledge
                </Link>
              </li>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/about"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/help"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Help Center
                </Link>
              </li>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/privacy"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/terms"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Get Started
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/register"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Create Account
                </Link>
              </li>
              <li style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/login"
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                  }}
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            paddingTop: '2rem',
            borderTop: '2px solid rgba(15, 23, 42, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div
            style={{
              color: '#0f172a',
              fontSize: '1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span
              style={{
                color: '#2563eb',
                fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
                fontWeight: 400,
                fontSize: '1.25rem',
                letterSpacing: '0.02em',
                marginLeft: '0.1rem',
                opacity: 0.92,
                background: 'none',
                padding: '0 0.2rem',
              }}
            >
              PledgeHub
            </span>
            <span
              style={{
                color: '#2563eb',
                fontFamily: 'Segoe UI, Arial, sans-serif',
                fontWeight: 400,
                fontSize: '1.25rem',
                letterSpacing: '0.01em',
                background: 'none',
                padding: '0 0.2rem',
              }}
            >
              © {year} PledgeHub Team. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1rem' }}>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>
              Made with ❤️ for the community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


