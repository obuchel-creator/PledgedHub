import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SecuritySettingsScreen.css';

export default function SecuritySettingsScreen() {
    const { token } = useAuth();

    const [activeTab, setActiveTab] = useState('pin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // PIN Settings
    const [pinSettings, setPinSettings] = useState({
        transactionPin: '****',
        pinRequiredThreshold: 500000,
        pinMaxAttempts: 3,
        pinLockoutDuration: 15
    });
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    // IP Whitelist Settings
    const [ipWhitelist, setIpWhitelist] = useState('127.0.0.1,::1,localhost');
    const [newIp, setNewIp] = useState('');

    // Security Status
    const [securityStatus, setSecurityStatus] = useState({
        pinEnabled: true,
        ipWhitelistEnabled: true,
        twoFactorEnabled: false,
        sessionTimeout: 24
    });

    useEffect(() => {
        fetchSecuritySettings();
    }, [token]);

    const fetchSecuritySettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/security/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setPinSettings(data.data.pinSettings || pinSettings);
                setIpWhitelist(data.data.ipWhitelist || ipWhitelist);
                setSecurityStatus(data.data.status || securityStatus);
            }
        } catch (err) {
            console.error('Failed to fetch security settings:', err);
        } finally {
            setLoading(false);
        }
    };

    // PIN Settings Handler
    const handleUpdatePIN = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newPin || !confirmPin) {
            setError('Please enter a new PIN');
            return;
        }

        if (newPin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            setError('PIN must be 4 digits');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/security/pin/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPin })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('PIN updated successfully');
                setNewPin('');
                setConfirmPin('');
            } else {
                setError(data.error || 'Failed to update PIN');
            }
        } catch (err) {
            setError('Error updating PIN');
        } finally {
            setLoading(false);
        }
    };

    // PIN Threshold Handler
    const handleUpdateThreshold = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const threshold = parseInt(e.target.threshold.value);
        if (threshold < 10000) {
            setError('Threshold must be at least 10,000 UGX');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/security/pin/threshold', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ threshold })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('PIN threshold updated successfully');
                setPinSettings(prev => ({ ...prev, pinRequiredThreshold: threshold }));
            } else {
                setError(data.error || 'Failed to update threshold');
            }
        } catch (err) {
            setError('Error updating threshold');
        } finally {
            setLoading(false);
        }
    };

    // IP Whitelist Handler
    const handleAddIP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newIp) {
            setError('Please enter an IP address');
            return;
        }

        const ips = ipWhitelist.split(',').map(ip => ip.trim());
        if (ips.includes(newIp)) {
            setError('IP already in whitelist');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/security/whitelist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip: newIp })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(`IP ${newIp} added to whitelist`);
                setIpWhitelist(prev => `${prev},${newIp}`);
                setNewIp('');
            } else {
                setError(data.error || 'Failed to add IP');
            }
        } catch (err) {
            setError('Error adding IP');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveIP = async (ip) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/security/whitelist/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip })
            });

            const data = await response.json();
            if (data.success) {
                const ips = ipWhitelist.split(',').map(i => i.trim()).filter(i => i !== ip);
                setIpWhitelist(ips.join(','));
                setSuccess(`IP ${ip} removed from whitelist`);
            } else {
                setError(data.error || 'Failed to remove IP');
            }
        } catch (err) {
            setError('Error removing IP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="security-settings-screen">
            {/* Header */}
            <div className="settings-header">
                <h1>🔐 Security Settings</h1>
                <p>Configure PIN, IP whitelist, and other security features</p>
            </div>

            {/* Tabs */}
            <div className="settings-container">
                <div className="settings-tabs">
                    <button
                        className={`tab ${activeTab === 'pin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pin')}
                    >
                        🔑 PIN Security
                    </button>
                    <button
                        className={`tab ${activeTab === 'whitelist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('whitelist')}
                    >
                        🌐 IP Whitelist
                    </button>
                    <button
                        className={`tab ${activeTab === 'status' ? 'active' : ''}`}
                        onClick={() => setActiveTab('status')}
                    >
                        ✅ Status
                    </button>
                </div>

                {/* Alerts */}
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* PIN Security Tab */}
                {activeTab === 'pin' && (
                    <div className="settings-panel">
                        <h2>PIN Security Configuration</h2>

                        {/* Update PIN Section */}
                        <div className="settings-section">
                            <h3>Change Transaction PIN</h3>
                            <p className="section-help">Set a 4-digit PIN for high-value transactions</p>

                            <form onSubmit={handleUpdatePIN}>
                                <div className="form-group">
                                    <label>New PIN</label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="0000"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        maxLength="4"
                                        disabled={loading}
                                    />
                                    <span className="char-count">{newPin.length}/4</span>
                                </div>

                                <div className="form-group">
                                    <label>Confirm PIN</label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="0000"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        maxLength="4"
                                        disabled={loading}
                                    />
                                    <span className="char-count">{confirmPin.length}/4</span>
                                </div>

                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                                >
                                    {loading ? 'Updating...' : 'Update PIN'}
                                </button>
                            </form>
                        </div>

                        {/* PIN Threshold Section */}
                        <div className="settings-section">
                            <h3>PIN Required Threshold</h3>
                            <p className="section-help">Amount above which PIN verification is required</p>

                            <form onSubmit={handleUpdateThreshold}>
                                <div className="form-group">
                                    <label>Threshold Amount (UGX)</label>
                                    <input
                                        type="number"
                                        name="threshold"
                                        defaultValue={pinSettings.pinRequiredThreshold}
                                        min="10000"
                                        step="50000"
                                        disabled={loading}
                                    />
                                    <span className="hint">
                                        Current: UGX {pinSettings.pinRequiredThreshold?.toLocaleString()}
                                    </span>
                                </div>

                                <button 
                                    type="submit"
                                    className="btn btn-secondary"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Threshold'}
                                </button>
                            </form>
                        </div>

                        {/* PIN Attempts Section */}
                        <div className="settings-section">
                            <h3>PIN Security Limits</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Max Attempts:</span>
                                    <span className="value">{pinSettings.pinMaxAttempts}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Lockout Duration:</span>
                                    <span className="value">{pinSettings.pinLockoutDuration} minutes</span>
                                </div>
                            </div>
                            <p className="section-help">
                                After {pinSettings.pinMaxAttempts} failed attempts, account is locked for {pinSettings.pinLockoutDuration} minutes
                            </p>
                        </div>
                    </div>
                )}

                {/* IP Whitelist Tab */}
                {activeTab === 'whitelist' && (
                    <div className="settings-panel">
                        <h2>IP Address Whitelist</h2>

                        {/* Add IP Section */}
                        <div className="settings-section">
                            <h3>Add IP Address</h3>
                            <p className="section-help">Only requests from whitelisted IPs can access the API</p>

                            <form onSubmit={handleAddIP}>
                                <div className="form-group">
                                    <label>IP Address</label>
                                    <input
                                        type="text"
                                        placeholder="192.168.1.100 or 127.0.0.1"
                                        value={newIp}
                                        onChange={(e) => setNewIp(e.target.value)}
                                        disabled={loading}
                                    />
                                    <span className="hint">IPv4 or IPv6 address</span>
                                </div>

                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading || !newIp}
                                >
                                    {loading ? 'Adding...' : 'Add IP'}
                                </button>
                            </form>
                        </div>

                        {/* Current Whitelist Section */}
                        <div className="settings-section">
                            <h3>Whitelisted IP Addresses</h3>
                            <div className="ip-list">
                                {ipWhitelist.split(',').map((ip) => (
                                    <div key={ip.trim()} className="ip-item">
                                        <span className="ip-address">{ip.trim()}</span>
                                        <button
                                            className="btn btn-remove"
                                            onClick={() => handleRemoveIP(ip.trim())}
                                            disabled={loading}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* IP Whitelist Info */}
                        <div className="info-box">
                            <h4>📝 IP Whitelist Guide</h4>
                            <ul>
                                <li><strong>Local Development:</strong> 127.0.0.1, ::1</li>
                                <li><strong>Ngrok Tunnel:</strong> Add ngrok IP for webhook testing</li>
                                <li><strong>Production Servers:</strong> Add all production server IPs</li>
                                <li><strong>External Services:</strong> Add IPs for MTN, Airtel, Twilio, etc.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Status Tab */}
                {activeTab === 'status' && (
                    <div className="settings-panel">
                        <h2>Security Status Overview</h2>

                        <div className="status-grid">
                            <div className={`status-card ${securityStatus.pinEnabled ? 'enabled' : 'disabled'}`}>
                                <h3>🔑 PIN Security</h3>
                                <p className="status-badge">
                                    {securityStatus.pinEnabled ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                                <p className="description">
                                    PIN verification required for transactions over UGX {pinSettings.pinRequiredThreshold?.toLocaleString()}
                                </p>
                            </div>

                            <div className={`status-card ${securityStatus.ipWhitelistEnabled ? 'enabled' : 'disabled'}`}>
                                <h3>🌐 IP Whitelist</h3>
                                <p className="status-badge">
                                    {securityStatus.ipWhitelistEnabled ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                                <p className="description">
                                    {ipWhitelist.split(',').length} IP addresses currently whitelisted
                                </p>
                            </div>

                            <div className={`status-card ${securityStatus.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                                <h3>👥 Two-Factor Auth</h3>
                                <p className="status-badge">
                                    {securityStatus.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}
                                </p>
                                <p className="description">
                                    Additional authentication layer via email/SMS
                                </p>
                            </div>

                            <div className="status-card">
                                <h3>⏱️ Session Timeout</h3>
                                <p className="status-value">{securityStatus.sessionTimeout} hours</p>
                                <p className="description">
                                    Automatic logout after {securityStatus.sessionTimeout} hours of inactivity
                                </p>
                            </div>
                        </div>

                        {/* Security Score */}
                        <div className="security-score-section">
                            <h3>Overall Security Score</h3>
                            <div className="security-score">
                                <div className="score-bar">
                                    <div className="score-fill" style={{ width: '85%' }}></div>
                                </div>
                                <p>85/100 - Strong</p>
                            </div>
                            <div className="recommendations">
                                <h4>✨ Recommendations</h4>
                                <ul>
                                    <li>✅ PIN security configured</li>
                                    <li>✅ IP whitelist active</li>
                                    <li>⭕ Enable two-factor authentication</li>
                                    <li>✅ Session timeout configured</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
