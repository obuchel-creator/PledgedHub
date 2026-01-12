import React from 'react';
import PropTypes from 'prop-types';

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol>
        {items.map((item, idx) => (
          <li key={item.label} className={idx === items.length - 1 ? 'breadcrumb__item--active' : 'breadcrumb__item'}>
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
            {idx < items.length - 1 && <span className="breadcrumb__separator">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, href: PropTypes.string })
  ).isRequired,
};
