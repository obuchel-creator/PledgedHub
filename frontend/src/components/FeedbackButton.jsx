import React, { useState } from 'react';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setSubmitted(false);
  };
  const handleClose = () => {
    setOpen(false);
    setError('');
    setSubmitted(false);
    setFeedback('');
  };

  // Add missing handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!feedback.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setLoading(true);
    try {
      // Simulate API call (replace with real API if available)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      setFeedback('');
    } catch (err) {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed',
          right: open ? '320px' : '0',
          bottom: '6.5rem', // moved higher to avoid chat bot overlap
          zIndex: 9999,
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '18px 0 0 18px',
          padding: '0.8rem 1.5rem',
          fontWeight: 600,
          fontSize: '1.1rem',
          boxShadow: '0 4px 16px rgba(37,99,235,0.13)',
          cursor: 'pointer',
          fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
          transition: 'right 0.4s cubic-bezier(.4,0,.2,1)',
        }}
        aria-label="Give feedback"
      >
        Feedback
      </button>
      {open && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(37,99,235,0.18)',
              zIndex: 9999,
            }}
            onClick={handleClose}
          />
          {/* Centered Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              background: '#fff',
              borderRadius: '18px',
              boxShadow: '0 8px 32px rgba(37,99,235,0.13)',
              padding: '2rem 2rem 1.5rem',
              minWidth: '320px',
              maxWidth: '90vw',
              border: '1px solid #e0e7ef',
              fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close feedback"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.2rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h3
              style={{
                margin: '0 0 1rem 0',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#2563eb',
                letterSpacing: '0.01em',
                textAlign: 'center',
              }}
            >
              We value your feedback
            </h3>
            {submitted ? (
              <div
                style={{
                  color: '#059669',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  margin: '1.5rem 0',
                  textAlign: 'center',
                }}
              >
                Thank you for your feedback!
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Let us know what you think..."
                  rows={4}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0.7rem',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    marginBottom: '1rem',
                    resize: 'vertical',
                  }}
                  required
                  disabled={loading}
                />
                {error && (
                  <div
                    style={{
                      color: '#d93025',
                      marginBottom: '0.7rem',
                      fontSize: '0.98rem',
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#a5b4fc' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.3rem',
                    fontWeight: 500,
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.10)',
                    transition: 'background 0.2s',
                  }}
                >
                  {loading ? 'Sending…' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}


