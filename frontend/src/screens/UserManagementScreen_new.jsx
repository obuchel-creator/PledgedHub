import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, deleteUser, restoreUser } from '../services/api';

export default function UserManagementScreen() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('soft');
  const [cascade, setCascade] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getUsers({
        includeDeleted,
        search: searchTerm || undefined,
        limit: 100,
      });
      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [includeDeleted, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
    setDeleteType('soft');
    setCascade(false);
    setError('');
    setSuccess('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    setDeleteType('soft');
    setCascade(false);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteUser(selectedUser.id, {
        type: deleteType,
        cascade: cascade,
      });

      setSuccess(
        `User ${selectedUser.email} successfully ${deleteType === 'hard' ? 'permanently deleted' : 'deactivated'}`,
      );
      closeDeleteModal();
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (userId) => {
    setError('');
    setSuccess('');

    try {
      await restoreUser(userId);
      setSuccess('User restored successfully');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to restore user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const activeUsers = users.filter((u) => !u.deleted_at);
  const deletedUsers = users.filter((u) => u.deleted_at);
  const adminCount = users.filter((u) => u.role === 'admin' && !u.deleted_at).length;
  const staffCount = users.filter((u) => u.role === 'staff' && !u.deleted_at).length;
  const userCount = users.filter((u) => u.role === 'user' && !u.deleted_at).length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        paddingTop: '2rem',
        paddingBottom: '3rem',
      }}
    >
      <main className="page" style={{ maxWidth: '1400px' }}>
        <header
          className="page-header"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2.5rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <p
                className="page-header__eyebrow"
                style={{
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  marginBottom: '0.5rem',
                }}
              >
                👥 ADMIN PANEL
              </p>
              <h1
                id="users-title"
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: '#1a202c',
                }}
              >
                User Management
              </h1>
              <p style={{ margin: 0, color: '#4a5568', fontSize: '1.1rem', fontWeight: '500' }}>
                Manage system users, roles, and access permissions
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '0 1rem',
                  borderRight: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>
                  {users.length}
                </div>
                <div
                  style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}
                >
                  Total Users
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>
                  {activeUsers.length}
                </div>
                <div
                  style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}
                >
                  Active
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '2px solid #ef4444',
              cursor: 'pointer',
              transform: roleFilter === 'admin' ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
            onClick={() => setRoleFilter(roleFilter === 'admin' ? 'all' : 'admin')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                👑
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                  {adminCount}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                  Administrators
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '2px solid #3b82f6',
              cursor: 'pointer',
              transform: roleFilter === 'staff' ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
            onClick={() => setRoleFilter(roleFilter === 'staff' ? 'all' : 'staff')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                ⭐
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                  {staffCount}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                  Staff Members
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '2px solid #64748b',
              cursor: 'pointer',
              transform: roleFilter === 'user' ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
            onClick={() => setRoleFilter(roleFilter === 'user' ? 'all' : 'user')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                👤
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                  {userCount}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                  Regular Users
                </div>
              </div>
            </div>
          </div>

          {deletedUsers.length > 0 && (
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '2px solid #dc2626',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  🗑️
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                    {deletedUsers.length}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                    Deleted Users
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div
          className="card"
          style={{
            marginBottom: '2rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '1.5rem',
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                className="input"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '3rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: '700',
              }}
            >
              Search
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.75rem 1rem',
                background: includeDeleted ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                borderRadius: '12px',
                border: `2px solid ${includeDeleted ? '#dc2626' : '#e5e7eb'}`,
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Show deleted users</span>
            </label>
            {roleFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#1f2937',
                }}
              >
                ✕ Clear filter
              </button>
            )}
          </form>
        </div>

        {/* Messages */}
        {error && (
          <div
            className="alert alert--error"
            role="alert"
            style={{
              marginBottom: '1rem',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              fontWeight: '600',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            className="alert alert--success"
            role="status"
            style={{
              marginBottom: '1rem',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              fontWeight: '600',
            }}
          >
            ✅ {success}
          </div>
        )}

        {/* Users Table */}
        <div
          className="card"
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #f3f4f6' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#1f2937' }}>
              {roleFilter !== 'all'
                ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s`
                : 'All Users'}{' '}
              ({filteredUsers.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>No users found</div>
              <p style={{ margin: '0.5rem 0 0', color: '#9ca3af' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      User
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      OAuth
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Created
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        opacity: u.deleted_at ? 0.6 : 1,
                        background: index % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafbfc')
                      }
                    >
                      <td
                        style={{
                          padding: '1rem 1.5rem',
                          fontFamily: 'monospace',
                          color: '#6b7280',
                          fontWeight: '600',
                        }}
                      >
                        {u.id}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div>
                          <div
                            style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                          >
                            {u.username || u.name || 'No name'}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{u.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background:
                              u.role === 'admin'
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : u.role === 'staff'
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                  : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {u.role === 'admin' ? '👑 ' : u.role === 'staff' ? '⭐ ' : '👤 '}
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {u.oauth_provider ? (
                          <span
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#2563eb',
                              textTransform: 'capitalize',
                            }}
                          >
                            🔐 {u.oauth_provider}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          fontWeight: '500',
                        }}
                      >
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {u.deleted_at ? (
                          <span
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              color: 'white',
                              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                            }}
                          >
                            🗑️ Deleted
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                            }}
                          >
                            ✅ Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        {u.deleted_at ? (
                          <button
                            onClick={() => handleRestore(u.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '700',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                          >
                            🔄 Restore
                          </button>
                        ) : (
                          u.id !== user.id && (
                            <button
                              onClick={() => openDeleteModal(u)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '700',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                transition: 'transform 0.2s',
                              }}
                              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
                              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                            >
                              🗑️ Delete
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
            onClick={closeDeleteModal}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2.5rem',
                maxWidth: '550px',
                width: '100%',
                boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.3s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    border: '3px solid #fecaca',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                </div>
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#1f2937',
                  }}
                >
                  Delete User?
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: '#6b7280',
                    fontSize: '1.05rem',
                    lineHeight: '1.6',
                    fontWeight: '500',
                  }}
                >
                  You're about to delete{' '}
                  <strong style={{ color: '#1f2937' }}>{selectedUser.email}</strong>
                </p>
              </div>

              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '16px',
                  border: '2px solid #e5e7eb',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '1rem',
                      display: 'block',
                      color: '#1f2937',
                    }}
                  >
                    Choose deletion type:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1.25rem',
                        background: deleteType === 'soft' ? 'rgba(59, 130, 246, 0.08)' : 'white',
                        border: `2px solid ${deleteType === 'soft' ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="deleteType"
                        checked={deleteType === 'soft'}
                        onChange={() => setDeleteType('soft')}
                        style={{
                          marginTop: '0.25rem',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          Soft Delete (Deactivate)
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                          User account will be deactivated but data is preserved. Can be restored
                          later.
                        </div>
                      </div>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1.25rem',
                        background: deleteType === 'hard' ? 'rgba(239, 68, 68, 0.08)' : 'white',
                        border: `2px solid ${deleteType === 'hard' ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="deleteType"
                        checked={deleteType === 'hard'}
                        onChange={() => setDeleteType('hard')}
                        style={{
                          marginTop: '0.25rem',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          Permanent Delete
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                          User and their data will be permanently removed. This action cannot be
                          undone!
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {deleteType === 'hard' && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      cursor: 'pointer',
                      padding: '1.25rem',
                      background: cascade ? 'rgba(251, 146, 60, 0.08)' : 'white',
                      border: `2px solid ${cascade ? '#fb923c' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cascade}
                      onChange={(e) => setCascade(e.target.checked)}
                      style={{
                        marginTop: '0.25rem',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#ea580c', marginBottom: '0.25rem' }}>
                        ⚠️ Also delete user's pledges
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                        This will permanently remove all pledges created by this user. Use with
                        extreme caution!
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div
                  className="alert alert--error"
                  style={{
                    marginBottom: '1rem',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontWeight: '600',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  style={{
                    padding: '0.875rem 1.75rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    color: '#1f2937',
                    opacity: deleting ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => !deleting && (e.target.style.background = '#e5e7eb')}
                  onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{
                    padding: '0.875rem 1.75rem',
                    background: deleting
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    color: 'white',
                    boxShadow: deleting ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.4)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => !deleting && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
                >
                  {deleting
                    ? '⏳ Deleting...'
                    : `🗑️ ${deleteType === 'hard' ? 'Permanently Delete' : 'Deactivate'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
