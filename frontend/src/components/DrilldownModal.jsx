import React from 'react';

export default function DrilldownModal({ open, onClose, title, rows, columns }) {
  if (!open) return null;
  return (
    <div className="drilldown-modal-overlay">
      <div className="drilldown-modal">
        <div className="drilldown-modal-header">
          <h3>{title}</h3>
          <button className="btn btn-secondary" onClick={onClose}>&times;</button>
        </div>
        <div className="drilldown-modal-body">
          <table className="drilldown-table">
            <thead>
              <tr>
                {columns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => <td key={col}>{row[col]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .drilldown-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.25); z-index: 1000; display: flex; align-items: center; justify-content: center;
        }
        .drilldown-modal {
          background: #fff; border-radius: 8px; max-width: 90vw; max-height: 80vh; overflow: auto; box-shadow: 0 4px 32px #0002; padding: 2rem; min-width: 400px;
        }
        .drilldown-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .drilldown-modal-body { max-height: 60vh; overflow: auto; }
        .drilldown-table { width: 100%; border-collapse: collapse; }
        .drilldown-table th, .drilldown-table td { border: 1px solid #eee; padding: 0.5rem 0.75rem; }
        .drilldown-table th { background: #f5f5f5; }
      `}</style>
    </div>
  );
}
