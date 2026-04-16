import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPledge } from '../services/api';
import './SharePledgeScreen.css';

export default function SharePledgeScreen() {
  const { id } = useParams();
  const [pledge, setPledge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPledge() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPledge(id);
        // getPledge now returns the pledge object directly or throws on failure
        setPledge(result);
      } catch (err) {
        setError(err?.message || 'Pledge not found');
      } finally {
        setLoading(false);
      }
    }
    fetchPledge();
  }, [id]);

  if (loading) return <div className="share-pledge-loading">Loading pledge...</div>;
  if (error) return <div className="share-pledge-error">{error}</div>;
  if (!pledge) return null;

  return (
    <div className="share-pledge-container">
      <h2>🎉 Support This Pledge</h2>
      <div className="share-pledge-details">
        <div><strong>Donor Name:</strong> {pledge.donor_name}</div>
        <div><strong>Email:</strong> {pledge.donor_email}</div>
        <div><strong>Amount:</strong> UGX {Number(pledge.amount).toLocaleString('en-UG')}</div>
        <div><strong>Purpose:</strong> {pledge.purpose || 'General Pledge'}</div>
        <div><strong>Collection Date:</strong> {new Date(pledge.collection_date).toLocaleDateString('en-UG')}</div>
        <div><strong>Status:</strong> {pledge.status}</div>
      </div>
      <div className="share-pledge-actions">
        <h3 className="actions-title">What would you like to do?</h3>
        
        <button 
          className="action-card primary"
          onClick={() => window.location.href = `${import.meta.env.BASE_URL}donate`}
        >
          <span className="action-icon">💝</span>
          <span className="action-label">Donate / Support</span>
          <span className="action-desc">Help fulfill this pledge</span>
        </button>

        <button 
          className="action-card secondary"
          onClick={() => window.location.href = `${import.meta.env.BASE_URL}explore`}
        >
          <span className="action-icon">🔍</span>
          <span className="action-label">Explore Platform</span>
          <span className="action-desc">Discover more campaigns</span>
        </button>

        <button 
          className="action-card secondary"
          onClick={() => window.location.href = `${import.meta.env.BASE_URL}register`}
        >
          <span className="action-icon">✨</span>
          <span className="action-label">Create Account</span>
          <span className="action-desc">Start your own pledge</span>
        </button>
      </div>
    </div>
  );
}
