/**
 * ReferralShare Component
 * Allow users to share referral links and track invitations
 */

import React, { useState, useEffect } from 'react';
import ShareButton from './ShareButton';
import { useAuth } from '../context/AuthContext';

const ReferralShare = ({ style = 'card' }) => {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState({
    invitesSent: 0,
    signups: 0,
    activePledgers: 0,
  });

  useEffect(() => {
    // Fetch referral stats from API
    const fetchReferralStats = async () => {
      try {
        const response = await fetch('/api/analytics/referrals/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('pledgedhub_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReferralStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to fetch referral stats:', err);
      }
    };

    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const referralCode = user?.id || 'user123';
  const referralUrl = `${window.location.origin}/register?ref=${referralCode}`;

  if (style === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          borderRadius: '12px',
          color: 'white',
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            💎 Invite friends to PledgedHub
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
            {referralStats.signups} signups • {referralStats.activePledgers} active
          </p>
        </div>
        <ShareButton
          contentType="referral"
          contentData={{}}
          shareUrl={referralUrl}
          style="button"
          size="small"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🎁 Invite Friends to PledgedHub
        </h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Share PledgedHub with your network and help more people organize their pledges and campaigns.
        </p>
      </div>

      {/* Referral Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #2563eb15, #1e40af15)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>
            {referralStats.invitesSent}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Invites Sent
          </div>
        </div>

        <div
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #10b98115, #34d39915)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {referralStats.signups}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Signups
          </div>
        </div>

        <div
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #f59e0b15, #f97316115)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {referralStats.activePledgers}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Active Users
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div
        style={{
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '0.5rem',
          }}
        >
          Your Referral Link
        </label>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={referralUrl}
            readOnly
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#374151',
              background: 'white',
            }}
          />
        </div>
      </div>

      {/* Share Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          Share via:
        </p>
        <ShareButton
          contentType="referral"
          contentData={{}}
          shareUrl={referralUrl}
          style="inline"
          size="medium"
        />
      </div>

      {/* Benefits */}
      <div
        style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, #2563eb10, #1e40af10)',
          borderRadius: '12px',
          border: '1px solid #2563eb30',
        }}
      >
        <p
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#2563eb',
          }}
        >
          ✨ Why share PledgedHub?
        </p>
        <ul
          style={{
            margin: 0,
            padding: '0 0 0 1.25rem',
            fontSize: '0.85rem',
            color: '#6b7280',
            lineHeight: '1.8',
          }}
        >
          <li>Help friends organize their fundraising campaigns</li>
          <li>Build a stronger community of supporters</li>
          <li>Track your impact as your network grows</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralShare;


