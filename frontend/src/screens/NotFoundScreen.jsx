import React from 'react';

const NotFoundScreen = () => {
  const containerStyle = {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '2rem',
    color: '#222',
    background: '#fff',
  };

  const headingStyle = {
    fontSize: '3rem',
    margin: '0 0 0.5rem',
    lineHeight: 1,
  };

  const messageStyle = {
    margin: '0 0 1rem',
    fontSize: '1rem',
    maxWidth: '36ch',
  };

  const linkStyle = {
    margin: '0 0.5rem',
    color: '#0366d6',
    textDecoration: 'underline',
  };

  return (
    <main style={containerStyle} aria-labelledby="notfound-heading">
      <h1 id="notfound-heading" style={headingStyle}>
        404 — Not Found
      </h1>
      <p style={messageStyle} aria-live="polite">
        The page you requested could not be found. You can return to the site below.
      </p>
      <nav aria-label="Not found links">
        <a href="/" style={linkStyle}>
          Home
        </a>
        <a href="/dashboard" style={linkStyle}>
          Dashboard
        </a>
      </nav>
    </main>
  );
};

export default NotFoundScreen;


