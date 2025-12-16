import React, { useState, useEffect } from 'react';
import './PaymentWizard.css';

const PaymentWizard = ({ pledgeId, pledgeAmount, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [provider, setProvider] = useState('');

  // Format phone number as user types: 256 77 234 5678
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  };

  // Validate Uganda phone number: 256(77|78|70|75)XXXXXXX
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const regex = /^256(77|78|70|75)\d{7}$/;
    return regex.test(cleaned);
  };

  // Detect mobile money provider from phone number
  const detectProvider = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('25677') || cleaned.startsWith('25678')) return 'MTN';
    if (cleaned.startsWith('25670') || cleaned.startsWith('25675')) return 'Airtel';
    return 'Unknown';
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 12) {
      setPhoneNumber(cleaned);
      setFormattedPhone(formatPhoneNumber(cleaned));
      setError('');
      
      if (cleaned.length === 12) {
        setProvider(detectProvider(cleaned));
      }
    }
  };

  const handleStep1Next = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Uganda phone number (e.g., 256 77 234 5678)');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  const handleStep2Confirm = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/simple-payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledgeId,
          phoneNumber,
          amount: pledgeAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentReference(data.reference);
        setPaymentStatus('initiated');
        setCurrentStep(3);
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simple-payment/status/${paymentReference}`);
      const data = await response.json();

      if (data.success) {
        setPaymentStatus(data.status);
        if (data.status === 'completed') {
          setTimeout(() => {
            if (onComplete) onComplete(data);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const getUSSDInstructions = () => {
    if (provider === 'MTN') {
      return {
        code: '*165#',
        steps: [
          'Dial *165# on your MTN phone',
          'Select option 4: "My Wallet"',
          'Select option 3: "My Approvals"',
          `Find payment request for UGX ${pledgeAmount.toLocaleString()}`,
          'Enter your PIN to approve the payment'
        ]
      };
    } else if (provider === 'Airtel') {
      return {
        code: '*185#',
        steps: [
          'Dial *185# on your Airtel phone',
          'Select option 5: "Payments"',
          'Select option 2: "Pending Approvals"',
          `Find payment request for UGX ${pledgeAmount.toLocaleString()}`,
          'Enter your PIN to approve the payment'
        ]
      };
    }
    return null;
  };

  const renderProgressBar = () => (
    <div className="wizard-progress">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`wizard-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
        >
          <div className="wizard-step-circle">
            {currentStep > step ? '✓' : step}
          </div>
          <div className="wizard-step-label">
            {step === 1 && 'Phone Number'}
            {step === 2 && 'Confirm'}
            {step === 3 && 'Complete'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="wizard-content">
      <h2 className="wizard-title">Enter Your Phone Number</h2>
      <p className="wizard-subtitle">We'll send a payment request to your mobile money account</p>

      <div className="wizard-form-group">
        <label className="wizard-label">Mobile Number</label>
        <input
          type="tel"
          className={`wizard-input ${error ? 'error' : ''}`}
          value={formattedPhone}
          onChange={handlePhoneChange}
          placeholder="256 77 234 5678"
          maxLength={16}
          autoFocus
        />
        {error && (
          <div className="wizard-error">
            <span className="wizard-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {!error && formattedPhone && (
          <div className="wizard-helper">
            {provider && provider !== 'Unknown' && (
              <span>✓ {provider} Mobile Money detected</span>
            )}
          </div>
        )}
      </div>

      <div className="wizard-buttons">
        {onCancel && (
          <button className="wizard-btn wizard-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={handleStep1Next}
          disabled={!phoneNumber || phoneNumber.length !== 12}
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-content">
      <h2 className="wizard-title">Confirm Payment Details</h2>
      <p className="wizard-subtitle">Please verify the information below</p>

      <div className="wizard-confirm-box">
        <div className="wizard-confirm-row">
          <span className="wizard-confirm-label">Phone Number</span>
          <span className="wizard-confirm-value">{formattedPhone}</span>
        </div>
        <div className="wizard-confirm-row">
          <span className="wizard-confirm-label">Provider</span>
          <span className="wizard-confirm-value">{provider}</span>
        </div>
        <div className="wizard-confirm-row">
          <span className="wizard-confirm-label">Amount</span>
          <span className="wizard-confirm-value">UGX {pledgeAmount.toLocaleString()}</span>
        </div>
        <div className="wizard-confirm-row">
          <span className="wizard-confirm-label">Pledge ID</span>
          <span className="wizard-confirm-value">#{pledgeId}</span>
        </div>
      </div>

      {error && (
        <div className="wizard-error">
          <span className="wizard-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="wizard-buttons">
        <button className="wizard-btn wizard-btn-secondary" onClick={handleBack} disabled={loading}>
          ← Back
        </button>
        <button
          className="wizard-btn wizard-btn-primary"
          onClick={handleStep2Confirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const instructions = getUSSDInstructions();

    return (
      <div className="wizard-content">
        <div className="wizard-success-header">
          <div className="wizard-success-icon">✓</div>
          <h2 className="wizard-title">Payment Request Sent!</h2>
        </div>

        <div className="wizard-reference">
          <div className="wizard-reference-label">Payment Reference</div>
          <div className="wizard-reference-value">{paymentReference}</div>
        </div>

        {instructions && (
          <div className="wizard-instructions">
            <h3 className="wizard-instructions-title">
              📱 Complete Payment on Your Phone
            </h3>
            <ol className="wizard-steps-list">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="wizard-status-box">
          <div className="wizard-status-label">Payment Status:</div>
          <div className={`wizard-status-badge wizard-status-${paymentStatus}`}>
            {paymentStatus === 'pending' && '⏳ Waiting for approval'}
            {paymentStatus === 'initiated' && '📤 Sent to your phone'}
            {paymentStatus === 'processing' && '⚙️ Processing'}
            {paymentStatus === 'completed' && '✅ Completed'}
            {paymentStatus === 'failed' && '❌ Failed'}
          </div>
        </div>

        <div className="wizard-buttons single-button">
          <button
            className="wizard-btn wizard-btn-primary"
            onClick={handleCheckStatus}
            disabled={loading || paymentStatus === 'completed'}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        <div className="wizard-help">
          <h4 className="wizard-help-title">Need Help?</h4>
          <p className="wizard-help-text">
            Contact our helpline for assistance
          </p>
          <a href="tel:0800753343" className="wizard-help-phone">
            0800-753-343
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="payment-wizard">
      {renderProgressBar()}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
};

export default PaymentWizard;
