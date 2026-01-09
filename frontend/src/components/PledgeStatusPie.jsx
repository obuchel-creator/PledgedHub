import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function PledgeStatusPie({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const COLORS = ['#4ade80', '#fbbf24', '#ef4444', '#6366f1', '#a3e635'];
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
