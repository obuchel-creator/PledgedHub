import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    phone: user?.phone_number || user?.phone || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Block name field for regular users
    if (name === 'name' && user?.role === 'user') {
      setMessage({ 
        type: 'error', 
        text: 'Your name cannot be edited. Contact an administrator if a correction is needed.' 
      });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Implement API call to update profile
      // const response = await updateProfile(formData);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      // refreshUser();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
      phone: user?.phone_number || user?.phone || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-base)', backgroundImage: 'var(--gradient-1), var(--gradient-2), var(--gradient-3)', backgroundAttachment: 'fixed' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#202124' }}>
              My Profile
            </h1>
            <p style={{ margin: 0, color: '#5f6368', fontSize: '14px' }}>
              Manage your personal information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '10px 24px',
                background: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Avatar Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: '700',
            color: 'white',
            marginRight: '20px'
          }}>
            {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>
              {user?.name || 'User'}
            </h3>
            <p style={{ margin: 0, color: '#5f6368', fontSize: '14px' }}>
              {user?.role === 'admin' ? '👑 Administrator' : user?.role === 'staff' ? '⭐ Staff' : '👤 Member'}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#202124'
          }}>
            Full Name {user?.role === 'user' && <span style={{ color: '#ff6b6b', fontSize: '12px' }}>(Read-only)</span>}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing || user?.role === 'user'}
            readOnly={user?.role === 'user'}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: user?.role === 'user' ? '1px solid #ffcccc' : '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '15px',
              backgroundColor: user?.role === 'user' ? '#fff5f5' : (isEditing ? 'white' : '#f8f9fa'),
              cursor: user?.role === 'user' ? 'not-allowed' : (isEditing ? 'text' : 'not-allowed'),
              boxSizing: 'border-box',
              color: user?.role === 'user' ? '#999' : 'inherit'
            }}
          />
          {user?.role === 'user' && (
            <small style={{
              display: 'block',
              marginTop: '8px',
              color: '#ff9800',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              ℹ️ Your name is locked for security. Contact an administrator if you need a correction.
            </small>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#202124'
          }}>
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '15px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              cursor: isEditing ? 'text' : 'not-allowed',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#202124'
          }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '15px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              cursor: isEditing ? 'text' : 'not-allowed',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#202124'
          }}>
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="+256771234567"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              fontSize: '15px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              cursor: isEditing ? 'text' : 'not-allowed',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: loading ? '#e8f0fe' : '#1a73e8',
                color: loading ? '#80868b' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#5f6368',
                border: '1px solid #dadce0',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Account Info */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#202124' }}>
            Account Information
          </h3>
          <div style={{ display: 'grid', gap: '8px', fontSize: '14px', color: '#5f6368' }}>
            <div><strong>Account ID:</strong> {user?.id}</div>
            <div><strong>Role:</strong> {user?.role || 'user'}</div>
            <div><strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


