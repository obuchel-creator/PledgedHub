import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function CollectionTrendsBar({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => `UGX ${Number(v).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="collected" fill="#4ade80" name="Collected" />
          <Bar dataKey="pledged" fill="#fbbf24" name="Pledged" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
