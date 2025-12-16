
import React, { useEffect, useState } from 'react';
import { getViteEnv } from '../utils/getViteEnv';

export default function AdminFeedbackScreen() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const API_URL = getViteEnv().API_URL || 'http://localhost:5001/api';
    fetch(
      `${API_URL}/feedback?page=${page}&pageSize=${pageSize}`,
      {
        credentials: 'include',
        headers: { Authorization: localStorage.getItem('token') },
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFeedbacks(data.data);
        } else {
          setError(data.error || 'Failed to fetch feedback');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, [page]);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
      }}
    >
      <h2
        style={{
          color: '#2563eb',
          fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        Feedback Submissions
      </h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: '#b91c1c', fontWeight: 500 }}>{error}</div>
      ) : feedbacks.length === 0 ? (
        <div>No feedback found.</div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Intuit Sans, Segoe UI, Arial, sans-serif',
          }}
        >
          <thead>
            <tr style={{ background: '#f1f5fb' }}>
              <th
                style={{ padding: '0.7rem', textAlign: 'left', color: '#2563eb', fontWeight: 500 }}
              >
                Date
              </th>
              <th
                style={{ padding: '0.7rem', textAlign: 'left', color: '#2563eb', fontWeight: 500 }}
              >
                Message
              </th>
              <th
                style={{ padding: '0.7rem', textAlign: 'left', color: '#2563eb', fontWeight: 500 }}
              >
                User Agent
              </th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb) => (
              <tr key={fb.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.7rem', fontSize: '0.98rem', color: '#334155' }}>
                  {new Date(fb.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '0.7rem', fontSize: '1rem', color: '#0f172a' }}>
                  {fb.message}
                </td>
                <td style={{ padding: '0.7rem', fontSize: '0.95rem', color: '#64748b' }}>
                  {fb.user_agent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.6rem 1.2rem',
            fontWeight: 500,
            cursor: page === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <span style={{ fontWeight: 500, color: '#2563eb' }}>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.6rem 1.2rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
