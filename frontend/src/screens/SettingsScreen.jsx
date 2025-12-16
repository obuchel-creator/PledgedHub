import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { changePassword, exportUserData, setup2FA, verify2FA, disable2FA, get2FAStatus } from '../api';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pledgeReminders: true,
    campaignUpdates: true,
    weeklyReports: false,
    language: language
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA modal state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState('setup'); // 'setup', 'verify', 'disable'
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  
  // Check 2FA status on mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);
  
  const checkTwoFactorStatus = async () => {
    try {
      const response = await get2FAStatus();
      if (response.success) {
        setTwoFactorEnabled(response.data.enabled);
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    setMessage({ type: '', text: '' });
  };

  const handleSelect = (key, value) => {
    setSettings({ ...settings, [key]: value });
    // Update language context when language changes
    if (key === 'language') {
      setLanguage(value);
    }
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Implement API call to save settings
      // await saveSettings(settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
    setMessage({ type: '', text: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    
    setPasswordLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTwoFactor = async () => {
    if (twoFactorEnabled) {
      // Show disable modal
      setTwoFactorStep('disable');
      setShow2FAModal(true);
    } else {
      // Setup 2FA
      setTwoFactorStep('setup');
      setTwoFactorLoading(true);
      setMessage({ type: '', text: '' });
      
      try {
        const response = await setup2FA();
        if (response.success) {
          setQrCode(response.data.qrCode);
          setSecret(response.data.secret);
          setShow2FAModal(true);
          setTwoFactorStep('verify');
        }
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to setup 2FA' 
        });
      } finally {
        setTwoFactorLoading(false);
      }
    }
  };
  
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }
    
    setTwoFactorLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await verify2FA(verificationCode);
      if (response.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication enabled!' });
        setTwoFactorEnabled(true);
        setShow2FAModal(false);
        setVerificationCode('');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Invalid verification code' 
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };
  
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    
    if (!disablePassword) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }
    
    setTwoFactorLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await disable2FA(disablePassword);
      if (response.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication disabled' });
        setTwoFactorEnabled(false);
        setShow2FAModal(false);
        setDisablePassword('');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to disable 2FA' 
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const data = await exportUserData();
      
      // Convert JSON to blob
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pledgehub-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to export data' 
      });
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#202124', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: '#5f6368' }}>
          {description}
        </div>
      </div>
      <div
        onClick={onChange}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: checked ? '#1a73e8' : '#dadce0',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.3s'
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1a202c' }}>
            {t('settings.title')}
          </h1>
          <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>
            Manage your preferences and account settings
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '24px',
            borderRadius: '6px',
            background: message.type === 'success' ? '#d4edda' : message.type === 'info' ? '#d1ecf1' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : message.type === 'info' ? '#0c5460' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : message.type === 'info' ? '#bee5eb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Notifications Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {'🔔'} {t('settings.notifications')}
          </h2>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <ToggleSwitch
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              label={t('settings.emailNotifications')}
              description={t('settings.emailNotificationsDesc')}
            />
            <ToggleSwitch
              checked={settings.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
              label={t('settings.smsNotifications')}
              description={t('settings.smsNotificationsDesc')}
            />
            <ToggleSwitch
              checked={settings.pledgeReminders}
              onChange={() => handleToggle('pledgeReminders')}
              label={t('settings.pledgeReminders')}
              description={t('settings.pledgeRemindersDesc')}
            />
            <ToggleSwitch
              checked={settings.campaignUpdates}
              onChange={() => handleToggle('campaignUpdates')}
              label={t('settings.campaignUpdates')}
              description={t('settings.campaignUpdatesDesc')}
            />
            <ToggleSwitch
              checked={settings.weeklyReports}
              onChange={() => handleToggle('weeklyReports')}
              label={t('settings.weeklyReports')}
              description={t('settings.weeklyReportsDesc')}
            />
          </div>
        </div>

        {/* Language Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {'🌍'} {t('settings.language')}
          </h2>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#202124',
              marginBottom: '8px'
            }}>
              {t('settings.selectLanguage')}
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSelect('language', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dadce0',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#202124',
                cursor: 'pointer',
                appearance: 'auto',
                outline: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="lg">Luganda</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
        </div>

        {/* Privacy & Security */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#202124',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {'🔒'} {t('settings.privacy')}
          </h2>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <button
              onClick={handleChangePassword}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                textAlign: 'left',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>🔑 Change Password</span>
              <span style={{ color: '#4a5568' }}>→</span>
            </button>
            <button
              onClick={handleTwoFactor}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                textAlign: 'left',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span>📱 Two-Factor Authentication</span>
                {twoFactorEnabled && (
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    background: '#e8f5e9', 
                    color: '#2e7d32', 
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    ENABLED
                  </span>
                )}
              </div>
              <span style={{ color: '#4a5568' }}>→</span>
            </button>
            <button
              onClick={handleDownloadData}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{'📊'} {t('settings.downloadData')}</span>
              <span style={{ color: '#4a5568' }}>→</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#e8f0fe' : '#1a73e8',
              color: loading ? '#80868b' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            {loading ? `${t('common.loading')}...` : `${'💾'} ${t('settings.saveChanges')}`}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ 
              color: '#1a202c', 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              Change Password
            </h2>
            <p style={{ 
              color: '#4a5568', 
              fontSize: '0.9rem', 
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Enter your current password and choose a new one
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#1a202c', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter current password"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#1a202c', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#1a202c', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px' 
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Confirm new password"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setMessage({ type: '', text: '' });
                  }}
                  disabled={passwordLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    color: '#1a202c',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: passwordLoading ? '#e8f0fe' : '#1a73e8',
                    color: passwordLoading ? '#80868b' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {show2FAModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            {twoFactorStep === 'verify' && (
              <>
                <h2 style={{ color: '#1a202c', fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  Setup Two-Factor Authentication
                </h2>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: '24px', margin: '0 0 24px 0' }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <img src={qrCode} alt="QR Code" style={{ maxWidth: '250px', marginBottom: '16px' }} />
                  <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginTop: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#4a5568', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Or enter this code manually:
                    </p>
                    <code style={{ fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>{secret}</code>
                  </div>
                </div>

                <form onSubmit={handleVerify2FA}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#1a202c', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Enter 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength="6"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #dadce0',
                        borderRadius: '6px',
                        fontSize: '18px',
                        textAlign: 'center',
                        letterSpacing: '8px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="000000"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FAModal(false);
                        setVerificationCode('');
                        setMessage({ type: '', text: '' });
                      }}
                      disabled={twoFactorLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'white',
                        color: '#1a202c',
                        border: '1px solid #dadce0',
                        borderRadius: '6px',
                        cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={twoFactorLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: twoFactorLoading ? '#e8f0fe' : '#1a73e8',
                        color: twoFactorLoading ? '#80868b' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {twoFactorLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {twoFactorStep === 'disable' && (
              <>
                <h2 style={{ color: '#1a202c', fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  Disable Two-Factor Authentication
                </h2>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: '24px', margin: '0 0 24px 0' }}>
                  Enter your password to disable two-factor authentication
                </p>

                <form onSubmit={handleDisable2FA}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#1a202c', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #dadce0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Enter your password"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FAModal(false);
                        setDisablePassword('');
                        setMessage({ type: '', text: '' });
                      }}
                      disabled={twoFactorLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'white',
                        color: '#1a202c',
                        border: '1px solid #dadce0',
                        borderRadius: '6px',
                        cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={twoFactorLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: twoFactorLoading ? '#f8d7da' : '#dc3545',
                        color: twoFactorLoading ? '#721c24' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: twoFactorLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
