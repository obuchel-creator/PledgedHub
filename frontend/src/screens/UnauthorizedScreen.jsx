import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px',
          }}
        >
          🚫
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '12px',
          }}
        >
          Access Denied
        </h1>

        {/* Message */}
        <p
          style={{
            color: '#64748b',
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '24px',
          }}
        >
          You don't have permission to access this page.
          {user && (
            <>
              <br />
              <span style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Current role: <strong>{user.role}</strong>
              </span>
            </>
          )}
        </p>

        {/* Info Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left',
            fontSize: '14px',
            color: '#475569',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            Access Levels:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>
              <strong>Admin:</strong> Full system access, can manage campaigns and users
            </li>
            <li>
              <strong>Staff:</strong> Can create pledges and view analytics
            </li>
            <li>
              <strong>Donor:</strong> Can view own pledges only
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#2563eb',
              border: '2px solid #2563eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f1f5f9';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#fff';
            }}
          >
            ← Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🏠 Go to Home
          </button>
        </div>

        {/* Logout Option */}
        {user && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px',
              }}
              onMouseOver={(e) => (e.target.style.color = '#334155')}
              onMouseOut={(e) => (e.target.style.color = '#64748b')}
            >
              Sign out and log in with a different account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnauthorizedScreen;


