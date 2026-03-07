import React, { useState, useEffect } from 'react';

export default function Sidebar({ collapsed: collapsedProp = false }) {
  const [collapsed, setCollapsed] = useState(Boolean(collapsedProp));
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    setCollapsed(Boolean(collapsedProp));
  }, [collapsedProp]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('pushstate', onLocationChange); // harmless if not fired
    window.addEventListener('replacestate', onLocationChange); // harmless if not fired
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('pushstate', onLocationChange);
      window.removeEventListener('replacestate', onLocationChange);
    };
  }, []);

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Create', href: '/create' },
    { name: 'About', href: '/about' },
    { name: 'Recent', href: '/recent' },
  ];

  const containerStyle = {
    width: collapsed ? 64 : 220,
    minWidth: collapsed ? 64 : 160,
    background: '#f7f8fa',
    borderRight: '1px solid #e2e6ea',
    height: '100vh',
    boxSizing: 'border-box',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    padding: '8px',
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginLeft: collapsed ? 0 : 4,
  };

  const toggleBtnStyle = {
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 8px',
    cursor: 'pointer',
    color: '#111827',
    fontSize: 14,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '4px 0',
    overflowY: 'auto',
  };

  const ulStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const liStyle = {
    margin: 0,
  };

  const linkBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: '#0f172a',
    padding: '8px',
    borderRadius: 6,
    fontSize: 14,
  };

  const activeLinkStyle = {
    background: '#e6f0ff',
    color: '#0b3bff',
    fontWeight: 600,
  };

  const iconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    background: 'transparent',
    color: 'inherit',
    fontWeight: 700,
  };

  const textStyle = (hidden) => ({
    display: hidden ? 'none' : 'inline',
  });

  const handleToggle = () => setCollapsed((s) => !s);

  return (
    <nav aria-label="Main sidebar" style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#0b3bff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              marginRight: collapsed ? 0 : 8,
            }}
            aria-hidden="true"
          >
            O
          </div>
          <div style={titleStyle}>
            <span style={textStyle(collapsed)}>PledgeHub</span>
          </div>
        </div>

        <button
          onClick={handleToggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={toggleBtnStyle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <div style={navStyle}>
        <ul style={ulStyle}>
          {links.map((l) => {
            const active =
              l.href === '/'
                ? path === '/'
                : path === l.href ||
                  path.startsWith(l.href + '/') ||
                  path.startsWith(l.href + '?') ||
                  path.startsWith(l.href);
            return (
              <li key={l.href} style={liStyle}>
                <a
                  href={l.href}
                  style={{ ...linkBase, ...(active ? activeLinkStyle : {}) }}
                  aria-current={active ? 'page' : undefined}
                  title={l.name}
                >
                  <span style={iconStyle} aria-hidden="true">
                    {l.name.charAt(0)}
                  </span>
                  <span style={textStyle(collapsed)}>{l.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}



