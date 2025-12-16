import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import PINDialog from '../components/PINDialog';
import './CommissionDashboardScreen.css';

export default function CommissionDashboardScreen() {
    const { token } = useAuth();
    
    // State
    const [summary, setSummary] = useState({
        accrued: { amount: 0, count: 0 },
        pending: { amount: 0, count: 0 },
        paidOut: { total: 0, days: 0 }
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('mtn');
    const [payoutTiming, setPayoutTiming] = useState('immediate');
    
    // PIN Dialog
    const [showPINDialog, setShowPINDialog] = useState(false);
    const [pinError, setPinError] = useState('');
    const [pinAttempts, setPinAttempts] = useState(3);
    const [pinLocked, setPinLocked] = useState(false);
    const [pendingPayout, setPendingPayout] = useState(null);

    // Load commission summary and history
    useEffect(() => {
        fetchCommissionData();
    }, [token]);

    const fetchCommissionData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/commissions/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setSummary(data.data);
            } else {
                setError(data.error || 'Failed to load commission data');
            }

            // Fetch history
            const historyResponse = await fetch('/api/commissions/history?limit=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const historyData = historyResponse.json();
            if (historyData.success) {
                setHistory(historyData.data || []);
            }
        } catch (err) {
            setError('Failed to fetch commission data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = (method, timing) => {
        setSelectedMethod(method);
        setPayoutTiming(timing);
        setPendingPayout({ method, timing, amount: summary.accrued.amount });
        setShowPINDialog(true);
        setPinError('');
    };

    const handlePINSubmit = async (pin) => {
        if (!pendingPayout) return;

        setPayoutLoading(true);
        try {
            const response = await fetch('/api/commissions/payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    method: pendingPayout.method,
                    timing: pendingPayout.timing,
                    pin
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setPinAttempts(data.attemptsRemaining || 3);
                    setPinError(data.error || 'Invalid PIN');
                    setPayoutLoading(false);
                    return;
                } else if (response.status === 423) {
                    setPinLocked(true);
                    setPinError(data.error || 'Account locked');
                    setPayoutLoading(false);
                    return;
                }
                throw new Error(data.error || 'Payout request failed');
            }

            setSuccess(`Payout request submitted! Batch ID: ${data.data.batchId}`);
            setShowPINDialog(false);
            setPendingPayout(null);
            
            // Refresh data
            setTimeout(() => fetchCommissionData(), 2000);
        } catch (err) {
            setPinError(err.message || 'Failed to process payout');
        } finally {
            setPayoutLoading(false);
        }
    };

    const paymentMethods = [
        { id: 'mtn', name: 'MTN Mobile Money', icon: '📱' },
        { id: 'airtel', name: 'Airtel Money', icon: '💳' }
    ];

    if (loading) {
        return (
            <div className="commission-dashboard">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading commission data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="commission-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>💰 Commission Dashboard</h1>
                <p>Track and manage your commissions</p>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Summary Cards */}
            <div className="commission-summary">
                <div className="summary-card accrued">
                    <div className="card-header">
                        <span className="icon">💵</span>
                        <h3>Accrued</h3>
                    </div>
                    <div className="amount">UGX {summary.accrued?.amount?.toLocaleString() || '0'}</div>
                    <div className="subtext">{summary.accrued?.count || 0} commissions</div>
                    <button 
                        className="btn btn-action"
                        onClick={() => handleRequestPayout('mtn', 'immediate')}
                        disabled={!summary.accrued?.amount || payoutLoading}
                    >
                        Request Payout
                    </button>
                </div>

                <div className="summary-card pending">
                    <div className="card-header">
                        <span className="icon">⏳</span>
                        <h3>Pending</h3>
                    </div>
                    <div className="amount">UGX {summary.pending?.amount?.toLocaleString() || '0'}</div>
                    <div className="subtext">{summary.pending?.count || 0} in progress</div>
                </div>

                <div className="summary-card paidout">
                    <div className="card-header">
                        <span className="icon">✅</span>
                        <h3>Paid Out</h3>
                    </div>
                    <div className="amount">UGX {summary.paidOut?.total?.toLocaleString() || '0'}</div>
                    <div className="subtext">Last {summary.paidOut?.days || 0} days</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Payout</h2>
                <div className="action-grid">
                    {paymentMethods.map(method => (
                        <div key={method.id} className="action-card">
                            <span className="method-icon">{method.icon}</span>
                            <h4>{method.name}</h4>
                            <p>UGX {summary.accrued?.amount?.toLocaleString() || '0'}</p>
                            <div className="timing-buttons">
                                <button
                                    className="btn btn-sm btn-immediate"
                                    onClick={() => handleRequestPayout(method.id, 'immediate')}
                                    disabled={!summary.accrued?.amount || payoutLoading}
                                >
                                    Now
                                </button>
                                <button
                                    className="btn btn-sm btn-batch"
                                    onClick={() => handleRequestPayout(method.id, 'batch')}
                                    disabled={!summary.accrued?.amount || payoutLoading}
                                >
                                    Batch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* History */}
            <div className="commission-history">
                <h2>Recent Payouts</h2>
                {history.length > 0 ? (
                    <div className="history-list">
                        {history.map((payout, idx) => (
                            <div key={idx} className="history-item">
                                <div className="item-icon">
                                    {payout.method === 'mtn' ? '📱' : '💳'}
                                </div>
                                <div className="item-info">
                                    <h4>{payout.method?.toUpperCase()} Payout</h4>
                                    <p className="timestamp">
                                        {new Date(payout.created_at).toLocaleDateString()} 
                                        {' - '}
                                        {new Date(payout.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="item-amount">
                                    <span className="amount">UGX {payout.amount?.toLocaleString()}</span>
                                    <span className={`status status-${payout.status?.toLowerCase()}`}>
                                        {payout.status === 'successful' && '✅ Completed'}
                                        {payout.status === 'pending' && '⏳ Pending'}
                                        {payout.status === 'failed' && '❌ Failed'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No payout history yet</p>
                    </div>
                )}
            </div>

            {/* PIN Dialog */}
            <PINDialog
                isOpen={showPINDialog}
                amount={pendingPayout?.amount}
                error={pinError}
                attemptsRemaining={pinAttempts}
                locked={pinLocked}
                loading={payoutLoading}
                onSubmit={handlePINSubmit}
                onCancel={() => {
                    setShowPINDialog(false);
                    setPendingPayout(null);
                    setPinError('');
                }}
            />
        </div>
    );
}
