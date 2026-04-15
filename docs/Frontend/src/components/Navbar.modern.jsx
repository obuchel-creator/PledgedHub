import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import pledgeHubLogo from '../assets/pledge hub logo.png';
import './Navbar.modern.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isAuthenticated = !!user;

  const handleLogout = async () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊', requiresAuth: true },
    { to: '/campaigns', label: 'Campaigns', icon: '🎯', requiresAuth: false },
    { to: '/analytics', label: 'Analytics', icon: '📈', requiresAuth: true, adminOnly: true },
    { to: '/about', label: 'About', icon: 'ℹ️', requiresAuth: false },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (link.requiresAuth && !isAuthenticated) return false;
    if (link.adminOnly && (!user || (user.role !== 'admin' && user.role !== 'staff'))) return false;
    return true;
  });

  const isLinkActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src={pledgeHubLogo} alt="PledgeHub Logo" className="navbar-logo-icon" style={{ height: '4.5rem', width: 'auto', verticalAlign: 'middle' }} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-menu">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${isLinkActive(link.to) ? 'navbar-link--active' : ''}`}
              title={link.label}
            >
              <span className="navbar-link-icon">{link.icon}</span>
              <span className="navbar-link-label">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side - Auth / User Menu */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="navbar-user-menu" ref={userMenuRef}>
              <button
                className="navbar-user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="navbar-user-avatar">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="navbar-user-info">
                  <div className="navbar-user-name">{user?.name || 'User'}</div>
                  <div className="navbar-user-role">
                    {user?.role === 'admin' ? '👑 Admin' : user?.role === 'staff' ? '👤 Staff' : '👤 User'}
                  </div>
                </div>
                <svg className="navbar-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4.5 6L8 9.5L11.5 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <div className="navbar-dropdown-avatar">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="navbar-dropdown-name">{user?.name || 'User'}</div>
                      <div className="navbar-dropdown-email">{user?.email}</div>
                    </div>
                  </div>

                  <div className="navbar-dropdown-divider"></div>

                  <Link to="/profile" className="navbar-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <span>👤</span>
                    <span>Profile</span>
                  </Link>

                  <Link to="/settings" className="navbar-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <span>⚙️</span>
                    <span>Settings</span>
                  </Link>

                  {(user?.role === 'admin' || user?.role === 'staff') && (
                    <Link to="/admin" className="navbar-dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <span>🛠️</span>
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <a href="/help" className="navbar-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <span>❓</span>
                    <span>Help & Support</span>
                  </a>

                  <div className="navbar-dropdown-divider"></div>

                  <button className="navbar-dropdown-item navbar-dropdown-logout" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-menu" ref={mobileMenuRef}>
          <nav className="navbar-mobile-nav">
            {visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-mobile-link ${isLinkActive(link.to) ? 'navbar-mobile-link--active' : ''}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {!isAuthenticated && (
            <div className="navbar-mobile-actions">
              <Link to="/login" className="btn btn-secondary btn-block">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-block">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}


