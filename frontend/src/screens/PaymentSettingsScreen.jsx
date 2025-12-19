import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PaymentSettingsScreen.css';

const PaymentSettingsScreen = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('payment-gateways');
  const [expandedSection, setExpandedSection] = useState('mtn');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [credentials, setCredentials] = useState({
    mtn: {
      subscriptionKey: '',
      apiUser: '',
      apiKey: '',
      environment: 'sandbox',
      status: 'not-configured'
    },
    airtel: {
      clientId: '',
      clientSecret: '',
      merchantId: '',
      environment: 'sandbox',
      status: 'not-configured'
    },
    paypal: {
      clientId: '',
      clientSecret: '',
      mode: 'sandbox',
      status: 'not-configured'
    }
  });

  // Load settings on mount
  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setCredentials(data.data);
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to fetch payment settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = (provider, field, value) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async (provider) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(`/api/payment-settings/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials[provider])
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`${provider.toUpperCase()} settings saved successfully!`);
        setCredentials(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: 'configured'
          }
        }));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Error saving settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (provider) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(`/api/payment-settings/${provider}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Connection test failed');
      }
    } catch (err) {
      setError('Error testing connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'configured': { color: '#10b981', label: '✓ Configured' },
      'not-configured': { color: '#ef4444', label: '○ Not Configured' },
      'pending': { color: '#f59e0b', label: '⟳ Pending' }
    };
    return statusConfig[status] || statusConfig['not-configured'];
  };

  if (loading && Object.keys(credentials).every(k => !credentials[k].apiKey)) {
    return <div className="payment-settings-loading">Loading payment settings...</div>;
  }

  return (
    <div className="payment-settings-container">
      {/* Header */}
      <div className="payment-settings-header">
        <div>
          <h1>Payment Settings</h1>
          <p className="payment-settings-subtitle">Manage payment gateways and API credentials</p>
        </div>
        <div className="payment-settings-actions">
          <button className="btn-secondary">Documentation</button>
          <button className="btn-secondary">Support</button>
        </div>
      </div>

      {/* Messages */}
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="payment-settings-tabs">
        <button 
          className={`payment-tab ${activeTab === 'payment-gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment-gateways')}
        >
          <span className="payment-tab-icon">💳</span>
          Payment Gateways
        </button>
        <button 
          className={`payment-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="payment-tab-icon">🔒</span>
          Security
        </button>
      </div>

      {/* Content */}
      <div className="payment-settings-content">
        {/* Payment Gateways Tab */}
        {activeTab === 'payment-gateways' && (
          <div className="payment-tab-content">
            <h2>Configure Payment Providers</h2>
            <p className="payment-section-description">Add your payment provider credentials to enable pledge payments</p>

            {/* MTN Mobile Money */}
            <div className="payment-gateway-card">
              <div className="payment-gateway-header" onClick={() => toggleSection('mtn')}>
                <div className="payment-gateway-info">
                  <div className="payment-gateway-icon">📱</div>
                  <div>
                    <h3>MTN Mobile Money</h3>
                    <p>Enable payments via MTN MoMo in Uganda</p>
                  </div>
                </div>
                <div className="payment-gateway-status">
                  <span 
                    className="payment-status-badge"
                    style={{ backgroundColor: getStatusBadge(credentials.mtn.status).color }}
                  >
                    {getStatusBadge(credentials.mtn.status).label}
                  </span>
                  <span className="payment-expand-icon">{expandedSection === 'mtn' ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedSection === 'mtn' && (
                <div className="payment-gateway-content">
                  <div className="payment-form-group">
                    <label>Subscription Key</label>
                    <input 
                      type="password" 
                      placeholder="Enter your MTN subscription key"
                      value={credentials.mtn.subscriptionKey}
                      onChange={(e) => handleCredentialChange('mtn', 'subscriptionKey', e.target.value)}
                      disabled={loading}
                    />
                    <small>Get this from: <a href="https://momodeveloper.mtn.com" target="_blank" rel="noopener noreferrer">MTN Developer Portal</a></small>
                  </div>

                  <div className="payment-form-group">
                    <label>API User ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g., 92360f76-a4da-4ea6-af2f-fe559e59f20c"
                      value={credentials.mtn.apiUser}
                      onChange={(e) => handleCredentialChange('mtn', 'apiUser', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>API Key</label>
                    <input 
                      type="password" 
                      placeholder="Enter your MTN API key"
                      value={credentials.mtn.apiKey}
                      onChange={(e) => handleCredentialChange('mtn', 'apiKey', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Environment</label>
                    <select 
                      value={credentials.mtn.environment}
                      onChange={(e) => handleCredentialChange('mtn', 'environment', e.target.value)}
                      disabled={loading}
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="payment-gateway-actions">
                    <button 
                      className="btn-primary" 
                      onClick={() => handleSave('mtn')}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleTestConnection('mtn')}
                      disabled={loading}
                    >
                      Test Connection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Airtel Money */}
            <div className="payment-gateway-card">
              <div className="payment-gateway-header" onClick={() => toggleSection('airtel')}>
                <div className="payment-gateway-info">
                  <div className="payment-gateway-icon">📞</div>
                  <div>
                    <h3>Airtel Money</h3>
                    <p>Enable payments via Airtel Money in Uganda</p>
                  </div>
                </div>
                <div className="payment-gateway-status">
                  <span 
                    className="payment-status-badge"
                    style={{ backgroundColor: getStatusBadge(credentials.airtel.status).color }}
                  >
                    {getStatusBadge(credentials.airtel.status).label}
                  </span>
                  <span className="payment-expand-icon">{expandedSection === 'airtel' ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedSection === 'airtel' && (
                <div className="payment-gateway-content">
                  <div className="payment-form-group">
                    <label>Client ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter your Airtel Client ID"
                      value={credentials.airtel.clientId}
                      onChange={(e) => handleCredentialChange('airtel', 'clientId', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Client Secret</label>
                    <input 
                      type="password" 
                      placeholder="Enter your Airtel Client Secret"
                      value={credentials.airtel.clientSecret}
                      onChange={(e) => handleCredentialChange('airtel', 'clientSecret', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Merchant ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter your Airtel Merchant ID"
                      value={credentials.airtel.merchantId}
                      onChange={(e) => handleCredentialChange('airtel', 'merchantId', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Environment</label>
                    <select 
                      value={credentials.airtel.environment}
                      onChange={(e) => handleCredentialChange('airtel', 'environment', e.target.value)}
                      disabled={loading}
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="payment-gateway-actions">
                    <button 
                      className="btn-primary" 
                      onClick={() => handleSave('airtel')}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleTestConnection('airtel')}
                      disabled={loading}
                    >
                      Test Connection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className="payment-gateway-card">
              <div className="payment-gateway-header" onClick={() => toggleSection('paypal')}>
                <div className="payment-gateway-info">
                  <div className="payment-gateway-icon">💰</div>
                  <div>
                    <h3>PayPal</h3>
                    <p>Enable payments via PayPal globally</p>
                  </div>
                </div>
                <div className="payment-gateway-status">
                  <span 
                    className="payment-status-badge"
                    style={{ backgroundColor: getStatusBadge(credentials.paypal.status).color }}
                  >
                    {getStatusBadge(credentials.paypal.status).label}
                  </span>
                  <span className="payment-expand-icon">{expandedSection === 'paypal' ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedSection === 'paypal' && (
                <div className="payment-gateway-content">
                  <div className="payment-form-group">
                    <label>Client ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter your PayPal Client ID"
                      value={credentials.paypal.clientId}
                      onChange={(e) => handleCredentialChange('paypal', 'clientId', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Client Secret</label>
                    <input 
                      type="password" 
                      placeholder="Enter your PayPal Client Secret"
                      value={credentials.paypal.clientSecret}
                      onChange={(e) => handleCredentialChange('paypal', 'clientSecret', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="payment-form-group">
                    <label>Mode</label>
                    <select 
                      value={credentials.paypal.mode}
                      onChange={(e) => handleCredentialChange('paypal', 'mode', e.target.value)}
                      disabled={loading}
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="live">Live</option>
                    </select>
                  </div>

                  <div className="payment-gateway-actions">
                    <button 
                      className="btn-primary" 
                      onClick={() => handleSave('paypal')}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleTestConnection('paypal')}
                      disabled={loading}
                    >
                      Test Connection
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
            <h2>Security Settings</h2>
            <p className="payment-section-description">Configure security features for payment processing</p>
            
            <div className="payment-settings-card">
              <div className="payment-card-header">
                <h3>Encryption</h3>
              </div>
              <div className="payment-card-content">
                <p>All payment credentials are encrypted at rest and in transit.</p>
                <p className="payment-info-text">✓ AES-256-CBC encryption enabled</p>
                <p className="payment-info-text">✓ SSL/TLS for all connections</p>
                <p className="payment-info-text">✓ Automatic key rotation support</p>
              </div>
            </div>

            <div className="payment-settings-card">
              <div className="payment-card-header">
                <h3>API Security</h3>
              </div>
              <div className="payment-card-content">
                <p className="payment-info-text">✓ All API calls require authentication</p>
                <p className="payment-info-text">✓ Admin role required for payment settings</p>
                <p className="payment-info-text">✓ Rate limiting enabled</p>
                <p className="payment-info-text">✓ Request signing with API keys</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettingsScreen;


