/**
 * Role-Based Navigation Component
 * Usage in your app:
 * import { RBACNavBar } from '../components/RBACNavBar';
 * <RBACNavBar userRole={userRole} />
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getNavigationMenu, getGroupedMenu } from '../utils/navigationConfig';

export function RBACNavBar({ userRole, userName = 'User' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menu = getNavigationMenu(userRole);
  const groupedMenu = getGroupedMenu(userRole);

  const getRoleColor = (role) => {
    const colors = {
      donor: 'bg-blue-100 text-blue-800',
      creator: 'bg-green-100 text-green-800',
      support_staff: 'bg-yellow-100 text-yellow-800',
      finance_admin: 'bg-red-100 text-red-800',
      super_admin: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || colors.donor;
  };

  const getRoleLabel = (role) => {
    const labels = {
      donor: 'Donor',
      creator: 'Creator',
      support_staff: 'Support',
      finance_admin: 'Finance',
      super_admin: 'Admin'
    };
    return labels[role] || 'User';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">PledgeHub</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menu.slice(0, 5).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
            {menu.length > 5 && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                More...
              </button>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(userRole)}`}>
              {getRoleLabel(userRole)}
            </div>
            <div className="text-sm text-gray-600">
              {userName}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600"
            >
              {/* Menu icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown for more items */}
        {isMenuOpen && menu.length > 5 && (
          <div className="hidden md:absolute md:right-0 md:mt-2 md:w-48 md:bg-white md:shadow-lg md:rounded-md">
            {menu.slice(5).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

/**
 * Sidebar Navigation Component (for admin dashboards)
 */
export function RBACSidebar({ userRole, userName = 'User' }) {
  const groupedMenu = getGroupedMenu(userRole);

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen shadow-xl">
      {/* Header */}
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-blue-400">PledgeHub</h1>
        <div className="mt-4 text-sm text-gray-400">
          <div className="font-semibold text-white">{userName}</div>
          <div className="text-gray-500">Role: {userRole}</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="px-4 space-y-6">
        
        {/* Main Menu */}
        {groupedMenu.main.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Main</h3>
            <ul className="space-y-2">
              {groupedMenu.main.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="block px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Admin Menu */}
        {groupedMenu.admin.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Administration</h3>
            <ul className="space-y-2">
              {groupedMenu.admin.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="block px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-red-900 hover:text-white transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Account Menu */}
        {groupedMenu.account.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
            <ul className="space-y-2">
              {groupedMenu.account.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="block px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}

export default RBACNavBar;
