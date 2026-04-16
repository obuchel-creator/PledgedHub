import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show popup only if not previously accepted/rejected
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(37,99,235,0.13)',
        padding: '1.5rem 2rem',
        maxWidth: '95vw',
        minWidth: '260px',
        border: '1px solid #e0e7ef',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ fontSize: '1.05rem', color: '#2563eb', fontWeight: 500 }}>
        This website uses cookies to enhance your experience. See our{' '}
        <a
          href={`${import.meta.env.BASE_URL}privacy`}
          style={{ color: '#2563eb', textDecoration: 'underline' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        .
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleAccept}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.7rem 1.3rem',
            fontWeight: 500,
            fontSize: '1rem',
            cursor: 'pointer',
            marginRight: '0.5rem',
            minWidth: '90px',
          }}
        >
          Accept
        </button>
        <button
          onClick={handleReject}
          style={{
            background: '#64748b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.7rem 1.3rem',
            fontWeight: 500,
            fontSize: '1rem',
            cursor: 'pointer',
            minWidth: '90px',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}


