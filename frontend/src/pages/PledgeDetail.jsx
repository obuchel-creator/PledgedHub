import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPledge } from '../services/api';

export default function PledgeDetail() {
  const { id } = useParams();
  const [pledge, setPledge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadPledge() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPledge(id);
        if (mounted) {
          setPledge(res.data || res.pledge || res);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Failed to load pledge');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    if (id) loadPledge();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <main
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 20,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <p>Loading pledge...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 20,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#dc2626',
          }}
        >
          Error: {error}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link to="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!pledge) {
    return (
      <main
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 20,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            padding: '16px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 6,
            color: '#92400e',
          }}
        >
          Pledge not found
        </div>
        <div style={{ marginTop: 16 }}>
          <Link to="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
      <div style={{ background: 'white', padding: '24px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>{pledge.title || pledge.name || 'Untitled Pledge'}</h1>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#374151' }}>Pledge Details</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div><strong>Donor Name:</strong> {pledge.donorName || pledge.donor_name || 'Anonymous'}</div>
              <div><strong>Date Pledged:</strong> {pledge.datePledged ? new Date(pledge.datePledged).toLocaleDateString() : pledge.date ? new Date(pledge.date).toLocaleDateString() : '-'}</div>
              <div><strong>Collection Date:</strong> {pledge.collectionDate ? new Date(pledge.collectionDate).toLocaleDateString() : pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : '-'}</div>
              <div><strong>Amount Pledged:</strong> UGX {pledge.amount?.toLocaleString() || '-'}</div>
              <div><strong>Status:</strong> {pledge.status || '-'}</div>
              {pledge.createdAt && (
                <div><strong>Created:</strong> {new Date(pledge.createdAt).toLocaleString()}</div>
              )}
            </div>
          </div>
          {pledge.message && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#374151' }}>Message</h3>
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb', fontStyle: 'italic', color: '#4b5563' }}>
                "{pledge.message}"
              </div>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Payment History</h3>
          {pledge.paymentHistory && pledge.paymentHistory.length > 0 ? (
            <ul>
              {pledge.paymentHistory.map(payment => (
                <li key={payment.id}>
                  {payment.date ? new Date(payment.date).toLocaleDateString() : ''}: UGX {payment.amount?.toLocaleString()} ({payment.method}, {payment.status})
                </li>
              ))}
            </ul>
          ) : (
            <div>No payments yet.</div>
          )}
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to={`/pledges/${pledge.id}/edit`} style={{ padding: '8px 16px', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: 6, fontSize: 14 }}>
              Edit Pledge
            </Link>
            <button style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this pledge?')) {
                  alert('Delete functionality not yet implemented');
                }
              }}
            >
              Delete Pledge
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


