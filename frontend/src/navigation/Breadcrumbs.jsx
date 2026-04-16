import React from 'react';

function humanize(segment = '') {
  if (!segment) return 'Home';
  const s = String(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return s;
}

export default function Breadcrumbs({
  baseLabel = 'Home',
  separator = '/',
  className = '',
  style = {},
}) {
  if (typeof window === 'undefined') return null;

  const baseHref = import.meta.env.BASE_URL;
  const raw = window.location.pathname || '/';

  // Strip the app base path (GitHub Pages subpath) from the URL before building crumbs.
  const baseNoTrail = (baseHref || '/').replace(/\/+$/, '') || '/';
  const withoutBase =
    baseNoTrail !== '/' && (raw === baseNoTrail || raw.startsWith(baseNoTrail + '/'))
      ? raw.slice(baseNoTrail.length) || '/'
      : raw;

  // strip trailing slashes and ensure leading slash
  const path = withoutBase.replace(/\/+$/, '') || '/';
  const parts = path === '/' ? [] : path.replace(/^\//, '').split('/');

  // build cumulative hrefs
  const crumbs = [
    { label: baseLabel, href: baseHref },
    ...parts.map((p, i) => {
      const href = baseHref + parts.slice(0, i + 1).join('/');
      return { label: humanize(p), href };
    }),
  ];

  const lastIndex = crumbs.length - 1;

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{ fontFamily: 'system-ui, sans-serif', ...style }}
    >
      <ol
        style={{
          listStyle: 'none',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          margin: 0,
          padding: 0,
        }}
      >
        {crumbs.map((c, idx) => {
          const isLast = idx === lastIndex;
          return (
            <li key={c.href} style={{ display: 'flex', alignItems: 'center' }}>
              {isLast ? (
                <span aria-current="page" style={{ color: '#111', fontWeight: 600 }}>
                  {c.label}
                </span>
              ) : (
                <a href={c.href} style={{ color: '#0070f3', textDecoration: 'none' }}>
                  {c.label}
                </a>
              )}
              {!isLast && (
                <span aria-hidden="true" style={{ margin: '0 8px', color: '#888' }}>
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


