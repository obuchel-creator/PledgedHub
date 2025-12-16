// ...existing code...
import React from 'react';

const Button = React.forwardRef(function Button(
  {
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    disabled = false,
    className = '',
    style = {},
    ...rest
  },
  ref,
) {
  const variants = {
    primary: { background: '#0070f3', color: '#fff', border: 'none' },
    secondary: { background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db' },
    ghost: { background: 'transparent', color: '#0070f3', border: 'none' },
  };

  const v = variants[variant] || variants.primary;

  const mergedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 14,
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    transition: 'background-color 120ms ease, transform 80ms ease',
    userSelect: 'none',
    ...v,
    ...style,
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      style={mergedStyle}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
// ...existing code...
