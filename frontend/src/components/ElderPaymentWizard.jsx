/**
 * Elder-Friendly Payment Wizard
 * 
 * Simple 3-step payment process with voice guidance
 * Step 1: Enter phone number
 * Step 2: Confirm amount
 * Step 3: Follow USSD instructions
 */

import React, { useState } from 'react';
import ElderButton from '../components/ElderButton';
import './ElderPaymentWizard.css';

const ElderPaymentWizard = ({ pledgeId, amount, onComplete }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);
  const [ussdInstructions, setUssdInstructions] = useState([]);
  const [error, setError] = useState(null);

  // Voice synthesis
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower for clarity
      utterance.lang = 'en-UG';
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as 256 77 234 5678
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleStep1Next = () => {
    const digits = phoneNumber.replace(/\s/g, '');
    
    // Validate phone number
    if (!digits.match(/^256(77|78|70|75)\d{7}$/)) {
      setError('Please enter a valid phone number starting with 256');
      speak('Invalid phone number. Please enter a valid number starting with 256.');
      return;
    }

    setError(null);
    setStep(2);
    speak(`Confirm payment of ${amount} Uganda shillings.`);
  };

  const handleStep2Confirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simple-payment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledgeId,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentReference(data.reference);
        setUssdInstructions(data.nextSteps || []);
        setStep(3);
        
        const provider = data.provider || 'your mobile money provider';
        speak(`Payment request sent. Please follow these steps on your phone.`);
      } else {
        setError(data.error || 'Payment failed');
        speak('Payment failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      speak('Network error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/simple-payment/status/${paymentReference}`);
      const data = await response.json();

      if (data.status === 'SUCCESS') {
        speak('Payment successful! Thank you.');
        if (onComplete) onComplete();
      } else if (data.status === 'FAILED') {
        setError('Payment failed. Please try again or call helpline.');
        speak('Payment failed. Please call helpline for help.');
      } else {
        speak('Payment is still pending. Please complete the steps on your phone.');
      }
    } catch (error) {
      setError('Could not check status');
    } finally {
      setLoading(false);
    }
  };

  const handleCallHelp = () => {
    speak('Calling helpline. Zero eight zero zero, seven five three three four three.');
    window.location.href = 'tel:0800753343';
  };

  return (
    <div className="payment-wizard">
      {/* Progress Indicator */}
      <div className="payment-wizard-progress">
        <div className={`elder-wizard-step ${step >= 1 ? 'active' : ''}`}>
          <span className="elder-wizard-step-number">1</span>
          <span className="elder-wizard-step-label">Phone</span>
        </div>
        <div className="elder-wizard-progress-line"></div>
        <div className={`elder-wizard-step ${step >= 2 ? 'active' : ''}`}>
          <span className="elder-wizard-step-number">2</span>
          <span className="elder-wizard-step-label">Confirm</span>
        </div>
        <div className="elder-wizard-progress-line"></div>
        <div className={`elder-wizard-step ${step >= 3 ? 'active' : ''}`}>
          <span className="elder-wizard-step-number">3</span>
          <span className="elder-wizard-step-label">Pay</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="elder-wizard-content">
        {/* Step 1: Enter Phone Number */}
        {step === 1 && (
          <div className="elder-wizard-step-content">
            <h2 className="elder-wizard-title">
              📱 Step 1: Enter Your Phone Number
            </h2>
            <p className="elder-wizard-description">
              Type your mobile money phone number
            </p>
            
            <div className="elder-wizard-input-group">
              <label className="elder-wizard-label">Phone Number</label>
              <input
                type="tel"
                className="elder-wizard-input"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="256 77 234 5678"
                autoFocus
                maxLength={16}
              />
              <p className="elder-wizard-hint">
                Example: 256 77 234 5678 (MTN) or 256 70 234 5678 (Airtel)
              </p>
            </div>

            {error && (
              <div className="elder-wizard-error">
                ⚠️ {error}
              </div>
            )}

            <div className="elder-wizard-actions">
              <ElderButton
                variant="primary"
                size="xlarge"
                icon="➡️"
                onClick={handleStep1Next}
                fullWidth
              >
                Next
              </ElderButton>
              
              <ElderButton
                variant="help"
                icon="🔊"
                onClick={() => speak('Step 1. Enter your phone number. Type your mobile money phone number, then click Next.')}
              >
                Read Instructions
              </ElderButton>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Amount */}
        {step === 2 && (
          <div className="elder-wizard-step-content">
            <h2 className="elder-wizard-title">
              ✅ Step 2: Confirm Payment
            </h2>
            
            <div className="elder-wizard-confirm-box">
              <div className="elder-wizard-confirm-row">
                <span className="elder-wizard-confirm-label">Phone:</span>
                <span className="elder-wizard-confirm-value">{phoneNumber}</span>
              </div>
              <div className="elder-wizard-confirm-row">
                <span className="elder-wizard-confirm-label">Amount:</span>
                <span className="elder-wizard-confirm-value elder-wizard-amount">
                  UGX {amount.toLocaleString()}
                </span>
              </div>
              <div className="elder-wizard-confirm-row">
                <span className="elder-wizard-confirm-label">Pledge:</span>
                <span className="elder-wizard-confirm-value">#{pledgeId}</span>
              </div>
            </div>

            <p className="elder-wizard-description">
              Is this information correct?
            </p>

            {error && (
              <div className="elder-wizard-error">
                ⚠️ {error}
              </div>
            )}

            <div className="elder-wizard-actions">
              <ElderButton
                variant="primary"
                size="xlarge"
                icon="💰"
                onClick={handleStep2Confirm}
                loading={loading}
                fullWidth
              >
                Confirm & Pay
              </ElderButton>
              
              <ElderButton
                variant="light"
                icon="⬅️"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Go Back
              </ElderButton>
            </div>
          </div>
        )}

        {/* Step 3: USSD Instructions */}
        {step === 3 && (
          <div className="elder-wizard-step-content">
            <h2 className="elder-wizard-title">
              📲 Step 3: Complete Payment on Your Phone
            </h2>
            
            <div className="elder-wizard-instructions">
              <p className="elder-wizard-description">
                Follow these simple steps on your phone:
              </p>
              
              <ol className="elder-wizard-steps-list">
                {ussdInstructions.map((instruction, index) => (
                  <li key={index} className="elder-wizard-step-item">
                    <span className="elder-wizard-step-bullet">{index + 1}</span>
                    <span className="elder-wizard-step-text">{instruction}</span>
                  </li>
                ))}
              </ol>

              <div className="elder-wizard-reference">
                <strong>Payment Code:</strong> {paymentReference}
              </div>
            </div>

            {error && (
              <div className="elder-wizard-error">
                ⚠️ {error}
              </div>
            )}

            <div className="elder-wizard-actions">
              <ElderButton
                variant="secondary"
                size="large"
                icon="🔄"
                onClick={handleCheckStatus}
                loading={loading}
                fullWidth
              >
                Check Payment Status
              </ElderButton>
              
              <ElderButton
                variant="help"
                icon="📞"
                onClick={handleCallHelp}
              >
                Call Helpline: 0800-753343
              </ElderButton>
              
              <ElderButton
                variant="light"
                icon="🏠"
                onClick={() => setStep(1)}
              >
                Start Over
              </ElderButton>
            </div>
          </div>
        )}
      </div>

      {/* Help Always Visible */}
      <div className="elder-wizard-footer">
        <p className="elder-wizard-helpline">
          📞 Need help? Call <strong>0800-753343</strong> (FREE)
        </p>
      </div>
    </div>
  );
};

export default PaymentWizard;
