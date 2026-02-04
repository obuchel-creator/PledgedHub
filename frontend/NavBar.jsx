import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './src/context/AuthContext';
import './NavBar.css';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/campaigns', label: 'Campaigns', icon: '📊' },
  { to: '/analytics', label: 'Analytics', icon: '📈', adminOnly: true },
  { to: '/accounting/dashboard', label: 'Accounting', icon: '📋', adminOnly: true },
  { to: '/users', label: 'Users', icon: '👥', adminOnly: true },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Debug logging
  console.log('🔵 NavBar - user:', user);
  console.log('🔵 NavBar - user.role:', user?.role);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="qb-navbar">
      <div className="qb-navbar__logo"></div>
      <ul className="qb-navbar__links">
        {navLinks.map(link => {
          // Show admin-only links to: admin, staff, super_admin, support_staff, finance_admin
          const adminRoles = ['admin', 'staff', 'super_admin', 'support_staff', 'finance_admin'];
          if (link.adminOnly && (!user || !adminRoles.includes(user.role))) return null;
          return (
            <li key={link.to} className={location.pathname.startsWith(link.to) ? 'active' : ''}>
              <Link to={link.to}>
                <span className="qb-navbar__icon">{link.icon}</span>
                <span className="qb-navbar__label">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="qb-navbar__user" ref={dropdownRef}>
        {user ? (
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                backgroundColor: showDropdown ? 'rgba(0,0,0,0.05)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => {
                if (!showDropdown) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="qb-navbar__avatar" style={{ marginRight: '8px' }}>
                {user.name?.[0] || 'U'}
              </span>
              <span className="qb-navbar__username" style={{ marginRight: '6px' }}>
                {user.name || user.email}
              </span>
              <span style={{ fontSize: '12px', color: '#666' }}>▼</span>
            </div>
            
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '200px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <Link 
                  to="/profile" 
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ marginRight: '10px' }}>👤</span>
                  Profile
                </Link>
                
                <Link 
                  to="/settings" 
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ marginRight: '10px' }}>⚙️</span>
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#dc3545',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ marginRight: '10px' }}>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="qb-navbar__login">Login</Link>
        )}
      </div>
    </nav>
  );
}
