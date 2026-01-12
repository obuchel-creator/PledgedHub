import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, deleteUser, restoreUser, registerUser, superadminResetAdminPassword, getTwoFactorStatus, enableTwoFactor, disableTwoFactor } from '../services/api';
  // Admin Password Reset Modal State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  // 2FA Management State
  const [twoFactorStatus, setTwoFactorStatus] = useState({}); // { [userId]: { enabled: bool, loading: bool } }
  const [twoFactorError, setTwoFactorError] = useState({});
  const [twoFactorSuccess, setTwoFactorSuccess] = useState({});
  // Fetch 2FA status for all users (admin only)
  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin') && users.length > 0) {
      users.forEach(async (u) => {
        if (u.role === 'admin' || u.role === 'superadmin') {
          setTwoFactorStatus((prev) => ({ ...prev, [u.id]: { loading: true } }));
          try {
            const res = await getTwoFactorStatus(u.id);
            setTwoFactorStatus((prev) => ({ ...prev, [u.id]: { enabled: !!res.enabled, loading: false } }));
          } catch {
            setTwoFactorStatus((prev) => ({ ...prev, [u.id]: { enabled: false, loading: false } }));
          }
        }
      });
    }
  }, [users, user]);
  // Open Reset Password Modal
  const openResetPasswordModal = (adminUser) => {
    setResettingUser(adminUser);
    setShowResetPasswordModal(true);
    setNewAdminPassword('');
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setResettingUser(null);
    setNewAdminPassword('');
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  // Handle admin password reset
  const handleResetAdminPassword = async (e) => {
    e.preventDefault();
    setResetPasswordError('');
    setResetPasswordSuccess('');
    if (!resettingUser || !newAdminPassword || newAdminPassword.length < 8) {
      setResetPasswordError('Password must be at least 8 characters');
      return;
    }
    setResettingPassword(true);
    try {
      await superadminResetAdminPassword(resettingUser.id, newAdminPassword);
      setResetPasswordSuccess('Password reset successfully');
      setNewAdminPassword('');
      await loadUsers();
    } catch (err) {
      setResetPasswordError(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // 2FA enable/disable handlers
  const handleEnable2FA = async (adminUser) => {
    setTwoFactorError((prev) => ({ ...prev, [adminUser.id]: '' }));
    setTwoFactorSuccess((prev) => ({ ...prev, [adminUser.id]: '' }));
    setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { ...prev[adminUser.id], loading: true } }));
    try {
      // For demo: auto-enable (in real, would require code verification)
      await enableTwoFactor('000000', adminUser.id); // Placeholder code
      setTwoFactorSuccess((prev) => ({ ...prev, [adminUser.id]: '2FA enabled' }));
      setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { enabled: true, loading: false } }));
    } catch (err) {
      setTwoFactorError((prev) => ({ ...prev, [adminUser.id]: err.message || 'Failed to enable 2FA' }));
      setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { enabled: false, loading: false } }));
    }
  };
  const handleDisable2FA = async (adminUser) => {
    setTwoFactorError((prev) => ({ ...prev, [adminUser.id]: '' }));
    setTwoFactorSuccess((prev) => ({ ...prev, [adminUser.id]: '' }));
    setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { ...prev[adminUser.id], loading: true } }));
    try {
      await disableTwoFactor(adminUser.id);
      setTwoFactorSuccess((prev) => ({ ...prev, [adminUser.id]: '2FA disabled' }));
      setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { enabled: false, loading: false } }));
    } catch (err) {
      setTwoFactorError((prev) => ({ ...prev, [adminUser.id]: err.message || 'Failed to disable 2FA' }));
      setTwoFactorStatus((prev) => ({ ...prev, [adminUser.id]: { enabled: true, loading: false } }));
    }
  };

console.log('[DEBUG] UserManagementScreen mounted');
// The following useEffect should be inside the component, not at the top level

export default function UserManagementScreen() {
  const { user, token } = useAuth();
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

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'donor', // Default role for normal users making pledges
  });
  const [addingUser, setAddingUser] = useState(false);

  // Edit Role Modal State (for superadmin only)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Check admin access
  useEffect(() => {
    console.log('[UserManagement] Auth check:', { token: !!token, user, role: user?.role });
    if (!token || !user) {
      console.log('[UserManagement] Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // Allow both superadmin and admin to access user management
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      console.log('[UserManagement] Insufficient role, redirecting to dashboard. Role:', user?.role);
      navigate('/dashboard');
      return;
    }
    console.log('[UserManagement] Access granted');
  }, [token, user, navigate]);

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
      // Debug log: print users received from API
      console.log('[DEBUG] Users received from API:', response.users);
      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Phone is required, must be in international format
    if (!newUser.name || !newUser.phone || !newUser.password) {
      setError('Name, phone number, and password are required');
      return;
    }
    // Validate phone format (basic international)
    const phonePattern = /^\+?[1-9]\d{7,14}$/;
    const cleanPhone = newUser.phone.replace(/[\s\-()]/g, '');
    if (!phonePattern.test(cleanPhone)) {
      setError('Invalid phone number format. Use international format (e.g., +256700000000)');
      return;
    }
    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setAddingUser(true);

    try {
      await registerUser({
        name: newUser.name,
        phone: newUser.phone, // REQUIRED
        email: newUser.email || null, // OPTIONAL
        password: newUser.password,
        role: newUser.role,
      });

      const identifier = newUser.email || newUser.phone;
      setSuccess(`User ${identifier} added successfully with ${newUser.role} role`);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'donor' });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditRole = (userToEdit) => {
    setEditingUser(userToEdit);
    setNewRole(userToEdit.role);
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingUser || !newRole) {
      setError('Invalid role update request');
      return;
    }

    if (newRole === editingUser.role) {
      setError('Please select a different role');
      return;
    }

    setUpdatingRole(true);

    try {
      // Call API to update user role
      const response = await fetch(`/api/users/${editingUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      const identifier = editingUser.email || editingUser.phone_number;
      setSuccess(`Successfully promoted ${identifier} to ${newRole}!`);
      setShowEditRoleModal(false);
      setEditingUser(null);
      setNewRole('');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Allow both superadmin and admin to view this page
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  const activeUsers = users.filter((u) => !u.deleted_at);
  const deletedUsers = users.filter((u) => u.deleted_at);
  const superadminCount = users.filter((u) => u.role === 'superadmin' && !u.deleted_at).length;
  const adminCount = users.filter((u) => u.role === 'admin' && !u.deleted_at).length;
  const staffCount = users.filter((u) => u.role === 'staff' && !u.deleted_at).length;
  const donorCount = users.filter((u) => u.role === 'donor' && !u.deleted_at).length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
                  color: '#2563eb',
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowAddUserModal(true)}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                <span style={{ fontSize: '1.25rem' }}>➕</span>
                Add New User
              </button>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
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
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: '600',
                    }}
                  >
                    Total Users
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 1rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white' }}>
                    {activeUsers.length}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: '600',
                    }}
                  >
                    Active
                  </div>
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
          {superadminCount > 0 && (
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '2px solid #2563eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937' }}>
                    {superadminCount}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                    Super Admins
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '2px solid #ef4444',
            }}
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
            }}
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
            }}
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
                  {donorCount}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
                  Donors (Pledgers)
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
        <div className="card" style={{ marginBottom: '2rem' }}>
          <form
            onSubmit={handleSearch}
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input
              type="text"
              className="input"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1', minWidth: '250px' }}
            />
            <button type="submit" className="btn btn-primary">
              🔍 Search
            </button>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              <span>Show deleted users</span>
            </label>
          </form>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert--success" role="status">
            {success}
          </div>
        )}

        {/* Users Table */}
        <div className="card">
          <h2 className="card__title">All Users ({users.length})</h2>

          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>OAuth</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        opacity: u.deleted_at ? 0.5 : 1,
                      }}
                    >
                      <td style={{ padding: '1rem' }}>{u.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>{u.username || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            background:
                              u.role === 'admin'
                                ? '#ef4444'
                                : u.role === 'staff'
                                  ? '#3b82f6'
                                  : '#64748b',
                            color: 'white',
                          }}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.oauth_provider ? (
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#60a5fa',
                            }}
                          >
                            {u.oauth_provider}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {formatDate(u.created_at)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.deleted_at ? (
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              background: '#dc2626',
                              color: 'white',
                            }}
                          >
                            Deleted
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              background: '#10b981',
                              color: 'white',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {u.deleted_at ? (
                          <button
                            onClick={() => handleRestore(u.id)}
                            className="btn btn-ghost btn--small"
                            style={{ color: '#10b981' }}
                          >
                            🔄 Restore
                          </button>
                        ) : (
                          <div
                            style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}
                          >
                            {/* Only superadmin can change roles */}
                            {user.role === 'superadmin' && u.id !== user.id && (
                              <button
                                onClick={() => handleEditRole(u)}
                                className="btn btn-ghost btn--small"
                                style={{ color: '#2563eb' }}
                                title="Change user role"
                              >
                                ⚡ Edit Role
                              </button>
                            )}
                            {u.id !== user.id && (
                              <button
                                onClick={() => openDeleteModal(u)}
                                className="btn btn-ghost btn--small"
                                style={{ color: '#ef4444' }}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
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
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={closeDeleteModal}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '20px',
                padding: '2.5rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                </div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: '700' }}>
              <div
                    }}
                        cursor: 'pointer',
                        {u.deleted_at ? (
                          <button
                            onClick={() => handleRestore(u.id)}
                            className="btn btn-ghost btn--small"
                            style={{ color: '#10b981' }}
                          >
                            🔄 Restore
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Only superadmin can change roles */}
                            {user.role === 'superadmin' && u.id !== user.id && (
                              <button
                                onClick={() => handleEditRole(u)}
                                className="btn btn-ghost btn--small"
                                style={{ color: '#2563eb' }}
                                title="Change user role"
                              >
                                ⚡ Edit Role
                              </button>
                            )}
                            {/* Superadmin: Reset admin password */}
                            {user.role === 'superadmin' && (u.role === 'admin' || u.role === 'superadmin') && u.id !== user.id && (
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                className="btn btn-ghost btn--small"
                                style={{ color: '#f59e42' }}
                                title="Reset admin password"
                              >
                                🔑 Reset Password
                              </button>
                            )}
                            {/* 2FA Management (admin/superadmin only) */}
                            {(u.role === 'admin' || u.role === 'superadmin') && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                {twoFactorStatus[u.id]?.loading ? (
                                  <span style={{ color: '#2563eb', fontSize: '0.9em' }}>Checking 2FA...</span>
                                ) : twoFactorStatus[u.id]?.enabled ? (
                                  <>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>2FA On</span>
                                    <button
                                      onClick={() => handleDisable2FA(u)}
                                      className="btn btn-ghost btn--small"
                                      style={{ color: '#ef4444' }}
                                      title="Disable 2FA"
                                      disabled={twoFactorStatus[u.id]?.loading}
                                    >
                                      ❌ Disable 2FA
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>2FA Off</span>
                                    <button
                                      onClick={() => handleEnable2FA(u)}
                                      className="btn btn-ghost btn--small"
                                      style={{ color: '#2563eb' }}
                                      title="Enable 2FA"
                                      disabled={twoFactorStatus[u.id]?.loading}
                                    >
                                      ✅ Enable 2FA
                                    </button>
                                  </>
                                )}
                                {twoFactorError[u.id] && <span style={{ color: '#ef4444', fontSize: '0.85em' }}>{twoFactorError[u.id]}</span>}
                                {twoFactorSuccess[u.id] && <span style={{ color: '#10b981', fontSize: '0.85em' }}>{twoFactorSuccess[u.id]}</span>}
                              </div>
                            )}
                            {u.id !== user.id && (
                              <button
                                onClick={() => openDeleteModal(u)}
                                className="btn btn-ghost btn--small"
                                style={{ color: '#ef4444' }}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                              {/* Reset Admin Password Modal (Superadmin Only) */}
                              {showResetPasswordModal && resettingUser && (
                                <div
                                  style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000,
                                    padding: '1rem',
                                  }}
                                  onClick={closeResetPasswordModal}
                                >
                                  <div
                                    style={{
                                      background: 'white',
                                      borderRadius: '24px',
                                      maxWidth: '400px',
                                      width: '100%',
                                      padding: '2rem',
                                      boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
                                      animation: 'slideUp 0.3s ease-out',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <h3 style={{ marginBottom: '1rem', color: '#1f2937', fontWeight: 700 }}>
                                      🔑 Reset Admin Password
                                    </h3>
                                    <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                                      Set a new password for <strong>{resettingUser.email || resettingUser.phone}</strong>
                                    </p>
                                    <form onSubmit={handleResetAdminPassword}>
                                      <input
                                        type="password"
                                        value={newAdminPassword}
                                        onChange={(e) => setNewAdminPassword(e.target.value)}
                                        placeholder="New password (min 8 chars)"
                                        minLength={8}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}
                                        disabled={resettingPassword}
                                      />
                                      {resetPasswordError && <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{resetPasswordError}</div>}
                                      {resetPasswordSuccess && <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>{resetPasswordSuccess}</div>}
                                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button
                                          type="button"
                                          onClick={closeResetPasswordModal}
                                          disabled={resettingPassword}
                                          style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#1f2937', cursor: 'pointer' }}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={resettingPassword || newAdminPassword.length < 8}
                                          style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                          {resettingPassword ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              )}
                        borderRadius: '10px',
                      }}
                    >
                      <input
                        type="radio"
                        name="deleteType"
                        checked={deleteType === 'soft'}
                        onChange={() => setDeleteType('soft')}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>Soft Delete (Deactivate)</div>
                        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                          User can be restored later
                        </div>
                      </div>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background:
                          deleteType === 'hard' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        border: `2px solid ${deleteType === 'hard' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '10px',
                      }}
                    >
                      <input
                        type="radio"
                        name="deleteType"
                        checked={deleteType === 'hard'}
                        onChange={() => setDeleteType('hard')}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>Permanent Delete</div>
                        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                          Cannot be undone
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {deleteType === 'hard' && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      padding: '1rem',
                      background: 'rgba(251, 146, 60, 0.1)',
                      border: '2px solid rgba(251, 146, 60, 0.3)',
                      borderRadius: '10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cascade}
                      onChange={(e) => setCascade(e.target.checked)}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fb923c' }}>
                        Also delete user's pledges
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Warning: This will permanently remove all associated data
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {error && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                  {error}
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

        {/* Add User Modal */}
        {showAddUserModal && (
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
            onClick={() => setShowAddUserModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2.5rem',
                maxWidth: '550px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>➕</span>
                </div>
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#1f2937',
                  }}
                >
                  Add New User
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
                  Create a new user account and assign a role
                </p>
              </div>

              <form onSubmit={handleAddUser}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+256 700 000 000"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Required for SMS, WhatsApp notifications and account verification
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Email Address (optional)
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com (optional)"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Optional - for email notifications and account recovery
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    User Role *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background:
                          newUser.role === 'donor' ? 'rgba(100, 116, 139, 0.08)' : 'white',
                        border: `2px solid ${newUser.role === 'donor' ? '#64748b' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="donor"
                        checked={newUser.role === 'donor'}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          👤 Donor (Default)
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Standard access - can create and manage own pledges
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: newUser.role === 'staff' ? 'rgba(59, 130, 246, 0.08)' : 'white',
                        border: `2px solid ${newUser.role === 'staff' ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="staff"
                        checked={newUser.role === 'staff'}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          ⭐ Staff
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Extended access - can view analytics and manage notifications
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: newUser.role === 'admin' ? 'rgba(239, 68, 68, 0.08)' : 'white',
                        border: `2px solid ${newUser.role === 'admin' ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={newUser.role === 'admin'}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          👑 Administrator
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Full access - can manage users, campaigns, and all system settings
                        </div>
                      </div>
                    </label>

                    {/* Superadmin role option - only visible to superadmins */}
                    {user.role === 'superadmin' && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          cursor: 'pointer',
                          padding: '1rem',
                          background:
                            newUser.role === 'superadmin' ? 'rgba(37, 99, 235, 0.08)' : 'white',
                          border: `2px solid ${newUser.role === 'superadmin' ? '#2563eb' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="role"
                          value="superadmin"
                          checked={newUser.role === 'superadmin'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                          >
                            ⚡ Super Administrator
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Ultimate control - can manage admins and all other users
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontWeight: '600',
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false);
                      setNewUser({ name: '', email: '', phone: '', password: '', role: 'donor' });
                      setError('');
                    }}
                    disabled={addingUser}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: addingUser ? 'not-allowed' : 'pointer',
                      color: '#1f2937',
                      opacity: addingUser ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => !addingUser && (e.target.style.background = '#e5e7eb')}
                    onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingUser}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: addingUser
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: addingUser ? 'not-allowed' : 'pointer',
                      color: 'white',
                      boxShadow: addingUser ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      !addingUser && (e.target.style.transform = 'translateY(-2px)')
                    }
                    onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
                  >
                    {addingUser ? '⏳ Adding User...' : '✓ Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Role Modal (Superadmin Only) */}
        {showEditRoleModal && editingUser && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={() => {
              if (!updatingRole) {
                setShowEditRoleModal(false);
                setEditingUser(null);
                setNewRole('');
                setError('');
              }
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.5rem',
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
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>⚡</span>
                </div>
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#1f2937',
                  }}
                >
                  Change User Role
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
                  Promote or change role for {editingUser.email || editingUser.phone_number}
                </p>
              </div>

              <form onSubmit={handleUpdateRole}>
                <div style={{ marginBottom: '2rem' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Current Role: <span style={{ color: '#2563eb' }}>{editingUser.role}</span>
                  </label>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      fontSize: '0.95rem',
                    }}
                  >
                    Select New Role *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: newRole === 'donor' ? 'rgba(100, 116, 139, 0.08)' : 'white',
                        border: `2px solid ${newRole === 'donor' ? '#64748b' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="newRole"
                        value="donor"
                        checked={newRole === 'donor'}
                        onChange={(e) => setNewRole(e.target.value)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          👤 Donor
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Can create and manage own pledges
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: newRole === 'staff' ? 'rgba(59, 130, 246, 0.08)' : 'white',
                        border: `2px solid ${newRole === 'staff' ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="newRole"
                        value="staff"
                        checked={newRole === 'staff'}
                        onChange={(e) => setNewRole(e.target.value)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          ⭐ Staff
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Extended access - view analytics and manage notifications
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        padding: '1rem',
                        background: newRole === 'admin' ? 'rgba(239, 68, 68, 0.08)' : 'white',
                        border: `2px solid ${newRole === 'admin' ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="newRole"
                        value="admin"
                        checked={newRole === 'admin'}
                        onChange={(e) => setNewRole(e.target.value)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                        >
                          👑 Administrator
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Can manage users, campaigns, and system settings
                        </div>
                      </div>
                    </label>

                    {/* Superadmin role option - only visible to superadmins */}
                    {user.role === 'superadmin' && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          cursor: 'pointer',
                          padding: '1rem',
                          background:
                            newRole === 'superadmin' ? 'rgba(37, 99, 235, 0.08)' : 'white',
                          border: `2px solid ${newRole === 'superadmin' ? '#2563eb' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="newRole"
                          value="superadmin"
                          checked={newRole === 'superadmin'}
                          onChange={(e) => setNewRole(e.target.value)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}
                          >
                            ⚡ Super Administrator
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Ultimate control - can manage admins and all users
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontWeight: '600',
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRoleModal(false);
                      setEditingUser(null);
                      setNewRole('');
                      setError('');
                    }}
                    disabled={updatingRole}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: updatingRole ? 'not-allowed' : 'pointer',
                      color: '#1f2937',
                      opacity: updatingRole ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => !updatingRole && (e.target.style.background = '#e5e7eb')}
                    onMouseLeave={(e) => (e.target.style.background = '#f3f4f6')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingRole}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: updatingRole
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: updatingRole ? 'not-allowed' : 'pointer',
                      color: 'white',
                      boxShadow: updatingRole ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.4)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      !updatingRole && (e.target.style.transform = 'translateY(-2px)')
                    }
                    onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
                  >
                    {updatingRole ? '⏳ Updating...' : '⚡ Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


