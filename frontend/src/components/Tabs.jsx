import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Tabs({ tabs, initial = 0 }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="tabs">
      <nav className="tabs-nav" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={active === i}
            className={active === i ? 'tab tab--active' : 'tab'}
            onClick={() => setActive(i)}
            tabIndex={active === i ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="tabs-content" role="tabpanel">
        {tabs[active].content}
      </div>
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, content: PropTypes.node.isRequired })
  ).isRequired,
  initial: PropTypes.number,
};
