import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f2f4ff',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'white',
          padding: '3rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to="/"
            style={{
              color: '#4285f4',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ? Back to Home
          </Link>
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '1rem',
          }}
        >
          Privacy Policy
        </h1>

        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            marginBottom: '2rem',
          }}
        >
          Last Updated: November 4, 2025
        </p>

        {/* Content */}
        <div
          style={{
            color: '#334155',
            lineHeight: '1.8',
            fontSize: '16px',
          }}
        >
          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We collect information that you provide directly to us when you:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Create an account (name, email address)</li>
              <li>Create or manage pledges</li>
              <li>Record payments</li>
              <li>Contact us for support</li>
              <li>Sign in using Google or Facebook OAuth</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              2. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>We use the information we collect to:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and track pledges and payments</li>
              <li>Send you notifications about your pledges</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              3. OAuth Authentication
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              When you sign in using Google or Facebook OAuth, we receive limited information from
              these providers including your name and email address. We do not store your Google or
              Facebook passwords. You can revoke our access at any time through your Google or
              Facebook account settings.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              4. Information Sharing
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We do not sell, trade, or rent your personal information to third parties. We may
              share your information only in the following circumstances:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              5. Data Security
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. This includes:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Encrypted password storage using bcrypt</li>
              <li>Secure JWT token authentication</li>
              <li>HTTPS encryption for data transmission</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              6. Your Rights
            </h2>
            <p style={{ marginBottom: '1rem' }}>You have the right to:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              7. Cookies and Tracking
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use cookies and similar tracking technologies to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our service</li>
              <li>Improve our platform</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              8. Children's Privacy
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Our service is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              9. Changes to This Privacy Policy
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We may update this privacy policy from time to time. We will notify you of any changes
              by posting the new privacy policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              10. Contact Us
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '1rem',
              }}
            >
              <strong>Email:</strong> privacy@PledgedHubpledge.com
              <br />
              <strong>Address:</strong> [Your Business Address]
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <Link
            to="/"
            style={{
              color: '#4285f4',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}



