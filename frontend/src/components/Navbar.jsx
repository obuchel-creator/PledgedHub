import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Dynamic nav links based on user role
  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [{ to: '/explore', label: 'Explore' }]),
    { to: '/campaigns', label: 'Campaigns' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/create', label: 'Create' },
    ...(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin'
      ? [
          { to: '/admin/users', label: 'Users' },
          { to: '/accounting/dashboard', label: 'Accounting' },
          { to: '/accounting/chart-of-accounts', label: 'Accounts' }
        ]
      : []),
    { to: '/about', label: 'About' },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        <div className="navbar__top-row">
          <Link
            to="/"
            className="navbar__brand"
            onClick={closeMobileMenu}
          >
            <span className="navbar__brand-wrap">
              <Logo size="large" showText={false} />
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="navbar__mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav
          className={`navbar__nav${mobileMenuOpen ? ' navbar__nav--open' : ''}`}
          aria-label="Main navigation"
          style={
            mobileMenuOpen
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                }
              : {}
          }
        >
          <ul className="navbar__list">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link--active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar__actions">
            {user ? (
              <div
                className="navbar__user"
                ref={userMenuRef}
              >
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-controls="user-menu-dropdown"
                  className="navbar__user-trigger"
                >
                  <span className="navbar__greeting">
                    <span className="navbar__greeting-text">Hi, {user.name || user.email || 'Member'}</span>
                    <span className="navbar__greeting-chevron" aria-hidden="true">{userMenuOpen ? '▲' : '▼'}</span>
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    id="user-menu-dropdown"
                    role="menu"
                    aria-label="User menu"
                    className="navbar__dropdown"
                  >
                    <Link
                      to="/change-password"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobileMenu();
                      }}
                      className="navbar__dropdown-item"
                    >
                      <span>Change Password</span>
                    </Link>
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobileMenu();
                      }}
                      className="navbar__dropdown-item"
                    >
                      <span>Profile</span>
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="navbar__dropdown-item navbar__dropdown-item--danger"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="navbar__link" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn--small"
                  onClick={closeMobileMenu}
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


