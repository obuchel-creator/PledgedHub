
import React from 'react';
import { Link } from 'react-router-dom';
import ApiTest from '../components/ApiTest';
import { getViteEnv } from '../utils/getViteEnv';

export default function DevStatusScreen() {
  const env = getViteEnv();
  // Only show in development mode
  if (env.NODE_ENV !== 'development') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>🚫 Access Denied</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Developer status page is only available in development mode.
        </p>
        <Link
          to="/"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            padding: '8px 16px',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
          }}
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Developer Header */}
      <div
        style={{
          backgroundColor: '#1e293b',
          color: 'white',
          padding: '16px 0',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '700' }}>
              🛠️ Developer Status Dashboard
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Real-time system monitoring for development
            </p>
          </div>
          <Link
            to="/"
            style={{
              color: '#e2e8f0',
              textDecoration: 'none',
              padding: '8px 12px',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            ← Back to App
          </Link>
        </div>
      </div>

      {/* API Test Component */}
      <ApiTest />

      {/* Additional Developer Info */}
      <div
        style={{
          maxWidth: '800px',
          margin: '24px auto',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
            }}
          >
            🔧 Developer Tools
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <strong style={{ color: '#475569' }}>Environment:</strong> {env.NODE_ENV}
            </div>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <strong style={{ color: '#475569' }}>Backend URL:</strong>{' '}
              {env.API_URL || 'http://localhost:5001'}
            </div>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <strong style={{ color: '#475569' }}>Build:</strong> Development
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        <p style={{ margin: '0' }}>
          This page is only accessible in development mode and will not be available in production.
        </p>
      </div>
    </div>
  );
}
