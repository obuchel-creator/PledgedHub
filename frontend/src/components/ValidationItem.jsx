// Simple validation item for password requirements
import React from 'react';

export default function ValidationItem({ label, isValid }) {
  return (
    <li style={{
      color: isValid ? '#16a34a' : '#dc2626',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem',
      marginBottom: '0.25rem',
    }}>
      <span style={{ fontSize: '1.2em' }}>{isValid ? '✔️' : '❌'}</span>
      {label}
    </li>
  );
}
