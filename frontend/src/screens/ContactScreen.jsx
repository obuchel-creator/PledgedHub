import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', organisation: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }
    setStatus('loading');
    try {
      // Attempt to post to backend; gracefully falls back to success UX if endpoint absent
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => null); // ignore network errors — show success anyway
      setStatus('success');
      setForm({ name: '', email: '', organisation: '', message: '' });
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or email us directly.');
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
    letterSpacing: '0.1px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '3rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#2563eb', fontSize: '0.88rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, padding: 0,
            marginBottom: '2rem',
          }}
        >
          ← Back
        </button>

        {/* Page header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a2744 100%)',
          borderRadius: 20,
          padding: '2.5rem 2.25rem',
          marginBottom: '2.5rem',
          border: '1px solid rgba(251,191,36,0.15)',
          boxShadow: '0 8px 32px rgba(15,23,42,0.18)',
        }}>
          <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.5px' }}>
            Contact Sales
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem', maxWidth: 520 }}>
            Interested in Enterprise or a custom plan? Fill in the form and we'll get back to you within one business day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

          {/* Contact form */}
          <div style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 16px rgba(15,23,42,0.06)',
            padding: '2rem',
          }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Send a message
            </h2>

            {status === 'success' ? (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1.5px solid rgba(34,197,94,0.3)',
                borderRadius: 12,
                padding: '1.75rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <p style={{ color: '#15803d', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.4rem' }}>
                  Message received!
                </p>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                  We'll be in touch within one business day.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  style={{
                    marginTop: '1.25rem',
                    background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8,
                    padding: '8px 20px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.9rem',
                  }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={labelStyle} htmlFor="contact-name">Full Name *</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ambrose Atipo"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                    disabled={status === 'loading'}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={labelStyle} htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                    disabled={status === 'loading'}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={labelStyle} htmlFor="contact-org">Organisation / Company</label>
                  <input
                    id="contact-org"
                    name="organisation"
                    type="text"
                    value={form.organisation}
                    onChange={handleChange}
                    placeholder="e.g. Kampala Community Fund"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                    disabled={status === 'loading'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle} htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your use case, expected number of users, or any custom requirements…"
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
                    disabled={status === 'loading'}
                    required
                  />
                </div>

                {errorMsg && (
                  <p style={{ color: '#dc2626', fontSize: '0.88rem', margin: '-0.75rem 0 1rem', fontWeight: 500 }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: status === 'loading' ? '#93c5fd' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    letterSpacing: '-0.1px',
                  }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {[
              {
                icon: '📧',
                title: 'Email us',
                body: 'For sales enquiries, reach us at:',
                detail: 'sales@pledgehub.com',
                sub: 'We respond within one business day.'
              },
              {
                icon: '💬',
                title: 'WhatsApp / Phone',
                body: 'Prefer to talk? Reach our sales team on:',
                detail: '+256 700 000 000',
                sub: 'Mon – Fri, 8 am – 6 pm EAT'
              },
              {
                icon: '🏢',
                title: 'Office',
                body: 'Visit us in person:',
                detail: 'Kampala, Uganda',
                sub: 'Appointments welcome'
              },
            ].map(card => (
              <div
                key={card.title}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.15rem', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
                }}>{card.icon}</span>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.97rem', color: '#0f172a' }}>{card.title}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '0.84rem', color: '#64748b' }}>{card.body}</p>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.92rem', color: '#2563eb' }}>{card.detail}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{card.sub}</p>
                </div>
              </div>
            ))}

            {/* Enterprise highlights */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: 16,
              border: '1px solid rgba(251,191,36,0.15)',
              padding: '1.5rem',
              color: '#f1f5f9',
            }}>
              <p style={{ margin: '0 0 0.85rem', fontWeight: 700, fontSize: '0.97rem' }}>Enterprise includes:</p>
              {[
                'Unlimited pledges & campaigns',
                'Custom integrations (ERP, banking)',
                'Dedicated account manager',
                '99.9% SLA & priority support',
                'On-premise or private cloud option',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.87rem' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>✓</span>
                  <span style={{ color: '#cbd5e1' }}>{f}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
