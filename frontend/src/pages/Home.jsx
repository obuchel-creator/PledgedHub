// ...existing code...
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPledges } from '../services/api';

export default function Home() {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPledges();
        if (!mounted) return;
        // data may be an array or an object { pledges: [] }
        setPledges(Array.isArray(data) ? data.slice(0, 5) : (data.pledges || []).slice(0, 5));
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load pledges');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main
      style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 900, margin: '0 auto' }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Welcome to PledgeHub</h1>
        <p style={{ color: '#666' }}>
          Support causes, create pledges and track contributions. Quick, simple and open-source.
        </p>
        <div style={{ marginTop: 12 }}>
          <Link
            to="/dashboard"
            style={{
              marginRight: 12,
              textDecoration: 'none',
              color: '#fff',
              background: '#0070f3',
              padding: '8px 12px',
              borderRadius: 6,
            }}
          >
            View Dashboard
          </Link>
          <Link to="/create" style={{ textDecoration: 'none', color: '#0070f3' }}>
            Create a Pledge
          </Link>
        </div>
      </header>

      <section>
        <h2>Recent pledges</h2>

        {loading && <p>Loading pledges…</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

        {!loading && !error && pledges.length === 0 && (
          <p>No pledges yet — be the first to create one.</p>
        )}

        {!loading && !error && pledges.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pledges.map((p) => (
              <li
                key={p.id || JSON.stringify(p)}
                style={{ padding: 12, borderBottom: '1px solid #eee' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong style={{ display: 'block' }}>
                      {p.title || p.name || 'Untitled pledge'}
                    </strong>
                    <small style={{ color: '#555' }}>{p.description || ''}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>
                      {typeof p.amount !== 'undefined' ? `$${p.amount}` : 'Amount N/A'}
                    </div>
                    {p.goal ? (
                      <div style={{ color: '#666', fontSize: 12 }}>goal: ${p.goal}</div>
                    ) : null}
                    <div style={{ marginTop: 6 }}>
                      <Link to={`/pledges/${p.id}`} style={{ marginRight: 8 }}>
                        View
                      </Link>
                      <Link to={`/pledges/${p.id}#donate`}>Donate</Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
// ...existing code...

