import React from 'react';

/**
 * LoadingIndicator - A11y, theme, and size adaptable loading spinner
 * @param {string} message - Message to display below spinner
 * @param {number} size - Diameter of spinner in px (default 40)
 * @param {string} color - Spinner color (default #2563eb)
 * @param {string} bgColor - Optional background color
 */
export default function LoadingIndicator({
  message = 'Loading...',
  size = 40,
  color = '#2563eb',
  bgColor = 'transparent',
  style = {},
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '30vh',
        color,
        fontSize: '1.2rem',
        fontWeight: 500,
        background: bgColor,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: '1rem' }}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          stroke={color}
          strokeWidth={size * 0.1}
          strokeDasharray={`${Math.round(size * 7.1)} ${Math.round(size * 4.7)}`}
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            repeatCount="indefinite"
            dur="0.9s"
            from={`0 ${size / 2} ${size / 2}`}
            to={`360 ${size / 2} ${size / 2}`}
          />
        </circle>
      </svg>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
        }}
      >
        {message}
      </span>
      <div aria-hidden="true">{message}</div>
    </div>
  );
}


