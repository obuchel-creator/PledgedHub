import React from 'react';

export default function AIFeatureBanner() {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.85)',
        padding: '2.5rem 2rem',
        borderRadius: '24px',
        margin: '2.5rem 0',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 48px 0 rgba(59,130,246,0.13)',
        border: '1.5px solid rgba(59,130,246,0.13)',
        backdropFilter: 'blur(24px) saturate(1.2)',
      }}
    >
      {/* Animated Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: 'linear-gradient(120deg, #3b82f6 0%, #1d4ed8 50%, #10b981 100%)',
        opacity: 0.85,
        backgroundSize: '200% 200%',
        animation: 'ai-banner-gradient 6s ease-in-out infinite',
      }} />
      {/* Glassmorphic Pattern Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.5,
        zIndex: 1,
      }} />

      {/* Floating AI Icon with Animation */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: '0.5rem' }}>
        <span style={{
          display: 'inline-block',
          fontSize: '3.2rem',
          filter: 'drop-shadow(0 4px 24px #3b82f6cc)',
          animation: 'ai-float 3.5s ease-in-out infinite',
          transition: 'transform 0.2s',
        }}>🤖✨</span>
	  </div>


      <h3
        style={{
          fontSize: '1.7rem',
          fontWeight: '700',
          margin: '0 0 0.7rem 0',
          letterSpacing: '-0.01em',
          textShadow: '0 2px 12px #1d4ed8cc',
        }}
      >
        AI-Powered Pledge Assistant
      </h3>

      <p
        style={{
          fontSize: '1.08rem',
          opacity: 0.93,
          margin: '0 0 1.7rem 0',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textShadow: '0 1px 8px #3b82f6cc',
        }}
      >
        Get personalized reminders, smart analytics, and collection insights with AI.<br />
        <span style={{fontWeight:600, color:'#fff'}}>Click the chatbot in the bottom-right corner to get started!</span>
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.1rem',
          flexWrap: 'wrap',
          zIndex: 2,
          position: 'relative',
        }}
      >
        {[
          { icon: '📧', label: 'Smart Reminders', color: '#3b82f6' },
          { icon: '📊', label: 'Data Analytics', color: '#10b981' },
          { icon: '💡', label: 'Collection Tips', color: '#f59e42' },
          { icon: '🎯', label: 'Personalized Messages', color: '#ef4444' },
        ].map((item, idx) => (
          <div
            key={item.label}
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              padding: '0.6rem 1.2rem',
              borderRadius: '22px',
              fontSize: '0.93rem',
              fontWeight: 600,
              color: item.color,
              boxShadow: `0 2px 12px 0 ${item.color}22`,
              border: `1.2px solid ${item.color}33`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s, color 0.2s',
              cursor: 'pointer',
              userSelect: 'none',
              backdropFilter: 'blur(10px)',
              animation: idx % 2 === 0 ? 'ai-badge-float 3.2s ease-in-out infinite' : 'ai-badge-float2 3.2s ease-in-out infinite',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.32)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          >
            <span style={{fontSize:'1.2rem'}}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes ai-banner-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ai-badge-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ai-badge-float2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}


