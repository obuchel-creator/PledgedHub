import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const LAUNCH_KEY = 'pricing_launch_date';
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

export default function PricingScreen() {
  const [plans, setPlans] = useState([]);
  const [monetizationStatus, setMonetizationStatus] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyState, setNotifyState] = useState({ status: 'idle', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPricingData();
  }, []);

  // Determine launch date (first time page seen) and free-until date (+6 months)
  const { launchDate, activationDate, daysUntilActivation } = useMemo(() => {
    const stored = localStorage.getItem(LAUNCH_KEY);
    const now = new Date();
    const launch = stored ? new Date(stored) : now;
    if (!stored) {
      localStorage.setItem(LAUNCH_KEY, launch.toISOString());
    }
    const activation = new Date(launch.getTime() + SIX_MONTHS_MS);
    const daysLeft = Math.max(0, Math.ceil((activation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return { launchDate: launch, activationDate: activation, daysUntilActivation: daysLeft };
  }, []);

  const fetchPricingData = async () => {
    try {
      const pricingRes = await fetch('/api/monetization/pricing');
      const pricingData = await pricingRes.json().catch(() => ({}));
      if (pricingData && pricingData.success && pricingData.data?.plans) {
        setPlans(pricingData.data.plans);
      }

      const statusRes = await fetch('/api/monetization/status');
      const statusData = await statusRes.json().catch(() => ({}));
      if (statusData && statusData.success) {
        setMonetizationStatus(statusData.data);
      }

      const token = localStorage.getItem('pledgedhub_token');
      if (token) {
        const subRes = await fetch('/api/monetization/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subData = await subRes.json().catch(() => ({}));
        if (subData && subData.success) {
          setCurrentSubscription(subData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    // During free period, we only collect interest.
    alert('All plans are free during the launch period. We will notify you before billing starts.');
    return;
  };

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) {
      setNotifyState({ status: 'error', message: 'Please enter an email.' });
      return;
    }
    setNotifyState({ status: 'loading', message: '' });
    try {
      const res = await fetch('/api/monetization/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail.trim(), activationDate: activationDate.toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        setNotifyState({ status: 'success', message: 'We will notify you before billing starts.' });
        setNotifyEmail('');
      } else {
        setNotifyState({ status: 'error', message: data?.error || 'Could not save your request. Please try again.' });
      }
    } catch (err) {
      console.error('Notify error', err);
      setNotifyState({ status: 'error', message: 'Could not save your request. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading pricing information...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
          All Features Free Until {activationDate.toLocaleDateString('en-UG', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '24px' }}>
          Explore everything Affirm has to offer at no cost. Paid tiers activate in {daysUntilActivation} days.
        </p>

        {/* Free Period Banner */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #d4fc79 0%, #96f2d7 100%)',
          borderRadius: '12px',
          border: '2px solid #22c55e',
          marginBottom: '32px',
        }}>
          <p style={{ color: '#166534', fontWeight: '700', fontSize: '18px', margin: '0 0 8px' }}>
            🎉 Launch Promo: Everything Free
          </p>
          <p style={{ color: '#15803d', fontSize: '16px', margin: '0' }}>
            No card required. No hidden charges. Full access until {activationDate.toLocaleDateString('en-UG')}.
          </p>
        </div>

        {currentSubscription && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #22c55e'
          }}>
            <p style={{ color: '#166534', fontWeight: '500', margin: 0 }}>
              ✓ You have full access during the free period
            </p>
          </div>
        )}
      </div>

      {/* Tier Preview (no prices) */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
          What's Coming: Flexible Plans for Every Scale
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {[
            { name: 'Free', desc: 'Perfect for testing', features: ['Up to 50 pledges', 'Basic reminders', 'Limited AI features'] },
            { name: 'Basic', desc: 'For active users', features: ['Up to 500 pledges', 'SMS reminders', 'Mobile money integration'] },
            { name: 'Pro', desc: 'For organizations', features: ['Unlimited pledges', 'Advanced analytics', 'AI-powered messages', 'Accounting export'] },
            { name: 'Enterprise', desc: 'Custom solutions', features: ['Everything in Pro', 'Custom integrations', 'Priority support', 'SLA guarantee'] },
          ].map((tier) => (
            <div
              key={tier.name}
              style={{
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>{tier.name}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>{tier.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px', fontSize: '14px' }}>
          Pricing details coming soon. Detailed pricing will be announced before billing begins.
        </p>
      </div>

      {/* Notify Capture */}
      <div style={{
        padding: '40px',
        background: 'linear-gradient(135deg, #2563eb 0%, #0f172a 70%)',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '48px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 16px' }}>
          Be the First to Know
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: '0 0 24px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          We'll notify you one month before billing starts so you can decide on your plan.
        </p>
        <form onSubmit={handleNotify} style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
              }}
              disabled={notifyState.status === 'loading'}
            />
            <button
              type="submit"
              disabled={notifyState.status === 'loading'}
              style={{
                padding: '12px 24px',
                background: '#22c55e',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: notifyState.status === 'loading' ? 'wait' : 'pointer',
                opacity: notifyState.status === 'loading' ? 0.7 : 1,
              }}
            >
              {notifyState.status === 'loading' ? 'Saving...' : 'Notify Me'}
            </button>
          </div>
          {notifyState.message && (
            <p style={{
              fontSize: '14px',
              color: notifyState.status === 'success' ? '#86efac' : '#ff7875',
              margin: '0',
            }}>
              {notifyState.message}
            </p>
          )}
        </form>
      </div>

      {/* FAQ Section */}
      <div style={{ marginTop: '64px', maxWidth: '800px', margin: '64px auto 0' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        
        <div style={{ space: '24px' }}>
          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              When do I have to pay?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              All features are completely free until {activationDate.toLocaleDateString('en-UG')}. One month before, we'll send you an email with final pricing and allow you to choose your plan. You will never be charged without prior notification.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              What payment methods do you accept?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              We accept mobile money (MTN, Airtel), bank transfers, and card payments. Mobile money is our primary method for the Ugandan market.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              Can I cancel anytime?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              Yes, you can cancel your subscription at any time with no penalties. You'll continue to have access until the end of your billing period.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              Do you offer annual plans?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              Yes! Contact us for annual pricing with up to 20% discount.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              Will my data be secure?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              Absolutely. All pledge and donor data is encrypted and stored securely. We comply with international data protection standards and your data will remain in Uganda.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Section */}
      <div style={{
        marginTop: '64px',
        padding: '32px',
        background: '#f9fafb',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Need a custom plan?
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Contact us for Enterprise pricing and custom solutions
        </p>
        <button
          onClick={() => navigate('/contact')}
          style={{
            padding: '12px 32px',
            background: '#1f2937',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Contact Sales
        </button>
      </div>
    </div>
  );
}


