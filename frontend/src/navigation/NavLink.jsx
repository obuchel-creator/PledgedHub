import React from 'react';

function NavLink({
  to = '#',
  children,
  activeClassName = 'active',
  className = '',
  onClick,
  ...rest
}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isActive = pathname === to;
  const combinedClassName = [className, isActive && activeClassName].filter(Boolean).join(' ');

  return (
    <a
      href={to}
      role="link"
      tabIndex={0}
      className={combinedClassName || undefined}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}

export default NavLink;
