import React from 'react';
import logoImage from '../assets/pledgehub-logo.png';

export default function Logo({ size = 'medium', showText = true, textSize, onlyImage = false }) {
  const sizes = {
    small: { height: 32, text: '1.1rem' },
    medium: { height: 48, text: '1.5rem' },
    large: { height: 64, text: '2rem' },
  };

  const { height, text } = sizes[size] || sizes.medium;
  const fontSize = textSize || text;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: onlyImage ? 0 : showText ? '12px' : '0',
        textDecoration: 'none',
      }}
    >
      {/* Logo Image */}
      <img
        src={logoImage}
        alt="PledgeHub Logo"
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {/* Logo Text - Africa's Talking Style */}
      {!onlyImage && showText && (
        <span
          style={{
            fontSize,
            fontWeight: '700',
            color: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            lineHeight: '1',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          PledgeHub
        </span>
      )}
    </div>
  );
}



