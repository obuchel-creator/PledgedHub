
import React, { useState, useEffect } from 'react';

const SESSION_KEY = 'pledgehub_feedback_shown';
const DELAY_MS = 90000; // auto-open after 90 seconds

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-open once per session after a delay
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSubmitted(false);
    setFeedback('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!feedback.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setLoading(true);
    try {
      // Simulate API call (replace with real endpoint if available)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      setFeedback('');
    } catch {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15,23,42,0.42)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 16px 56px rgba(15,23,42,0.18)',
          padding: '2.2rem 2.2rem 1.8rem',
          minWidth: 340,
          maxWidth: '92vw',
          border: '1.5px solid #e5e7eb',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close feedback"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3
          id="feedback-modal-title"
          style={{
            margin: '0 0 0.4rem',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#101427',
            textAlign: 'center',
          }}
        >
          How are we doing?
        </h3>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.92rem', margin: '0 0 1.4rem' }}>
          We'd love to know what you think — takes less than a minute.
        </p>

        {submitted ? (
          <div
            style={{
              color: '#059669',
              fontWeight: 600,
              fontSize: '1.05rem',
              textAlign: 'center',
              padding: '1.5rem 0',
            }}
          >
            Thank you for your feedback!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What's working well? What could be better?"
              rows={4}
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1.5px solid #cbd5e1',
                padding: '10px 14px',
                fontSize: '0.98rem',
                fontFamily: 'inherit',
                marginBottom: '1rem',
                resize: 'vertical',
                outline: 'none',
                color: '#101427',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
              disabled={loading}
              required
            />
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '0.6rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: '0.93rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontWeight: 500,
                }}
              >
                Maybe later
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
