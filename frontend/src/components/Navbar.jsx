import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Debug logging
  console.log('🔵 Navbar - user:', user);
  console.log('🔵 Navbar - user.role:', user?.role);

  // Dynamic nav links based on user role
  const adminRoles = ['admin', 'staff', 'super_admin', 'superadmin', 'support_staff', 'finance_admin'];
  const isAdmin = user && adminRoles.includes(user.role);
  
  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [{ to: '/explore', label: 'Explore' }]),
    { to: '/campaigns', label: 'Campaigns' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/fundraise', label: 'Fundraise' },
    ...(isAdmin
      ? [
          { to: '/users', label: '👥 Users' },
          { to: '/accounting/dashboard', label: '📊 Accounting' },
          { to: '/accounting/chart-of-accounts', label: '📋 Accounts' }
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

  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Link
            to="/"
            className="navbar__brand"
            onClick={closeMobileMenu}
            style={{ textDecoration: 'none' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
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
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--text)',
            }}
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexDirection: 'row',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    className="navbar__greeting"
                    style={{
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>👤</span>
                    <span>Hi, {user.name || user.email || 'Member'}</span>
                    <span style={{ fontSize: '0.8rem' }}>{userMenuOpen ? '▲' : '▼'}</span>
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      overflow: 'hidden',
                    }}
                  >
                    <Link
                      to="/change-password"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobileMenu();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#1f2937',
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
                      onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                    >
                      <span>🔒</span>
                      <span>Change Password</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobileMenu();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#1f2937',
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = '#f3f4f6')}
                      onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                    >
                      <span>👤</span>
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#dc2626',
                        fontWeight: '500',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                    >
                      <span>🚪</span>
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


