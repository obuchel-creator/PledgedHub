import React, { useState } from 'react';
import './PINDialog.css';

export default function PINDialog({ 
    isOpen, 
    amount, 
    onSubmit, 
    onCancel, 
    error, 
    attemptsRemaining, 
    locked,
    loading 
}) {
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pin.length === 4 && !isSubmitting && !locked) {
            setIsSubmitting(true);
            await onSubmit(pin);
            setIsSubmitting(false);
            setPin('');
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(value);
    };

    if (!isOpen) return null;

    return (
        <div className="pin-dialog-overlay" onClick={onCancel}>
            <div className="pin-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="pin-dialog-header">
                    <h2>🔐 Verify with PIN</h2>
                    <p>For security, enter your transaction PIN</p>
                </div>

                <div className="pin-info">
                    {amount && (
                        <div className="amount-display">
                            <span className="label">Transaction Amount</span>
                            <span className="amount">UGX {amount.toLocaleString()}</span>
                        </div>
                    )}
                    <p className="pin-notice">
                        ℹ️ This amount exceeds the security threshold. Please verify with your PIN.
                    </p>
                </div>

                {locked && (
                    <div className="pin-error locked">
                        <span className="icon">🔒</span>
                        <span>
                            Account locked due to too many failed attempts.
                            <br />
                            Please try again in 15 minutes.
                        </span>
                    </div>
                )}

                {error && !locked && (
                    <div className="pin-error">
                        <span className="icon">❌</span>
                        <div>
                            <p>{error}</p>
                            {attemptsRemaining && (
                                <p className="attempts-remaining">
                                    {attemptsRemaining === 1
                                        ? `⚠️ Last attempt remaining!`
                                        : `Attempts remaining: ${attemptsRemaining}`
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} disabled={locked || loading}>
                    <div className="pin-input-wrapper">
                        <input
                            type="password"
                            inputMode="numeric"
                            placeholder="••••"
                            value={pin}
                            onChange={handleInputChange}
                            maxLength="4"
                            disabled={isSubmitting || locked || loading}
                            autoFocus
                            className="pin-input"
                        />
                        <span className="pin-length">{pin.length}/4</span>
                    </div>

                    <div className="pin-dialog-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting || locked || loading}
                            className="btn btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pin.length !== 4 || isSubmitting || locked || loading}
                            className="btn btn-submit"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Verifying...
                                </>
                            ) : (
                                'Verify PIN'
                            )}
                        </button>
                    </div>
                </form>

                <div className="pin-info-footer">
                    <span className="lock-icon">🔒</span>
                    <span>Your PIN is never shared or stored</span>
                </div>
            </div>
        </div>
    );
}


