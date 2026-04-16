
import React from 'react';
import { Link } from 'react-router-dom';
import pledgeHubLogo from '../assets/pledge hub logo.png';

export default function QuickbooksNavbar() {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        height: '64px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* PledgeHub Logo and Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={pledgeHubLogo} alt="PledgeHub" style={{ height: '56px' }} />
      </div>
      {/* Main Nav Links - PledgeHub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/dashboard" style={navLinkStyle}>
          Dashboard
        </Link>
        <Link to="/pledges" style={navLinkStyle}>
          Pledges
        </Link>
        <Link to="/campaigns" style={navLinkStyle}>
          Campaigns
        </Link>
        <Link to="/analytics" style={navLinkStyle}>
          Analytics
        </Link>
        <Link to="/reports" style={navLinkStyle}>
          Reports
        </Link>
      </div>
      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button style={newBtnStyle}>+ New Pledge</button>
        <input type="search" placeholder="Search" style={searchStyle} />
        <span
          style={{ fontSize: '20px', color: '#2563eb', cursor: 'pointer' }}
          title="Notifications"
        >
          🔔
        </span>
        <span style={{ fontSize: '20px', color: '#2563eb', cursor: 'pointer' }} title="Help">
          ❓
        </span>
        <img
          src={`${import.meta.env.BASE_URL}avatar.png`}
          alt="User"
          style={{ height: '32px', width: '32px', borderRadius: '50%' }}
        />
      </div>
    </nav>
  );
}

const navLinkStyle = {
  color: '#374151',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  padding: '8px 0',
  transition: 'color 0.2s',
};

const newBtnStyle = {
  background: '#2ca01c',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 18px',
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(44,160,28,0.08)',
};

const searchStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '7px 14px',
  fontSize: '1rem',
  outline: 'none',
  width: '160px',
};


