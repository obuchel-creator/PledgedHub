import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTwoFactorStatus, setupTwoFactor, enableTwoFactor, disableTwoFactor } from '../services/api';

const SecuritySettingsScreen = () => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pinSettings, setPinSettings] = useState({ pinRequiredThreshold: 10000, pinMaxAttempts: 3, pinLockoutDuration: 15 });
    const [ipWhitelist, setIpWhitelist] = useState('127.0.0.1');
    const [newIp, setNewIp] = useState('');
    const [activeTab, setActiveTab] = useState('pin');
    const [securityStatus, setSecurityStatus] = useState({ pinEnabled: true, ipWhitelistEnabled: true, sessionTimeout: 2 });
    const [twoFactor, setTwoFactor] = useState({ enabled: false, loading: false, qr: '', secret: '', error: '', success: '' });
    const { token } = useAuth();

    // Handler for updating PIN
    const handleUpdatePIN = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPin !== confirmPin) {
            setError('PINs do not match');
            return;
        }
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            setError('PIN must be 4 digits');
            return;
        }
        // ...rest of the logic for updating PIN (API call, etc.)
    };

    // Handler for updating threshold, adding/removing IP, 2FA, etc. (not shown for brevity)

    // Main render
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
                    <button className={`tab ${activeTab === 'pin' ? 'active' : ''}`} onClick={() => setActiveTab('pin')}>🔑 PIN Security</button>
                    <button className={`tab ${activeTab === 'whitelist' ? 'active' : ''}`} onClick={() => setActiveTab('whitelist')}>🌐 IP Whitelist</button>
                    <button className={`tab ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>✅ Status</button>
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
                                    <input type="password" inputMode="numeric" placeholder="0000" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength="4" disabled={loading} />
                                    <span className="char-count">{newPin.length}/4</span>
                                </div>
                                <div className="form-group">
                                    <label>Confirm PIN</label>
                                    <input type="password" inputMode="numeric" placeholder="0000" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength="4" disabled={loading} />
                                    <span className="char-count">{confirmPin.length}/4</span>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}>{loading ? 'Updating...' : 'Update PIN'}</button>
                            </form>
                        </div>
                        {/* PIN Threshold Section */}
                        <div className="settings-section">
                            <h3>PIN Required Threshold</h3>
                            <p className="section-help">Amount above which PIN verification is required</p>
                            <form onSubmit={handleUpdateThreshold}>
                                <div className="form-group">
                                    <label>Threshold Amount (UGX)</label>
                                    <input type="number" name="threshold" defaultValue={pinSettings.pinRequiredThreshold} min="10000" step="50000" disabled={loading} />
                                    <span className="hint">Current: UGX {pinSettings.pinRequiredThreshold?.toLocaleString()}</span>
                                </div>
                                <button type="submit" className="btn btn-secondary" disabled={loading}>{loading ? 'Updating...' : 'Update Threshold'}</button>
                            </form>
                        </div>
                        {/* PIN Attempts Section */}
                        <div className="settings-section">
                            <h3>PIN Security Limits</h3>
                            <div className="info-grid">
                                <div className="info-item"><span className="label">Max Attempts:</span><span className="value">{pinSettings.pinMaxAttempts}</span></div>
                                <div className="info-item"><span className="label">Lockout Duration:</span><span className="value">{pinSettings.pinLockoutDuration} minutes</span></div>
                            </div>
                            <p className="section-help">After {pinSettings.pinMaxAttempts} failed attempts, account is locked for {pinSettings.pinLockoutDuration} minutes</p>
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
                                    <input type="text" placeholder="192.168.1.100 or 127.0.0.1" value={newIp} onChange={(e) => setNewIp(e.target.value)} disabled={loading} />
                                    <span className="hint">IPv4 or IPv6 address</span>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading || !newIp}>{loading ? 'Adding...' : 'Add IP'}</button>
                            </form>
                        </div>
                        {/* Current Whitelist Section */}
                        <div className="settings-section">
                            <h3>Whitelisted IP Addresses</h3>
                            <div className="ip-list">
                                {ipWhitelist.split(',').map((ip) => (
                                    <div key={ip.trim()} className="ip-item">
                                        <span className="ip-address">{ip.trim()}</span>
                                        <button className="btn btn-remove" onClick={() => handleRemoveIP(ip.trim())} disabled={loading}>Remove</button>
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
                                <p className="status-badge">{securityStatus.pinEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                                <p className="description">PIN verification required for transactions over UGX {pinSettings.pinRequiredThreshold?.toLocaleString()}</p>
                            </div>
                            <div className={`status-card ${securityStatus.ipWhitelistEnabled ? 'enabled' : 'disabled'}`}>
                                <h3>🌐 IP Whitelist</h3>
                                <p className="status-badge">{securityStatus.ipWhitelistEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                                <p className="description">{ipWhitelist.split(',').length} IP addresses currently whitelisted</p>
                            </div>
                            <div className={`status-card ${twoFactor.enabled ? 'enabled' : 'disabled'}`}>
                                <h3>👥 Two-Factor Auth</h3>
                                <p className="status-badge">{twoFactor.enabled ? '✅ Enabled' : '❌ Disabled'}</p>
                                <p className="description">Additional authentication layer via email/SMS or authenticator app</p>
                                {/* 2FA Controls */}
                                {twoFactor.loading ? (
                                    <p style={{ color: '#2563eb' }}>Checking 2FA status...</p>
                                ) : twoFactor.enabled ? (
                                    <button className="btn btn-secondary" onClick={handleDisable2FA} disabled={twoFactor.loading}>Disable 2FA</button>
                                ) : (
                                    <>
                                        <button className="btn btn-primary" onClick={handleSetup2FA} disabled={twoFactor.loading}>Setup 2FA</button>
                                        {twoFactor.qr && (
                                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                                <p>Scan this QR code with your authenticator app:</p>
                                                <img src={twoFactor.qr} alt="2FA QR Code" style={{ width: 180, height: 180, margin: '0 auto' }} />
                                                <p style={{ fontSize: '0.95em', color: '#374151' }}>Secret: <span style={{ fontFamily: 'monospace' }}>{twoFactor.secret}</span></p>
                                                <button className="btn btn-success" onClick={handleEnable2FA} style={{ marginTop: '0.5rem' }} disabled={twoFactor.loading}>Enable 2FA</button>
                                            </div>
                                        )}
                                    </>
                                )}
                                {twoFactor.error && <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>{twoFactor.error}</div>}
                                {twoFactor.success && <div style={{ color: '#10b981', marginTop: '0.5rem' }}>{twoFactor.success}</div>}
                            </div>
                            <div className="status-card">
                                <h3>⏱️ Session Timeout</h3>
                                <p className="status-value">{securityStatus.sessionTimeout} hours</p>
                                <p className="description">Automatic logout after {securityStatus.sessionTimeout} hours of inactivity</p>
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
                                    <li>{twoFactor.enabled ? '✅ Two-factor authentication enabled' : '⭕ Enable two-factor authentication'}</li>
                                    <li>✅ Session timeout configured</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};

export default SecuritySettingsScreen;

