import React from 'react';

const NotFoundScreen = () => {
  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
      }}
      aria-labelledby="notfound-heading"
    >
      <div style={{ marginBottom: '1.5rem', animation: 'float404 3s ease-in-out infinite' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="58" fill="#e0e7ef" stroke="#3b82f6" strokeWidth="4" />
          <text x="50%" y="54%" textAnchor="middle" fill="#3b82f6" fontSize="48" fontWeight="bold" dy=".3em">404</text>
          <text x="50%" y="75%" textAnchor="middle" fill="#64748b" fontSize="18" dy=".3em">Oops!</text>
        </svg>
      </div>
      <h1 id="notfound-heading" style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1e293b', margin: 0, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
        Page Not Found
      </h1>
      <p style={{ margin: '0 0 1.5rem', fontSize: '1.15rem', color: '#334155', maxWidth: '36ch', opacity: 0.93 }} aria-live="polite">
        Sorry, the page you’re looking for doesn’t exist or has been moved.<br />
        Please check the URL or return to the homepage.
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '1.08rem',
          padding: '0.85rem 2.2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 24px #3b82f633',
          textDecoration: 'none',
          marginTop: '0.5rem',
          transition: 'background 0.2s, transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}
      >
        ← Back to Home
      </a>
      <style>{`
        @keyframes float404 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
};

export default NotFoundScreen;


