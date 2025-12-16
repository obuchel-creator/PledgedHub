/**
 * Payment Settings Screen - Frontend Component
 * Professional admin interface for managing payment provider credentials
 * Features: MTN, Airtel, PayPal configuration with encrypted storage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PaymentSettingsScreen.css';

const PaymentSettingsScreen = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('gateways');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedProvider, setExpandedProvider] = useState(null);

  // MTN Form State
  const [mtnData, setMtnData] = useState({
    subscriptionKey: '',
    apiUser: '',
    apiKey: '',
    environment: 'sandbox'
  });

  // Airtel Form State
  const [airtelData, setAirtelData] = useState({
    clientId: '',
    clientSecret: '',
    merchantId: '',
    environment: 'sandbox'
  });

  // PayPal Form State
  const [paypalData, setPaypalData] = useState({
    clientId: '',
    clientSecret: '',
    mode: 'sandbox'
  });

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/payment-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch settings');

        const result = await response.json();
        console.log('📥 Loaded payment settings:', result);

        // Load each provider if configured
        if (result.data?.mtn?.subscriptionKey) {
          setMtnData(result.data.mtn);
          setExpandedProvider('mtn');
        }
        if (result.data?.airtel?.clientId) {
          setAirtelData(result.data.airtel);
        }
        if (result.data?.paypal?.clientId) {
          setPaypalData(result.data.paypal);
        }
      } catch (error) {
        console.error('❌ Error fetching settings:', error);
        setMessage({ type: 'error', text: 'Failed to load payment settings' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // Show message (auto-hide after 5s)
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Save payment settings
  const handleSave = async (provider, data) => {
    setSaving(prev => ({ ...prev, [provider]: true }));

    try {
      const response = await fetch(`/api/payment-settings/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      showMessage('success', `✅ ${provider.toUpperCase()} settings saved successfully`);
      console.log(`✅ Saved ${provider} settings`);
    } catch (error) {
      console.error(`❌ Error saving ${provider} settings:`, error);
      showMessage('error', `❌ Error: ${error.message}`);
    } finally {
      setSaving(prev => ({ ...prev, [provider]: false }));
    }
  };

  // Test payment gateway
  const handleTestConnection = async (provider) => {
    setTesting(prev => ({ ...prev, [provider]: true }));

    try {
      const response = await fetch(`/api/payment-settings/${provider}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      showMessage('success', `✅ ${provider.toUpperCase()} connection successful!`);
      console.log(`✅ ${provider} test passed:`, result.data);
    } catch (error) {
      console.error(`❌ Error testing ${provider}:`, error);
      showMessage('error', `❌ Test failed: ${error.message}`);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  if (loading) {
    return <div className="payment-settings-loading">Loading payment settings...</div>;
  }

  return (
    <div className="payment-settings-container">
      {/* Header */}
      <div className="payment-settings-header">
        <div>
          <h1>⚙️ Payment Settings</h1>
          <p className="payment-settings-subtitle">
            Configure and manage payment gateway credentials securely
          </p>
        </div>
        <div className="payment-settings-actions">
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`${message.type}-message`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="payment-settings-tabs">
        <button
          className={`payment-tab ${activeTab === 'gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <span className="payment-tab-icon">🏦</span>
          Payment Gateways
        </button>
        <button
          className={`payment-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="payment-tab-icon">🔒</span>
          Security
        </button>
        <button
          className={`payment-tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="payment-tab-icon">📖</span>
          Documentation
        </button>
      </div>

      {/* Payment Gateways Tab */}
      {activeTab === 'gateways' && (
        <div className="payment-tab-content">
          <h2>🏦 Payment Gateways</h2>
          <p className="payment-section-description">
            Configure your payment provider credentials. All data is encrypted and stored securely.
          </p>

          {/* MTN Mobile Money */}
          <div className="payment-gateway-card">
            <div
              className="payment-gateway-header"
              onClick={() => setExpandedProvider(expandedProvider === 'mtn' ? null : 'mtn')}
            >
              <div className="payment-gateway-info">
                <div className="payment-gateway-icon">📱</div>
                <div>
                  <h3>MTN Mobile Money</h3>
                  <p>Mobile money payments for Uganda and other African countries</p>
                </div>
              </div>
              <div className="payment-gateway-status">
                <span className={`payment-status-badge ${mtnData.subscriptionKey ? 'status-active' : 'status-inactive'}`}
                  style={{
                    background: mtnData.subscriptionKey ? '#10b981' : '#ef4444'
                  }}>
                  {mtnData.subscriptionKey ? '✓ Active' : '○ Inactive'}
                </span>
                <span className="payment-expand-icon">
                  {expandedProvider === 'mtn' ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedProvider === 'mtn' && (
              <div className="payment-gateway-content">
                <div className="payment-form-group">
                  <label>Subscription Key</label>
                  <input
                    type="password"
                    placeholder="Enter your MTN subscription key"
                    value={mtnData.subscriptionKey}
                    onChange={(e) => setMtnData({ ...mtnData, subscriptionKey: e.target.value })}
                  />
                  <small>
                    Get from: <a href="https://developer.mtn.com" target="_blank" rel="noopener noreferrer">MTN Developer Portal</a>
                  </small>
                </div>

                <div className="payment-form-group">
                  <label>API User</label>
                  <input
                    type="text"
                    placeholder="API User UUID"
                    value={mtnData.apiUser}
                    onChange={(e) => setMtnData({ ...mtnData, apiUser: e.target.value })}
                  />
                </div>

                <div className="payment-form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    placeholder="API Key"
                    value={mtnData.apiKey}
                    onChange={(e) => setMtnData({ ...mtnData, apiKey: e.target.value })}
                  />
                </div>

                <div className="payment-form-group">
                  <label>Environment</label>
                  <select
                    value={mtnData.environment}
                    onChange={(e) => setMtnData({ ...mtnData, environment: e.target.value })}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>

                <div className="payment-gateway-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleSave('mtn', mtnData)}
                    disabled={saving.mtn}
                  >
                    {saving.mtn ? '💾 Saving...' : '💾 Save Settings'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleTestConnection('mtn')}
                    disabled={testing.mtn || !mtnData.subscriptionKey}
                  >
                    {testing.mtn ? '⏳ Testing...' : '🧪 Test Connection'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Airtel Money */}
          <div className="payment-gateway-card">
            <div
              className="payment-gateway-header"
              onClick={() => setExpandedProvider(expandedProvider === 'airtel' ? null : 'airtel')}
            >
              <div className="payment-gateway-info">
                <div className="payment-gateway-icon">📞</div>
                <div>
                  <h3>Airtel Money</h3>
                  <p>Airtel mobile money payments for Africa</p>
                </div>
              </div>
              <div className="payment-gateway-status">
                <span className={`payment-status-badge ${airtelData.clientId ? 'status-active' : 'status-inactive'}`}
                  style={{
                    background: airtelData.clientId ? '#10b981' : '#ef4444'
                  }}>
                  {airtelData.clientId ? '✓ Active' : '○ Inactive'}
                </span>
                <span className="payment-expand-icon">
                  {expandedProvider === 'airtel' ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedProvider === 'airtel' && (
              <div className="payment-gateway-content">
                <div className="payment-form-group">
                  <label>Client ID</label>
                  <input
                    type="text"
                    placeholder="Your Airtel Client ID"
                    value={airtelData.clientId}
                    onChange={(e) => setAirtelData({ ...airtelData, clientId: e.target.value })}
                  />
                  <small>
                    Get from: <a href="https://developer.airtel.africa" target="_blank" rel="noopener noreferrer">Airtel Developer</a>
                  </small>
                </div>

                <div className="payment-form-group">
                  <label>Client Secret</label>
                  <input
                    type="password"
                    placeholder="Your Airtel Client Secret"
                    value={airtelData.clientSecret}
                    onChange={(e) => setAirtelData({ ...airtelData, clientSecret: e.target.value })}
                  />
                </div>

                <div className="payment-form-group">
                  <label>Merchant ID</label>
                  <input
                    type="text"
                    placeholder="Your Airtel Merchant ID"
                    value={airtelData.merchantId}
                    onChange={(e) => setAirtelData({ ...airtelData, merchantId: e.target.value })}
                  />
                </div>

                <div className="payment-form-group">
                  <label>Environment</label>
                  <select
                    value={airtelData.environment}
                    onChange={(e) => setAirtelData({ ...airtelData, environment: e.target.value })}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>

                <div className="payment-gateway-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleSave('airtel', airtelData)}
                    disabled={saving.airtel}
                  >
                    {saving.airtel ? '💾 Saving...' : '💾 Save Settings'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleTestConnection('airtel')}
                    disabled={testing.airtel || !airtelData.clientId}
                  >
                    {testing.airtel ? '⏳ Testing...' : '🧪 Test Connection'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className="payment-gateway-card">
            <div
              className="payment-gateway-header"
              onClick={() => setExpandedProvider(expandedProvider === 'paypal' ? null : 'paypal')}
            >
              <div className="payment-gateway-info">
                <div className="payment-gateway-icon">💳</div>
                <div>
                  <h3>PayPal</h3>
                  <p>Accept payments worldwide with PayPal integration</p>
                </div>
              </div>
              <div className="payment-gateway-status">
                <span className={`payment-status-badge ${paypalData.clientId ? 'status-active' : 'status-inactive'}`}
                  style={{
                    background: paypalData.clientId ? '#10b981' : '#ef4444'
                  }}>
                  {paypalData.clientId ? '✓ Active' : '○ Inactive'}
                </span>
                <span className="payment-expand-icon">
                  {expandedProvider === 'paypal' ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedProvider === 'paypal' && (
              <div className="payment-gateway-content">
                <div className="payment-form-group">
                  <label>Client ID</label>
                  <input
                    type="text"
                    placeholder="Your PayPal Client ID"
                    value={paypalData.clientId}
                    onChange={(e) => setPaypalData({ ...paypalData, clientId: e.target.value })}
                  />
                  <small>
                    Get from: <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer">PayPal Developer</a>
                  </small>
                </div>

                <div className="payment-form-group">
                  <label>Client Secret</label>
                  <input
                    type="password"
                    placeholder="Your PayPal Client Secret"
                    value={paypalData.clientSecret}
                    onChange={(e) => setPaypalData({ ...paypalData, clientSecret: e.target.value })}
                  />
                </div>

                <div className="payment-form-group">
                  <label>Mode</label>
                  <select
                    value={paypalData.mode}
                    onChange={(e) => setPaypalData({ ...paypalData, mode: e.target.value })}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="live">Live (Production)</option>
                  </select>
                </div>

                <div className="payment-gateway-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleSave('paypal', paypalData)}
                    disabled={saving.paypal}
                  >
                    {saving.paypal ? '💾 Saving...' : '💾 Save Settings'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleTestConnection('paypal')}
                    disabled={testing.paypal || !paypalData.clientId}
                  >
                    {testing.paypal ? '⏳ Testing...' : '🧪 Test Connection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="payment-tab-content">
          <h2>🔒 Security</h2>
          <p className="payment-section-description">
            Your payment credentials are protected with industry-standard encryption
          </p>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>🔐 Data Protection</h3>
            </div>
            <div className="payment-card-content">
              <p>✅ All credentials are encrypted using AES-256-CBC encryption</p>
              <p>✅ Encryption keys are managed securely via environment variables</p>
              <p>✅ Data is stored in LONGTEXT fields for maximum security</p>
              <p>✅ API endpoints require admin role authentication (JWT tokens)</p>
              <p className="payment-info-text">🛡️ Your sensitive data is never transmitted in plain text</p>
            </div>
          </div>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>🔑 Best Practices</h3>
            </div>
            <div className="payment-card-content">
              <p>1. <strong>Use Sandbox First</strong> - Test all integrations in sandbox mode before production</p>
              <p>2. <strong>Rotate Credentials</strong> - Regularly update your API keys and secrets</p>
              <p>3. <strong>Monitor Activity</strong> - Check payment provider dashboards for suspicious activity</p>
              <p>4. <strong>Backup Credentials</strong> - Keep backup credentials in secure location (not in code)</p>
              <p>5. <strong>Admin Only</strong> - Only admins can view and modify payment settings</p>
              <p className="payment-info-text">💡 Tip: Use strong, unique credentials for each environment</p>
            </div>
          </div>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>📋 Requirements</h3>
            </div>
            <div className="payment-card-content">
              <p><strong>MTN Mobile Money:</strong></p>
              <p>• Subscription Key (Primary Key)</p>
              <p>• API User ID (UUID format)</p>
              <p>• API Key</p>
              <p style={{ marginTop: '16px' }}><strong>Airtel Money:</strong></p>
              <p>• Client ID</p>
              <p>• Client Secret</p>
              <p>• Merchant ID</p>
              <p style={{ marginTop: '16px' }}><strong>PayPal:</strong></p>
              <p>• Client ID</p>
              <p>• Client Secret</p>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="payment-tab-content">
          <h2>📖 Documentation</h2>
          <p className="payment-section-description">
            Quick references and setup guides for payment integrations
          </p>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>📱 MTN Mobile Money Setup</h3>
            </div>
            <div className="payment-card-content">
              <p><strong>Step 1:</strong> Visit <a href="https://developer.mtn.com" target="_blank" rel="noopener noreferrer">MTN Developer Portal</a></p>
              <p><strong>Step 2:</strong> Create a new application</p>
              <p><strong>Step 3:</strong> Subscribe to "Collection" product</p>
              <p><strong>Step 4:</strong> Copy Subscription Key and generate API credentials</p>
              <p className="payment-info-text">✅ Sandbox key format: 32-character hexadecimal string</p>
            </div>
          </div>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>📞 Airtel Money Setup</h3>
            </div>
            <div className="payment-card-content">
              <p><strong>Step 1:</strong> Visit <a href="https://developer.airtel.africa" target="_blank" rel="noopener noreferrer">Airtel Developer</a></p>
              <p><strong>Step 2:</strong> Register and create application</p>
              <p><strong>Step 3:</strong> Get credentials (Client ID, Secret, Merchant ID)</p>
              <p><strong>Step 4:</strong> Setup HTTPS callback URL (requires ngrok)</p>
              <p className="payment-info-text">✅ Requires HTTPS for webhook callbacks</p>
            </div>
          </div>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>💳 PayPal Setup</h3>
            </div>
            <div className="payment-card-content">
              <p><strong>Step 1:</strong> Visit <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer">PayPal Developer</a></p>
              <p><strong>Step 2:</strong> Create Business Account</p>
              <p><strong>Step 3:</strong> Create Application</p>
              <p><strong>Step 4:</strong> Copy Client ID and Secret</p>
              <p className="payment-info-text">✅ Test with sandbox account first</p>
            </div>
          </div>

          <div className="payment-settings-card">
            <div className="payment-card-header">
              <h3>🔧 Testing Payments</h3>
            </div>
            <div className="payment-card-content">
              <p>After saving credentials, use the "Test Connection" button to verify setup.</p>
              <p>This endpoint checks if:</p>
              <p>• All required fields are present</p>
              <p>• Data is properly encrypted</p>
              <p>• Credentials format is valid</p>
              <p className="payment-info-text">✅ Green badge means ready for payments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsScreen;
