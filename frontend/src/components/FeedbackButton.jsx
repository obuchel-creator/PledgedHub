
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
          right: open ? '320px' : '2.2rem',
          bottom: '6.5rem',
          zIndex: 9999,
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #2563eb 60%, #60a5fa 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 6px 24px 0 rgba(37,99,235,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          transition: 'right 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.2s, transform 0.2s',
          outline: 'none',
        }}
        aria-label="Give feedback"
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(37,99,235,0.28)';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 6px 24px 0 rgba(37,99,235,0.18)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <span style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
          {/* Feedback/Chat SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:0}}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
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
              backdropFilter: 'blur(1.5px)',
              transition: 'background 0.3s',
            }}
            onClick={handleClose}
          />
          {/* Centered Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1)',
              zIndex: 10000,
              background: 'linear-gradient(135deg, #f8fafc 70%, #e0e7ef 100%)',
              borderRadius: '22px',
              boxShadow: '0 12px 48px 0 rgba(37,99,235,0.18)',
              padding: '2.2rem 2.2rem 1.7rem',
              minWidth: '340px',
              maxWidth: '92vw',
              border: '1.5px solid #e0e7ef',
              fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
              boxSizing: 'border-box',
              overflow: 'hidden',
              animation: 'fadeInScale 0.32s cubic-bezier(.4,0,.2,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close feedback"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '1.1rem',
                right: '1.3rem',
                background: 'none',
                border: 'none',
                fontSize: '1.7rem',
                color: '#2563eb',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '2.2rem',
                height: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                    borderRadius: '14px',
                    border: '1.7px solid #e0e7ef',
                    padding: '1.1rem 1.2rem',
                    fontSize: '1.09rem',
                    fontFamily: 'inherit',
                    marginBottom: '1.2rem',
                    resize: 'vertical',
                    background: 'linear-gradient(135deg, #f8fafc 80%, #e0e7ef 100%)',
                    boxShadow: '0 2px 12px 0 rgba(37,99,235,0.07)',
                    outline: 'none',
                    color: '#22223b',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onFocus={e => {
                    e.target.style.border = '1.7px solid #2563eb';
                    e.target.style.boxShadow = '0 4px 18px 0 rgba(37,99,235,0.13)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '1.7px solid #e0e7ef';
                    e.target.style.boxShadow = '0 2px 12px 0 rgba(37,99,235,0.07)';
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
                    background: loading ? 'linear-gradient(90deg, #a5b4fc 60%, #93c5fd 100%)' : 'linear-gradient(90deg, #2563eb 60%, #60a5fa 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.8rem 1.5rem',
                    fontWeight: 600,
                    fontSize: '1.07rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(37,99,235,0.10)',
                    transition: 'background 0.2s',
                    marginTop: '0.2rem',
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


