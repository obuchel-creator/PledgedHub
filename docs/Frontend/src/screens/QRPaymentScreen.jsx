import React, { useState, useEffect } from 'react';
import '../styles/QRPaymentScreen.css';

/**
 * QR Code Payment Screen
 * Donors can scan the QR code to initiate MTN or Airtel mobile money payments
 */
export default function QRPaymentScreen({ pledgeId, pledgeAmount, donorName, onSuccess, onCancel }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('mtn');
  const [ussdCode, setUSSDCode] = useState(null);
  const [showUSSD, setShowUSSD] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  /**
   * Generate QR code for selected provider
   */
  const generateQRCode = async () => {
    if (!pledgeId || !pledgeAmount) {
      setError('Missing pledge information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = provider === 'airtel' 
        ? '/api/qr/airtel'
        : '/api/qr/mtn';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pledgeId,
          amount: pledgeAmount,
          donorName,
          donorPhone: phoneNumber
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to generate QR code');
        return;
      }

      // Convert base64 to image
      const imageData = `data:${result.data.mimeType};base64,${result.data.qrCode}`;
      setQrCode(imageData);
      
      // Get USSD code for manual payment
      fetchUSSDCode();
    } catch (err) {
      setError('Server error: ' + (err.message || 'Unknown error'));
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch USSD code for manual payment (no QR scanning)
   */
  const fetchUSSDCode = async () => {
    try {
      const response = await fetch(
        `/api/qr/ussd?provider=${provider}&pledgeId=${pledgeId}&amount=${pledgeAmount}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setUSSDCode(result.data);
      }
    } catch (err) {
      console.error('USSD fetch error:', err);
    }
  };

  /**
   * Initiate payment manually (no QR scanning)
   */
  const handleManualPayment = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Determine endpoint based on provider
      const endpoint = provider === 'mtn'
        ? '/api/payments/mtn/initiate'
        : '/api/payments/airtel/initiate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          pledgeId,
          phoneNumber,
          amount: pledgeAmount
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to initiate payment');
        return;
      }

      setPaymentInitiated(true);
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err) {
      setError('Server error: ' + (err.message || 'Unknown error'));
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize on mount
   */
  useEffect(() => {
    generateQRCode();
  }, [provider, pledgeId, pledgeAmount]);

  /**
   * Handle provider change
   */
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setQrCode(null);
    setUSSDCode(null);
    setError('');
    setPhoneNumber('');
  };

  if (paymentInitiated) {
    return (
      <div className="qr-payment-container">
        <div className="qr-success-message">
          <h2>✅ Payment Initiated!</h2>
          <p>Check your phone for the payment prompt from {provider.toUpperCase()}</p>
          <p className="amount-text">Amount: UGX {pledgeAmount.toLocaleString()}</p>
          <p className="instructions">
            {provider === 'airtel' 
              ? 'Dial *185# or wait for the payment prompt on your phone'
              : 'Dial *165# or wait for the payment prompt on your phone'}
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-payment-container">
      <div className="qr-payment-card">
        <h2>💳 Mobile Money Payment</h2>
        <p className="subtitle">Choose your payment provider</p>

        {/* Provider Selection */}
        <div className="provider-selector">
          <button
            className={`provider-btn ${provider === 'mtn' ? 'active' : ''}`}
            onClick={() => handleProviderChange('mtn')}
            style={{ backgroundColor: provider === 'mtn' ? '#FFD700' : '#f0f0f0' }}
          >
            <span className="provider-icon">📱</span>
            <span className="provider-name">MTN Money</span>
          </button>
          <button
            className={`provider-btn ${provider === 'airtel' ? 'active' : ''}`}
            onClick={() => handleProviderChange('airtel')}
            style={{ backgroundColor: provider === 'airtel' ? '#FF0000' : '#f0f0f0' }}
          >
            <span className="provider-icon">💳</span>
            <span className="provider-name">Airtel Money</span>
          </button>
        </div>

        {/* QR Code Display */}
        {qrCode && (
          <div className="qr-code-section">
            <h3>Scan to Pay</h3>
            <img src={qrCode} alt="Payment QR Code" className="qr-code-image" />
            <p className="qr-instruction">
              📸 Scan this code with your phone camera to initiate payment
            </p>
            <div className="payment-details">
              <p><strong>Provider:</strong> {provider.toUpperCase()}</p>
              <p><strong>Amount:</strong> UGX {pledgeAmount.toLocaleString()}</p>
              <p><strong>Donor:</strong> {donorName || 'Anonymous'}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        )}

        {/* Manual Payment Section */}
        <div className="manual-payment-section">
          <h3>💬 Or Pay Manually</h3>
          <p>Enter your phone number to receive a payment prompt</p>

          <div className="phone-input-group">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2567XXXXXXXX"
              className="phone-input"
              disabled={loading}
            />
            <button
              className="btn-primary"
              onClick={handleManualPayment}
              disabled={loading || !phoneNumber}
            >
              {loading ? 'Processing...' : 'Send Payment Prompt'}
            </button>
          </div>
        </div>

        {/* USSD Instructions */}
        {ussdCode && (
          <div className="ussd-section">
            <h3>⌨️ USSD Alternative</h3>
            <p>If QR code doesn't work, dial this code:</p>
            <div className="ussd-code-box">
              <code>{ussdCode.code}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(ussdCode.code);
                  alert('Code copied to clipboard!');
                }}
              >
                📋 Copy
              </button>
            </div>
            <details>
              <summary>📍 Show detailed steps</summary>
              <ol className="ussd-steps">
                {ussdCode.manualSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            ← Back
          </button>
          <button
            className="btn-primary"
            onClick={generateQRCode}
            disabled={loading || !qrCode}
          >
            🔄 Refresh QR Code
          </button>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <h4>❓ Need Help?</h4>
          <ul>
            <li>Make sure your phone has enough balance</li>
            <li>Use a camera app or QR scanner to scan</li>
            <li>Follow the payment prompt on your phone</li>
            <li>You'll get a confirmation SMS after payment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
