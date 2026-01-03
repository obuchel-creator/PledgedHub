import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import Logo from '../components/Logo';

export default function PledgeListScreen() {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPledges() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/pledges');
        console.log('API Response:', res);
        if (res.success) {
          // API returns { success: true, data: [...pledges] } or { data: { pledges: [...] } }
          const pledgeData = Array.isArray(res.pledges)
            ? res.pledges
            : Array.isArray(res.data)
              ? res.data
              : Array.isArray(res.data?.pledges)
                ? res.data.pledges
                : [];
          console.log('Pledge data:', pledgeData);
          setPledges(pledgeData);
        } else {
          setError(res.error || 'Failed to load pledges');
        }
      } catch (err) {
        console.error('Error loading pledges:', err);
        setError('Server error');
      }
      setLoading(false);
    }
    loadPledges();
  }, []);

  return (
    <div className="pledge-list-bg">
      <Logo size="large" showText={false} />
      <h2>Pledge Management</h2>
      {loading && <div>Loading pledges...</div>}
      {error && <div className="error-message">{error}</div>}
      <Link to="/pledges/new" className="btn-primary">Add New Pledge</Link>
      {!loading && pledges.length === 0 && !error && (
        <div className="empty-state">
          <p>No pledges found. Create one to get started!</p>
        </div>
      )}
      <ul className="pledge-list">
        {pledges.map(pledge => (
          <li key={pledge.id}>
            <Link to={`/pledges/${pledge.id}`}>
              {(pledge.title || pledge.donor_name || 'Anonymous')} - UGX {pledge.amount?.toLocaleString() || 0}
              {pledge.purpose && ` - ${pledge.purpose}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
