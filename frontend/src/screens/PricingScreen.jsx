import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PricingScreen() {
  const [plans, setPlans] = useState([]);
  const [monetizationStatus, setMonetizationStatus] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      // Fetch pricing plans
      const pricingRes = await fetch('/api/monetization/pricing');
      const pricingData = await pricingRes.json();
      if (pricingData.success) {
        setPlans(pricingData.data.plans);
      }

      // Fetch monetization status
      const statusRes = await fetch('/api/monetization/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setMonetizationStatus(statusData.data);
      }

      // Fetch current subscription
      const token = localStorage.getItem('pledgehub_token');
      if (token) {
        const subRes = await fetch('/api/monetization/subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        if (subData.success) {
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
    const token = localStorage.getItem('pledgehub_token');
    if (!token) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (tier === 'FREE') {
      alert('You are already on the Free plan');
      return;
    }

    // TODO: Integrate with payment processor
    const confirmed = window.confirm(`Subscribe to ${tier} plan?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/monetization/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          tier, 
          paymentMethod: 'stripe',
          durationMonths: 1 
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully subscribed to ${tier} plan!`);
        fetchPricingData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
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
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>
          Select the perfect plan for your organization
        </p>
        
        {monetizationStatus && !monetizationStatus.isActive && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#dbeafe',
            borderRadius: '8px',
            border: '1px solid #3b82f6'
          }}>
            <p style={{ color: '#1e40af', fontWeight: '500' }}>
              🎉 Free Access! Monetization starts in {monetizationStatus.daysUntilActivation} days
            </p>
            <p style={{ color: '#1e40af', fontSize: '14px', marginTop: '8px' }}>
              Enjoy unlimited access to all features until {new Date(monetizationStatus.activationDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {currentSubscription && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #22c55e'
          }}>
            <p style={{ color: '#166534', fontWeight: '500' }}>
              Current Plan: {currentSubscription.tier}
            </p>
            <p style={{ color: '#166534', fontSize: '14px', marginTop: '4px' }}>
              {currentSubscription.statusMessage}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.tier === plan.tier;
          const isRecommended = plan.tier === 'PRO';
          
          return (
            <div
              key={plan.tier}
              style={{
                border: isRecommended ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '32px',
                background: 'white',
                position: 'relative',
                boxShadow: isRecommended ? '0 10px 25px rgba(59, 130, 246, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              {isRecommended && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  RECOMMENDED
                </div>
              )}

              {isCurrentPlan && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  background: '#22c55e',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  CURRENT
                </div>
              )}

              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                {plan.name || plan.tier}
              </h3>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '40px', fontWeight: 'bold' }}>
                  ${plan.price}
                </span>
                <span style={{ color: '#6b7280', fontSize: '16px' }}>/month</span>
              </div>

              <p style={{ color: '#6b7280', marginBottom: '24px', minHeight: '48px' }}>
                {plan.description}
              </p>

              <button
                onClick={() => handleSubscribe(plan.tier)}
                disabled={isCurrentPlan}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: isCurrentPlan ? '#e5e7eb' : (isRecommended ? '#3b82f6' : '#1f2937'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isCurrentPlan ? 'not-allowed' : 'pointer',
                  marginBottom: '24px',
                  opacity: isCurrentPlan ? 0.6 : 1
                }}
              >
                {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
              </button>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <p style={{ fontWeight: '600', marginBottom: '16px', fontSize: '14px' }}>
                  Features:
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(plan.features || []).map((feature, idx) => (
                    <li key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>
                      <span style={{ color: '#22c55e', marginRight: '8px', fontSize: '18px' }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div style={{ marginTop: '64px', maxWidth: '800px', margin: '64px auto 0' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        
        <div style={{ space: '24px' }}>
          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              When does monetization start?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              Monetization begins 6 months after our launch date. Until then, all features are completely free for all users.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              Can I cancel anytime?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </details>

          <details style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
              What happens if I exceed my plan limits?
            </summary>
            <p style={{ marginTop: '12px', color: '#6b7280', lineHeight: '1.6' }}>
              You'll receive a notification suggesting an upgrade. Some features may be temporarily restricted until you upgrade or your usage resets next month.
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


