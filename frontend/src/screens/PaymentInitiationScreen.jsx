import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PINDialog from '../components/PINDialog';
import Toast from '../components/Toast';
import './PaymentInitiationScreen.css';

export default function PaymentInitiationScreen({ pledgeId, pledgeAmount, onSuccess, onCancel }) {
    const { token } = useAuth();
    
    // State management
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formattedPhone, setFormattedPhone] = useState('');
    const [provider, setProvider] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState('method'); // method, phone, confirm, pin
    
    // PIN dialog state
    const [showPINDialog, setShowPINDialog] = useState(false);
    const [pinError, setPinError] = useState('');
    const [attemptsRemaining, setAttemptsRemaining] = useState(3);
    const [pinLocked, setPinLocked] = useState(false);

    // Payment methods config
    const paymentMethods = [
        {
            id: 'mtn',
            name: 'MTN Mobile Money',
            icon: '📱',
            color: '#FFD700',
            description: 'Pay directly from your MTN wallet'
        },
        {
            id: 'airtel',
            name: 'Airtel Money',
            icon: '💳',
            color: '#FF0000',
            description: 'Pay with Airtel Money'
        },
        {
            id: 'paypal',
            name: 'PayPal',
            icon: '🅿️',
            color: '#003087',
            description: 'Secure payment with PayPal'
        }
    ];

    // Format phone number
    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 0) return '';
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
    };

    // Validate Uganda phone number
    const validatePhoneNumber = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const regex = /^256(77|78|70|75)\d{7}$/;
        return regex.test(cleaned);
    };

    // Detect provider from phone number
    const detectProvider = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('25677') || cleaned.startsWith('25678')) return 'mtn';
        if (cleaned.startsWith('25670') || cleaned.startsWith('25675')) return 'airtel';
        return '';
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length <= 12) {
            setPhoneNumber(cleaned);
            setFormattedPhone(formatPhoneNumber(cleaned));
            setError('');

            if (cleaned.length === 12) {
                const detectedProvider = detectProvider(cleaned);
                setProvider(detectedProvider);
            }
        }
    };

    // Step 1: Select payment method
    const handleSelectMethod = (methodId) => {
        setSelectedPaymentMethod(methodId);
        setError('');
        setPinError('');
        
        if (methodId === 'paypal') {
            // PayPal doesn't need phone number
            setStep('confirm');
        } else {
            setStep('phone');
        }
    };

    // Step 2: Validate phone and proceed
    const handlePhoneNext = () => {
        if (!validatePhoneNumber(phoneNumber)) {
            setError('Please enter a valid Uganda phone number (256 77/78/70/75 + 7 digits)');
            return;
        }

        if (selectedPaymentMethod !== 'mtn' && selectedPaymentMethod !== 'airtel') {
            setError('Please select MTN or Airtel for this phone number');
            return;
        }

        setError('');
        setStep('confirm');
    };

    // Step 3: Check if PIN is required and proceed
    const handleConfirm = async () => {
        setError('');
        setPinError('');

        // Check if PIN is required (amount > 500,000)
        if (pledgeAmount >= 500000) {
            setShowPINDialog(true);
            return;
        }

        // Amount doesn't require PIN - submit directly
        await submitPayment(null);
    };

    // Submit payment to API
    const submitPayment = async (pin) => {
        setLoading(true);
        setError('');
        setPinError('');

        try {
            let endpoint = '';
            let payload = {
                pledgeId,
                amount: pledgeAmount,
                reference: `PLEDGE-${pledgeId}-${Date.now()}`
            };

            if (selectedPaymentMethod === 'mtn') {
                endpoint = '/api/payments/mtn/initiate';
                payload.phoneNumber = phoneNumber;
                if (pin) payload.pin = pin;
            } else if (selectedPaymentMethod === 'airtel') {
                endpoint = '/api/payments/airtel/initiate';
                payload.phoneNumber = phoneNumber;
                if (pin) payload.pin = pin;
            } else if (selectedPaymentMethod === 'paypal') {
                endpoint = '/api/payments/paypal/order';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle PIN-related errors
                if (response.status === 400 && data.pinRequired) {
                    setShowPINDialog(true);
                    setError('PIN required for this amount');
                    setLoading(false);
                    return;
                } else if (response.status === 401) {
                    setAttemptsRemaining(data.attemptsRemaining || 3);
                    setPinError(data.error);
                    setLoading(false);
                    return;
                } else if (response.status === 423) {
                    setPinLocked(true);
                    setPinError(data.error);
                    setLoading(false);
                    return;
                }

                throw new Error(data.error || 'Payment initiation failed');
            }

            // Success
            setSuccess(`Payment initiated successfully! Check your ${selectedPaymentMethod.toUpperCase()} phone for confirmation.`);
            setShowPINDialog(false);
            
            setTimeout(() => {
                if (onSuccess) onSuccess(data.data);
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to initiate payment');
            console.error('Payment error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePINSubmit = async (pin) => {
        await submitPayment(pin);
    };

    const getMethodConfig = (id) => paymentMethods.find(m => m.id === id);

    return (
        <div className="payment-initiation-screen">
            <div className="payment-container">
                {/* Header */}
                <div className="payment-header">
                    <h1>💰 Complete Payment</h1>
                    <p>Amount: <span className="amount">UGX {pledgeAmount?.toLocaleString()}</span></p>
                    <button className="btn-close" onClick={onCancel}>✕</button>
                </div>

                {/* Messages */}
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Step 1: Select Payment Method */}
                {step === 'method' && (
                    <div className="payment-step">
                        <h2>Select Payment Method</h2>
                        <div className="payment-methods">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    className={`payment-method-card ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectMethod(method.id)}
                                    disabled={loading}
                                >
                                    <div className="method-icon">{method.icon}</div>
                                    <div className="method-info">
                                        <h3>{method.name}</h3>
                                        <p>{method.description}</p>
                                    </div>
                                    <div className="method-check">
                                        {selectedPaymentMethod === method.id && '✓'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Enter Phone Number */}
                {step === 'phone' && (
                    <div className="payment-step">
                        <h2>Enter Phone Number</h2>
                        <div className="phone-input-section">
                            <div className="input-group">
                                <label>Phone Number</label>
                                <div className="phone-input-wrapper">
                                    <span className="country-code">+256</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="77 234 5678"
                                        value={formattedPhone}
                                        onChange={handlePhoneChange}
                                        disabled={loading}
                                        maxLength="12"
                                    />
                                </div>
                                {provider && (
                                    <p className="provider-hint">
                                        ✓ Detected: {provider.toUpperCase()}
                                    </p>
                                )}
                            </div>

                            <div className="input-hint">
                                <p>💡 Enter your phone number to receive payment prompt</p>
                            </div>

                            <div className="step-actions">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => {
                                        setStep('method');
                                        setPhoneNumber('');
                                    }}
                                    disabled={loading}
                                >
                                    Back
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handlePhoneNext}
                                    disabled={!validatePhoneNumber(phoneNumber) || loading}
                                >
                                    {loading ? 'Processing...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 'confirm' && (
                    <div className="payment-step">
                        <h2>Confirm Payment</h2>
                        <div className="confirmation-summary">
                            <div className="summary-item">
                                <span className="label">Payment Method</span>
                                <span className="value">
                                    {getMethodConfig(selectedPaymentMethod)?.name}
                                </span>
                            </div>
                            {phoneNumber && (
                                <div className="summary-item">
                                    <span className="label">Phone Number</span>
                                    <span className="value">+256 {formattedPhone.slice(3)}</span>
                                </div>
                            )}
                            <div className="summary-item amount">
                                <span className="label">Total Amount</span>
                                <span className="value">UGX {pledgeAmount?.toLocaleString()}</span>
                            </div>
                            {pledgeAmount >= 500000 && (
                                <div className="security-note">
                                    🔐 This amount requires PIN verification
                                </div>
                            )}
                        </div>

                        <div className="step-actions">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setStep('phone')}
                                disabled={loading}
                            >
                                Back
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Complete Payment'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* PIN Dialog */}
            <PINDialog
                isOpen={showPINDialog}
                amount={pledgeAmount}
                error={pinError}
                attemptsRemaining={attemptsRemaining}
                locked={pinLocked}
                loading={loading}
                onSubmit={handlePINSubmit}
                onCancel={() => {
                    setShowPINDialog(false);
                    setPinError('');
                }}
            />

            {/* Toast notifications */}
            {success && (
                <Toast message={success} type="success" duration={3000} />
            )}
        </div>
    );
}
