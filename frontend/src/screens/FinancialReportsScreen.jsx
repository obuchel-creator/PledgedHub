import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import Logo from '../components/Logo';

export default function FinancialReportsScreen() {
  const [reportType, setReportType] = useState('balance-sheet');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/accounting/reports/${reportType}`);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load report');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [reportType]);

  return (
    <div className="financial-reports-bg">
      <Logo size="large" showText={false} />
      <h2>Financial Reports</h2>
      <div>
        <label>Report Type</label>
        <select value={reportType} onChange={e => setReportType(e.target.value)}>
          <option value="balance-sheet">Balance Sheet</option>
          <option value="income-statement">Income Statement</option>
          <option value="cash-flow">Cash Flow</option>
          <option value="trial-balance">Trial Balance</option>
        </select>
      </div>
      {loading && <div>Loading report...</div>}
      {error && <div className="error-message">{error}</div>}
      {data && (
        <div className="report-data">
          {/* Render report data as needed */}
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
