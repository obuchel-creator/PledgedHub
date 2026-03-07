import React from 'react';
import logoImage from '../assets/pledge hub logo.png';


export default function Logo({ size = 'xlarge', showText = true, textSize, onlyImage = false }) {
  const sizes = {
    small: { height: 32, text: '1.1rem' },
    medium: { height: 48, text: '1.5rem' },
    large: { height: 64, text: '2rem' },
    xlarge: { height: 120, text: '2.5rem' },
    xxlarge: { height: 180, text: '3rem' },
  };

  const { height, text } = sizes[size] || sizes.xlarge;
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
      {showText && !onlyImage && (
        <span style={{ fontWeight: 700, fontSize: fontSize, color: '#1a237e', letterSpacing: '0.02em' }}>PledgeHub</span>
      )}
    </div>
  );
}



