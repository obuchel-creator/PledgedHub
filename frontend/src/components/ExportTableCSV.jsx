import React from 'react';
import { CSVLink } from 'react-csv';

export default function ExportTableCSV({ data, filename = 'export.csv', label = 'Export CSV', className = '' }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return (
    <CSVLink data={data} filename={filename} className={className} style={{
      display: 'inline-block',
      background: '#fbbf24',
      color: '#0f172a',
      fontWeight: 700,
      borderRadius: '8px',
      padding: '0.5rem 1.25rem',
      textDecoration: 'none',
      margin: '0.5rem 0',
      fontSize: '1rem',
      boxShadow: '0 2px 8px #fbbf2422',
      letterSpacing: '0.5px',
      transition: 'background 0.2s',
    }}>
      {label}
    </CSVLink>
  );
}
