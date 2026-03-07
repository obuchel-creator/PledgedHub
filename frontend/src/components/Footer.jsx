import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  const footerSections = [
    {
      title: 'Platform',
      links: [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/create', label: 'Create Pledge' },
        { to: '/explore', label: 'Explore' },
      ],
    },
    {
      title: 'Support',
      links: [
        { to: '/help', label: 'Help Center' },
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/terms', label: 'Terms of Use' },
      ],
    },
    {
      title: 'Account',
      links: [
        { to: '/register', label: 'Create Account' },
        { to: '/login', label: 'Sign In' },
        { to: '/pricing', label: 'Pricing' },
      ],
    },
  ];

  return (
    <footer className="app-footer" role="contentinfo" aria-label="Site footer">
      <div className="app-footer__container">
        <div className="app-footer__top">
          <div className="app-footer__brand">
            <Link to="/" className="app-footer__brand-link" aria-label="Go to home">
              <Logo size="large" showText={false} />
            </Link>
            <p className="app-footer__brand-text">
              Delivering transparent, accountable pledge management for modern organizations and
              community initiatives.
            </p>
            <ul className="app-footer__badges" aria-label="Platform trust highlights">
              <li className="app-footer__badge">Security-first platform</li>
              <li className="app-footer__badge">Audit-ready records</li>
              <li className="app-footer__badge">Responsive on every device</li>
            </ul>
          </div>

          {footerSections.map((section) => (
            <nav
              key={section.title}
              className="app-footer__section"
              aria-label={`${section.title} links`}
            >
              <h4 className="app-footer__heading">{section.title}</h4>
              <ul className="app-footer__list">
                {section.links.map((item) => (
                  <li key={item.to} className="app-footer__list-item">
                    <Link to={item.to} className="app-footer__link">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="app-footer__bottom">
          <div className="app-footer__copyright">
            <span className="app-footer__brand-name">PledgedHub</span>
            <span>© {year} All rights reserved.</span>
          </div>
          <div className="app-footer__meta">
            <span className="app-footer__community">Built for trust, transparency, and growth</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


