import React, { useEffect, useState } from 'react';
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '../services/api';

export default function PledgesAdminScreen() {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPledges();
  }, []);

  async function loadPledges() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/pledges?includeDeleted=true');
      setPledges(res.pledges || []);
    } catch (err) {
      setError(err.message || 'Failed to load pledges');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id) {
    setError('');
    setSuccess('');
    try {
      await postWithAuth(`/api/admin/pledges/restore/${id}`);
      setSuccess('Pledge restored');
      await loadPledges();
    } catch (err) {
      setError(err.message || 'Restore failed');
    }
  }

  async function handleDelete(id) {
    setError('');
    setSuccess('');
    if (!window.confirm('Permanently delete this pledge? This cannot be undone.')) return;
    try {
      await deleteWithAuth(`/api/admin/pledges/delete/${id}`);
      setSuccess('Pledge permanently deleted');
      await loadPledges();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <div className="admin-pledges-screen" style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 16 }}>
      <h1>Admin: Restore or Delete Pledges</h1>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
      {loading ? (
        <div>Loading pledges...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th>ID</th>
              <th>Donor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pledges.map(p => (
              <tr key={p.id} style={{ opacity: p.deleted ? 0.6 : 1 }}>
                <td>{p.id}</td>
                <td>{p.donor_name || p.donorName}</td>
                <td>{p.amount}</td>
                <td>{p.deleted ? 'Deleted' : 'Active'}</td>
                <td>
                  {p.deleted ? (
                    <button onClick={() => handleRestore(p.id)} style={{ marginRight: 8 }}>Restore</button>
                  ) : null}
                  {p.deleted ? (
                    <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>Delete Permanently</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
