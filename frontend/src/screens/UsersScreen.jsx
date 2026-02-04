import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaUserShield, FaUserTie, FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import './UsersScreen.css';

export default function UsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pledgehub_token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <FaUserShield style={{ color: '#dc2626' }} />;
      case 'staff':
        return <FaUserTie style={{ color: '#2563eb' }} />;
      default:
        return <FaUser style={{ color: '#64748b' }} />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', color: '#dc2626' },
      super_admin: { label: 'Super Admin', color: '#991b1b' },
      staff: { label: 'Staff', color: '#2563eb' },
      user: { label: 'User', color: '#64748b' }
    };
    const badge = badges[role] || badges.user;
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#fff',
        backgroundColor: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Only admins can access this page
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff')) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <FaUserShield style={{ fontSize: '4rem', color: '#dc2626', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem' }}>
          You don't have permission to view this page. User management is restricted to administrators only.
        </p>
        <a href="/dashboard" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: '#16a34a',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}>
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="users-screen">
      <div className="users-header">
        <div className="users-header__title">
          <FaUsers style={{ fontSize: '2rem', color: '#16a34a', marginRight: '1rem' }} />
          <div>
            <h1>User Management</h1>
            <p>Manage users in your organization</p>
          </div>
        </div>
        {user.role === 'admin' || user.role === 'super_admin' ? (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaPlus /> Add User
          </button>
        ) : null}
      </div>

      <div className="users-filters">
        <div className="search-box">
          <FaSearch style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="staff">Staff</option>
          <option value="user">Users</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p style={{ color: '#dc2626', fontSize: '1.1rem' }}>⚠️ {error}</p>
          <button onClick={fetchUsers} className="btn-secondary">Retry</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FaUsers style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3>No users found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="users-stats">
            <div className="stat-card">
              <div className="stat-card__value">{users.length}</div>
              <div className="stat-card__label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</div>
              <div className="stat-card__label">Admins</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{users.filter(u => u.role === 'staff').length}</div>
              <div className="stat-card__label">Staff</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{users.filter(u => u.role === 'user').length}</div>
              <div className="stat-card__label">Regular Users</div>
            </div>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {(user.role === 'admin' || user.role === 'super_admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="user-avatar">
                          {getRoleIcon(u.role)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.name || 'Unnamed User'}</div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                          <FaEnvelope style={{ color: '#64748b', fontSize: '0.85rem' }} />
                          <span>{u.email || 'N/A'}</span>
                        </div>
                        {u.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                            <FaPhone style={{ color: '#64748b', fontSize: '0.85rem' }} />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <FaCalendar style={{ fontSize: '0.85rem' }} />
                        <span>{formatDate(u.created_at || u.createdAt)}</span>
                      </div>
                    </td>
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="icon-btn"
                            title="Edit user"
                            style={{ color: '#2563eb' }}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-btn"
                            title="Delete user"
                            style={{ color: '#dc2626' }}
                            disabled={u.id === user.id}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
