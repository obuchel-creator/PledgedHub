import React, { useState, useEffect } from 'react';

// Enhanced API connectivity test component with modern styling
export default function ApiTest() {
  const [status, setStatus] = useState('Testing...');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      setIsLoading(true);
      const testResults = [];
      const baseUrl = 'http://localhost:5001';

      // Test 1: Basic connectivity
      try {
        console.log('Testing basic connectivity...');
        const response = await fetch(`${baseUrl}/api/test`);
        const data = await response.json();
        testResults.push({
          test: 'Basic API Test',
          status: response.ok ? 'PASS' : 'FAIL',
          message: data.message || 'No response',
          url: `${baseUrl}/api/test`,
          icon: '🔌',
        });
      } catch (error) {
        testResults.push({
          test: 'Basic API Test',
          status: 'FAIL',
          message: error.message,
          url: `${baseUrl}/api/test`,
          icon: '🔌',
        });
      }

      // Test 2: Root endpoint
      try {
        console.log('Testing root endpoint...');
        const response = await fetch(`${baseUrl}/`);
        const data = await response.json();
        testResults.push({
          test: 'Root Endpoint',
          status: response.ok ? 'PASS' : 'FAIL',
          message: data.message || 'No response',
          url: `${baseUrl}/`,
          icon: '🏠',
        });
      } catch (error) {
        testResults.push({
          test: 'Root Endpoint',
          status: 'FAIL',
          message: error.message,
          url: `${baseUrl}/`,
          icon: '🏠',
        });
      }

      // Test 3: Pledges endpoint
      try {
        console.log('Testing pledges endpoint...');
        const response = await fetch(`${baseUrl}/api/pledges`);
        const data = await response.json();
        testResults.push({
          test: 'Pledges API',
          status: response.ok ? 'PASS' : 'FAIL',
          message: Array.isArray(data) ? `Found ${data.length} pledges` : 'Data received',
          url: `${baseUrl}/api/pledges`,
          icon: '💰',
        });
      } catch (error) {
        testResults.push({
          test: 'Pledges API',
          status: 'FAIL',
          message: error.message,
          url: `${baseUrl}/api/pledges`,
          icon: '💰',
        });
      }

      // Test 4: AI Status
      try {
        console.log('Testing AI status...');
        const response = await fetch(`${baseUrl}/api/ai/status`);
        const data = await response.json();
        testResults.push({
          test: 'AI Service',
          status: response.ok ? 'PASS' : 'FAIL',
          message: data.available ? 'AI Available' : 'AI Unavailable',
          url: `${baseUrl}/api/ai/status`,
          icon: '🤖',
        });
      } catch (error) {
        testResults.push({
          test: 'AI Service',
          status: 'FAIL',
          message: error.message,
          url: `${baseUrl}/api/ai/status`,
          icon: '🤖',
        });
      }

      setResults(testResults);
      const passed = testResults.filter((r) => r.status === 'PASS').length;
      const total = testResults.length;
      setStatus(`${passed}/${total} tests passed`);
      setIsLoading(false);
    };

    runTests();
  }, []);

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '24px',
    margin: '16px 0',
    border: '1px solid #e5e7eb',
  };

  const testItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    margin: '12px 0',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🧪 API System Status
          </h2>
          <p
            style={{
              margin: '0',
              color: '#6b7280',
              fontSize: '16px',
            }}
          >
            Real-time connectivity monitoring
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: isLoading
                ? '#fbbf24'
                : results.filter((r) => r.status === 'PASS').length === results.length
                  ? '#10b981'
                  : '#ef4444',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {isLoading ? '⏳ Running tests...' : status}
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
              <div style={{ color: '#6b7280' }}>Testing API connectivity...</div>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                style={{
                  ...testItemStyle,
                  backgroundColor: result.status === 'PASS' ? '#f0fdf4' : '#fef2f2',
                  borderColor: result.status === 'PASS' ? '#bbf7d0' : '#fecaca',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '20px', marginRight: '12px' }}>{result.icon}</span>
                  <div>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: '16px',
                        color: '#1f2937',
                        marginBottom: '4px',
                      }}
                    >
                      {result.test}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      {result.message}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontFamily: 'monospace',
                      }}
                    >
                      {result.url}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: result.status === 'PASS' ? '#dcfce7' : '#fee2e2',
                    color: result.status === 'PASS' ? '#166534' : '#dc2626',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  {result.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                </div>
              </div>
            ))
          )}
        </div>

        {results.length > 0 && !isLoading && (
          <div
            style={{
              marginTop: '32px',
              padding: '24px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              📊 System Summary
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '16px', marginRight: '8px' }}>
                  {results.filter((r) => r.status === 'PASS').length > 0 ? '🟢' : '🔴'}
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    Backend
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {results.filter((r) => r.status === 'PASS').length > 0
                      ? 'Connected'
                      : 'Disconnected'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '16px', marginRight: '8px' }}>
                  {results.find((r) => r.test === 'Pledges API' && r.status === 'PASS')
                    ? '🟢'
                    : '🔴'}
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    Database
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {results.find((r) => r.test === 'Pledges API' && r.status === 'PASS')
                      ? 'Connected'
                      : 'Error'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '16px', marginRight: '8px' }}>
                  {results.find((r) => r.test === 'AI Service' && r.status === 'PASS')
                    ? '🟢'
                    : '🔴'}
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>
                    AI Service
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {results.find((r) => r.test === 'AI Service' && r.status === 'PASS')
                      ? 'Available'
                      : 'Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


