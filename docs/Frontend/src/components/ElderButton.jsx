/**
 * Elder-Friendly Button Component
 * 
 * Large, high-contrast button designed for elderly users
 * Minimum 60px height, clear text, simple design
 */

import React from 'react';
import './ElderButton.css';

const ElderButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'large',
  icon = null,
  disabled = false,
  loading = false,
  fullWidth = false
}) => {
  const handleClick = () => {
    // Vibration feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Audio feedback
    playClickSound();
    
    if (onClick && !disabled && !loading) {
      onClick();
    }
  };

  const playClickSound = () => {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silent fail if audio not supported
    }
  };

  const className = `elder-button elder-button-${variant} elder-button-${size} ${fullWidth ? 'elder-button-fullwidth' : ''} ${disabled ? 'elder-button-disabled' : ''} ${loading ? 'elder-button-loading' : ''}`;

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {loading ? (
        <span className="elder-button-spinner">⏳</span>
      ) : (
        <>
          {icon && <span className="elder-button-icon">{icon}</span>}
          <span className="elder-button-text">{children}</span>
        </>
      )}
    </button>
  );
};

export default ElderButton;


