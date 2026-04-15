import React, { useState, useRef, useEffect } from 'react';

export default function MobileNav({ links = [], onNavigate } = {}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuIdRef = useRef(`mobile-nav-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleToggle() {
    setOpen((s) => !s);
  }

  function handleLinkClick(e, to) {
    if (typeof onNavigate === 'function') {
      e.preventDefault();
      try {
        onNavigate(to);
      } catch (err) {
        // swallow errors from callback to avoid breaking UI
        // (kept minimal and inline per requirements)
      }
    }
    setOpen(false);
  }

  // Inline minimal styles
  const styles = {
    container: { position: 'relative', display: 'inline-block' },
    button: {
      display: 'inline-flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      padding: 6,
      border: '1px solid #ccc',
      borderRadius: 6,
      background: 'white',
      cursor: 'pointer',
    },
    bar: {
      width: 22,
      height: 2,
      background: '#333',
      margin: '3px 0',
      borderRadius: 1,
      transition: 'transform 0.2s ease, opacity 0.2s ease',
    },
    menu: {
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 8px)',
      width: 200,
      background: 'white',
      border: '1px solid #e1e1e1',
      borderRadius: 6,
      boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      transition: 'max-height 240ms ease',
      maxHeight: open ? 400 : 0,
    },
    list: { listStyle: 'none', margin: 0, padding: 8 },
    item: {},
    link: {
      display: 'block',
      padding: '8px 12px',
      color: '#111',
      textDecoration: 'none',
      borderRadius: 4,
    },
    linkHover: { background: '#f5f5f5' },
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <button
        type="button"
        aria-controls={menuIdRef.current}
        aria-expanded={open}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        onClick={handleToggle}
        style={styles.button}
      >
        <span
          style={{
            ...styles.bar,
            transform: open ? 'translateY(5px) rotate(45deg)' : 'none',
          }}
        />
        <span
          style={{
            ...styles.bar,
            opacity: open ? 0 : 1,
            transform: open ? 'scale(0.9)' : 'none',
          }}
        />
        <span
          style={{
            ...styles.bar,
            transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none',
          }}
        />
      </button>

      <div id={menuIdRef.current} role="menu" aria-hidden={!open} style={styles.menu}>
        <ul style={styles.list}>
          {links.map((l, i) => {
            const to = l && l.to ? l.to : '#';
            const label = l && l.label ? l.label : String(to);
            return (
              <li key={i} style={styles.item} role="none">
                <a
                  role="menuitem"
                  href={to}
                  onClick={(e) => handleLinkClick(e, to)}
                  style={styles.link}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = styles.linkHover.background)
                  }
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


