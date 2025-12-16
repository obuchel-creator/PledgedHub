import React from 'react';

export default function AIFeatureBanner() {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%)',
        padding: '2rem',
        borderRadius: '16px',
        margin: '2rem 0',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.6,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
          }}
        >
          🤖✨
        </div>

        <h3
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 0.5rem 0',
          }}
        >
          AI-Powered Pledge Assistant
        </h3>

        <p
          style={{
            fontSize: '1rem',
            opacity: 0.9,
            margin: '0 0 1.5rem 0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Get personalized reminders, smart analytics, and collection insights with AI. Click the
          chatbot in the bottom-right corner to get started!
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            📧 Smart Reminders
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            📊 Data Analytics
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            💡 Collection Tips
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            🎯 Personalized Messages
          </div>
        </div>
      </div>
    </div>
  );
}
