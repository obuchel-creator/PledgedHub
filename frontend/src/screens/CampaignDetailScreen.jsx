import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContributionForm from '../components/ContributionForm';
import ShareButton from '../components/ShareButton';

// Responsive styles for mobile
const responsiveStyle = `
@media (max-width: 900px) {
  .ph-campaign-container {
    padding: 0 0.5rem !important;
  }
  .ph-campaign-header {
    flex-direction: column !important;
    gap: 18px !important;
    padding: 1.2rem 0.7rem 1.2rem 0.7rem !important;
  }
  .ph-campaign-stats {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }
  .ph-campaign-hero {
    flex-direction: column !important;
    gap: 18px !important;
    padding: 1.2rem 0.7rem 1.2rem 0.7rem !important;
  }
}
`;

// Returns a color based on progress percentage
function getProgressColor(progress) {
  if (progress >= 100) return '#22c55e'; // green
  if (progress >= 75) return '#2563eb'; // blue
  if (progress >= 50) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

// Inline status badge for pledge status
function getStatusBadge(status) {
  const statusConfig = {
    paid: { color: '#10b981', label: 'Paid' },
    pending: { color: '#f59e0b', label: 'Pending' },
    overdue: { color: '#ef4444', label: 'Overdue' },
    confirmed: { color: '#2563eb', label: 'Confirmed' },
    default: { color: '#6b7280', label: status }
  };
  const config = statusConfig[status] || statusConfig.default;
  return (
    <span style={{
      background: config.color + '22',
      color: config.color,
      fontWeight: 700,
      borderRadius: 8,
      padding: '0.3em 0.9em',
      fontSize: 15,
      display: 'inline-block',
      minWidth: 70,
      textAlign: 'center',
    }}>{config.label}</span>
  );
}

export default function CampaignDetailScreen({ campaign: initialCampaign, loadCampaignDetails }) {
  const [campaign, setCampaign] = useState(initialCampaign || {});
  const navigate = useNavigate();

  // Progress calculation
  const totalPledged = campaign.stats?.totalPledged || 0;
  const goalAmount = campaign.goal_amount || 1;
  const progressPercentage = Math.min((totalPledged / goalAmount) * 100, 100);
  const progressColor = getProgressColor(progressPercentage);

  useEffect(() => {
    setCampaign(initialCampaign || {});
  }, [initialCampaign]);

  return (
    <>
      <style>{responsiveStyle}</style>
      <div className="ph-campaign-container" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', minHeight: '100vh', padding: '2.5rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Main Column (2/3 width) */}
          <div style={{ flex: '2 1 600px', minWidth: 340, maxWidth: 800 }}>
            {/* Hero Banner */}
            <div className="ph-campaign-hero" style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', margin: 0, marginBottom: 12, letterSpacing: 0.2 }}>{campaign.title}</h1>
              {campaign.description && <div style={{ color: '#374151', fontSize: 19, marginBottom: 16, lineHeight: 1.6 }}>{campaign.description}</div>}
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {/* ...Goal, Paid, Pledged, Backers Cards... */}
                <div style={{ background: '#fff', borderRadius: 14, padding: '0.8rem 1.3rem', fontWeight: 500, color: '#2563eb', fontSize: 18, minWidth: 120, textAlign: 'center', border: '1.5px solid #2563eb22', boxShadow: '0 6px 24px 0 rgba(37,99,235,0.13)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', transition: 'box-shadow 0.2s, transform 0.2s', transform: 'translateY(-8px)' }}>Goal<br /><span style={{ fontWeight: 400, fontSize: 20, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.goal_amount?.toLocaleString()}</span></div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '0.8rem 1.3rem', fontWeight: 500, color: '#10b981', fontSize: 18, minWidth: 120, textAlign: 'center', border: '1.5px solid #10b98122', boxShadow: '0 6px 24px 0 rgba(16,185,129,0.13)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', transition: 'box-shadow 0.2s, transform 0.2s', transform: 'translateY(-8px)' }}>Paid<br /><span style={{ fontWeight: 400, fontSize: 20, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalPaid?.toLocaleString() || 0}</span></div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '0.8rem 1.3rem', fontWeight: 500, color: '#2563eb', fontSize: 18, minWidth: 120, textAlign: 'center', border: '1.5px solid #2563eb22', boxShadow: '0 6px 24px 0 rgba(37,99,235,0.13)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', transition: 'box-shadow 0.2s, transform 0.2s', transform: 'translateY(-8px)' }}>Pledged<br /><span style={{ fontWeight: 400, fontSize: 20, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalPledged?.toLocaleString() || 0}</span></div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '0.8rem 1.3rem', fontWeight: 500, color: '#1e293b', fontSize: 18, minWidth: 120, textAlign: 'center', border: '1.5px solid #1e293b22', boxShadow: '0 6px 24px 0 rgba(31,41,55,0.13)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', transition: 'box-shadow 0.2s, transform 0.2s', transform: 'translateY(-8px)' }}>Backers<br /><span style={{ fontWeight: 400, fontSize: 20, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>{campaign.stats?.pledgeCount || 0}</span></div>
              </div>
            </div>
            {/* Stats Cards, Progress, and Table remain as in main column... */}
            {/* Stats Cards */}
            <div className="ph-campaign-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.2rem', marginBottom: '2.7rem' }}>
              {/* ...Goal, Pledged, Paid, Count cards... */}
              <div style={{ background: 'white', padding: '2.1rem', borderRadius: '18px', boxShadow: '0 8px 32px rgba(37,99,235,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#6b7280', fontSize: 16, letterSpacing: 0.01 }}>GOAL AMOUNT</div><div style={{ fontSize: '2.2rem', fontWeight: 400, color: '#1f2937', marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.goal_amount?.toLocaleString()}</div></div>
              <div style={{ background: 'white', padding: '2.1rem', borderRadius: '18px', boxShadow: '0 8px 32px rgba(37,99,235,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#6b7280', fontSize: 16, letterSpacing: 0.01 }}>TOTAL PLEDGED</div><div style={{ fontSize: '2.2rem', fontWeight: 400, color: '#2563eb', marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalPledged?.toLocaleString() || 0}</div></div>
              <div style={{ background: 'white', padding: '2.1rem', borderRadius: '18px', boxShadow: '0 8px 32px rgba(16,185,129,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#6b7280', fontSize: 16, letterSpacing: 0.01 }}>TOTAL PAID</div><div style={{ fontSize: '2.2rem', fontWeight: 400, color: '#10b981', marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalPaid?.toLocaleString() || 0}</div></div>
              <div style={{ background: 'white', padding: '2.1rem', borderRadius: '18px', boxShadow: '0 8px 32px rgba(31,41,55,0.08)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#6b7280', fontSize: 16, letterSpacing: 0.01 }}>PLEDGE COUNT</div><div style={{ fontSize: '2.2rem', fontWeight: 400, color: '#1e2937', marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>{campaign.stats?.pledgeCount || 0}</div></div>
            </div>
            {/* Progress Section */}
            <div className="ph-campaign-progress" style={{ background: 'white', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 8px 32px rgba(37,99,235,0.08)', marginBottom: '2.7rem', border: '1px solid #e5e7eb', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
              {/* ...existing code for progress bar... */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 600, color: '#1f2937', letterSpacing: 0.1 }}>Campaign Progress</h2>
                <span style={{ fontSize: '1.6rem', fontWeight: 600, color: progressColor, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="ph-campaign-progress-bar" style={{ background: '#e0e7ef', borderRadius: 12, height: 16, width: '100%', marginBottom: 18, overflow: 'hidden' }}>
                <div className="ph-campaign-progress-bar-inner" style={{ width: `${Math.min(progressPercentage, 100)}%`, background: progressColor, height: '100%', borderRadius: 12, transition: 'width 0.7s cubic-bezier(.4,2,.6,1)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', fontSize: '1.05rem', marginTop: 8 }}>
                <div><span style={{ color: '#6b7280', fontWeight: 400 }}>Pending: </span><span style={{ fontWeight: 500, color: '#f59e0b', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalPending?.toLocaleString() || 0}</span></div>
                <div><span style={{ color: '#6b7280', fontWeight: 400 }}>Overdue: </span><span style={{ fontWeight: 500, color: '#ef4444', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {campaign.stats?.totalOverdue?.toLocaleString() || 0}</span></div>
                {campaign.suggested_amount && (<div><span style={{ color: '#6b7280', fontWeight: 400 }}>Donors Needed: </span><span style={{ fontWeight: 500, color: '#2563eb', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>{campaign.stats?.donorsNeeded || 0}</span></div>)}
              </div>
            </div>
            {/* Pledges Table */}
            <div className="ph-campaign-pledges" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px 0 rgba(37,99,235,0.09)', padding: '2.7rem 2.2rem 2.2rem 2.2rem', border: '1px solid #e5e7eb', marginTop: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>Campaign Pledges</div>
                <button onClick={() => navigate('/create')} style={{ padding: '0.8rem 1.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }} onMouseOver={e => e.currentTarget.style.background='#1e40af'} onMouseOut={e => e.currentTarget.style.background='#2563eb'}>+ Add Pledge</button>
              </div>
              {campaign.pledges && campaign.pledges.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ph-campaign-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 16, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(37,99,235,0.04)' }} aria-label="Pledges table" role="table">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f1f5f9' }}>
                        <th scope="col" style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Donor</th>
                        <th scope="col" style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Email</th>
                        <th scope="col" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                        <th scope="col" style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>Status</th>
                        <th scope="col" style={{ padding: '1rem', textAlign: 'left', fontWeight: 700 }}>Collection Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.pledges.map((pledge, idx) => (
                        <tr key={pledge.id} tabIndex={0} aria-label={`Pledge by ${pledge.donor_name}, amount UGX ${parseFloat(pledge.amount).toLocaleString()}`} style={{ outline: 'none', background: idx % 2 === 0 ? '#f9fafb' : '#fff', transition: 'background 0.2s' }}>
                          <td style={{ padding: '1rem', fontWeight: 500, fontFamily: 'Inter, Segoe UI, Arial, sans-serif', color: '#1e293b', letterSpacing: 0.01 }}>{pledge.donor_name}</td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontWeight: 400 }}>{pledge.donor_email}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 400, color: '#1e293b', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.01 }}>UGX {parseFloat(pledge.amount).toLocaleString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{getStatusBadge(pledge.status)}</td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontWeight: 400 }}>{new Date(pledge.collection_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.7rem 0', color: '#374151', fontSize: 17 }}>
                  <div style={{ marginBottom: 12, fontSize: 19, fontWeight: 600, color: '#1e293b' }}>No pledges yet for this campaign</div>
                  <div style={{ marginBottom: 18, color: '#374151', fontSize: 16 }}>Be the first to support this cause and inspire others!</div>
                  <button className="ph-empty-pledges-cta" onClick={() => navigate('/create')} style={{ padding: '0.9rem 2.3rem', background: '#fff', color: '#1e293b', border: '2px solid #2563eb', borderRadius: 14, fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }} aria-label="Create first pledge for this campaign">Create First Pledge</button>
                </div>
              )}
            </div>
          </div>
          {/* Sidebar (1/3 width): Contribution Form, sticky on desktop */}
          <div style={{ flex: '1 1 340px', minWidth: 320, maxWidth: 420, position: 'sticky', top: 32, alignSelf: 'flex-start', zIndex: 2 }}>
            <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px 0 rgba(37,99,235,0.09)', padding: '2.7rem 2.2rem 2.2rem 2.2rem', border: '1px solid #e5e7eb' }}>
              <ContributionForm campaign={campaign} onSuccess={loadCampaignDetails} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


