import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPledge } from '../services/api';
import './VerifyPledgeScreen.css';

export default function VerifyPledgeScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [pledge, setPledge] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPledgeToken = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setError('No verification token provided');
          return;
        }

        // Call API to verify
        const response = await fetch(`/api/pledges/verify/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
          setPledge(result.pledge);
          setStatus('success');
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setError(result.error || 'Failed to verify pledge');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'An error occurred during verification');
      }
    };

    verifyPledgeToken();
  }, [searchParams, navigate]);

  return (
    <div className="verify-pledge-container">
      <div className="verify-pledge-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h2>Verifying your pledge...</h2>
            <p>Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Pledge Verified!</h2>
            <p>Thank you for your pledge!</p>
            {pledge && (
              <div className="pledge-summary">
                <p><strong>Name:</strong> {pledge.donor_name}</p>
                <p><strong>Amount:</strong> UGX {pledge.amount?.toLocaleString() || 'N/A'}</p>
                <p><strong>Email:</strong> {pledge.donor_email}</p>
              </div>
            )}
            <p className="redirect-message">Redirecting to dashboard in 3 seconds...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✕</div>
            <h2>Verification Failed</h2>
            <p className="error-message">{error}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}


