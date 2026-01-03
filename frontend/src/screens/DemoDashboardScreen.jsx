import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './DemoDashboardScreen.css';

const samplePledges = [
  {
    id: 101,
    donor: 'Amina Nakato',
    amount: 500000,
    status: 'pending',
    collectionDate: '2026-02-10',
  },
  {
    id: 102,
    donor: 'Daniel K.',
    amount: 350000,
    status: 'paid',
    collectionDate: '2025-12-18',
  },
  {
    id: 103,
    donor: 'Grace Lumu',
    amount: 220000,
    status: 'partial',
    collectionDate: '2026-01-25',
  },
];

const sampleActivity = [
  { label: 'Reminders sent', value: 42 },
  { label: 'AI messages', value: 18 },
  { label: 'Payments logged', value: 29 },
];

export default function DemoDashboardScreen() {
  const totals = useMemo(() => {
    const pledged = samplePledges.reduce((sum, p) => sum + p.amount, 0);
    const collected = samplePledges
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    return { pledged, collected, balance: pledged - collected };
  }, []);

  return (
    <div className="demo-dash">
      <header className="demo-dash__hero">
        <div>
          <p className="eyebrow">Explore first</p>
          <h1>See what's possible</h1>
          <p className="lede">
            Tour a live dashboard with sample pledges and real features. Sign up to manage your own pledges,
            send reminders, and collect via mobile money—all automated.
          </p>
          <div className="demo-dash__cta-row">
            <Link className="btn-primary" to="/register">Start for free</Link>
            <Link className="btn-secondary" to="/login">Sign in</Link>
          </div>
          <p className="hint">Includes mobile money + AI messaging previews.</p>
        </div>
        <div className="demo-dash__badge">No signup required · Explore for free</div>
      </header>

      <section className="demo-dash__grid">
        <article className="card highlight">
          <p className="card__eyebrow">Pledged</p>
          <h2 className="card__value">UGX {totals.pledged.toLocaleString('en-UG')}</h2>
          <p className="card__sub">Across {samplePledges.length} pledges</p>
        </article>
        <article className="card">
          <p className="card__eyebrow">Collected</p>
          <h2 className="card__value">UGX {totals.collected.toLocaleString('en-UG')}</h2>
          <p className="card__sub">Via cash & mobile money</p>
        </article>
        <article className="card">
          <p className="card__eyebrow">Outstanding</p>
          <h2 className="card__value">UGX {totals.balance.toLocaleString('en-UG')}</h2>
          <p className="card__sub">Auto-reminders queued</p>
        </article>
      </section>

      <section className="demo-dash__panel">
        <div className="panel__header">
          <h3>Upcoming collections</h3>
          <span className="pill">Preview</span>
        </div>
        <div className="table">
          <div className="table__head">
            <span>Pledge</span>
            <span>Donor</span>
            <span>Amount</span>
            <span>Collection date</span>
            <span>Status</span>
          </div>
          {samplePledges.map((p) => (
            <div key={p.id} className="table__row">
              <span>#{p.id}</span>
              <span>{p.donor}</span>
              <span>UGX {p.amount.toLocaleString('en-UG')}</span>
              <span>{new Date(p.collectionDate).toLocaleDateString('en-UG')}</span>
              <span className={`status status--${p.status}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="demo-dash__panel dual">
        <div className="panel__half">
          <div className="panel__header">
            <h3>Engagement</h3>
            <span className="pill">AI + reminders</span>
          </div>
          <ul className="metrics">
            {sampleActivity.map((a) => (
              <li key={a.label}>
                <span className="metric__value">{a.value}</span>
                <span className="metric__label">{a.label}</span>
              </li>
            ))}
          </ul>
          <p className="small">
            Upgrade to trigger automated reminders at 9 AM/5 PM EAT and generate personalized AI follow-ups.
          </p>
        </div>
        <div className="panel__half">
          <div className="panel__header">
            <h3>Why upgrade?</h3>
            <span className="pill">Monetization</span>
          </div>
          <ul className="bullets">
            <li>Collect real payments (MTN/Airtel mobile money + cash).</li>
            <li>Send branded SMS/email reminders without leaving the app.</li>
            <li>Unlock full analytics, exports, and accounting links.</li>
          </ul>
          <div className="demo-dash__cta-row">
            <Link className="btn-primary" to="/register">Activate my workspace</Link>
            <Link className="btn-text" to="/pricing">View pricing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
