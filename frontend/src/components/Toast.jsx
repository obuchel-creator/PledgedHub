import React, { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✓',
          shadow: 'rgba(16, 185, 129, 0.4)',
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          icon: '✕',
          shadow: 'rgba(220, 38, 38, 0.4)',
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          icon: '⚠',
          shadow: 'rgba(245, 158, 11, 0.4)',
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'ℹ',
          shadow: 'rgba(59, 130, 246, 0.4)',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '450px',
        background: colors.bg,
        color: 'white',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        boxShadow: `0 10px 40px ${colors.shadow}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          flexShrink: 0,
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
        }}
      >
        {colors.icon}
      </span>
      <p
        style={{
          fontSize: '0.95rem',
          fontWeight: '500',
          lineHeight: '1.5',
          flex: 1,
          margin: 0,
        }}
      >
        {message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsVisible(false);
            onClose?.();
          }, 300);
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: '600',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.3)')}
        onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
        aria-label="Close notification"
      >
        ×
      </button>
      <style>
        {`
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateX(100px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    
                    @keyframes slideOut {
                        from {
                            opacity: 1;
                            transform: translateX(0);
                        }
                        to {
                            opacity: 0;
                            transform: translateX(100px);
                        }
                    }

                    @media (max-width: 480px) {
                        [role="alert"] {
                            top: 1rem !important;
                            right: 1rem !important;
                            left: 1rem !important;
                            min-width: auto !important;
                        }
                    }
                `}
      </style>
    </div>
  );
}


