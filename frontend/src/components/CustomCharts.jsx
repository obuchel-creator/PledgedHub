import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export function CustomLineChart({ data, xKey, yKey, color = "#2563eb", ...props }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CustomAreaChart({ data, xKey, yKey, color = "#10b981", ...props }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey={yKey} stroke={color} fill={color+"33"} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CustomRadarChart({ data, categories, valueKey, color = "#fbbf24" }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={90}>
          <PolarGrid />
          <PolarAngleAxis dataKey={categories} />
          <PolarRadiusAxis />
          <Radar name="Value" dataKey={valueKey} stroke={color} fill={color+"33"} fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
