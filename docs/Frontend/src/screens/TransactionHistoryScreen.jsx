import React, { useEffect, useState } from 'react';
import { getTransactionHistory } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';
import Toast from '../components/Toast';

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const result = await getTransactionHistory();
        if (result.success && Array.isArray(result.data)) {
          setTransactions(result.data);
        } else {
          setError(result.error || 'Failed to load transactions');
          setToast({ show: true, message: result.error || 'Failed to load transactions', type: 'error' });
        }
      } catch (err) {
        setError('Error loading transactions');
        setToast({ show: true, message: 'Error loading transactions', type: 'error' });
      }
      setLoading(false);
    }
    fetchTransactions();
  }, []);

  return (
    <div className="transaction-history-main bg-gradient-base min-h-screen flex justify-center items-center p-10">
      <div className="transaction-history-card bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl">
        <div className="transaction-history-header mb-8 pb-5 border-b-2 border-divider">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-base text-gray-600 m-0">View all your recent transactions and payments</p>
        </div>
        {loading && <LoadingIndicator label="Loading transactions..." />}
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
        {error && !loading && <div className="alert alert-error mb-4">{error}</div>}
        {!loading && transactions.length === 0 && !error && (
          <div className="empty-state text-center text-gray-500 py-8">No transactions found.</div>
        )}
        {!loading && transactions.length > 0 && (
          <table className="table-auto w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-divider last:border-b-0">
                  <td className="px-4 py-2 text-gray-800">{new Date(tx.date).toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-800">{tx.type}</td>
                  <td className="px-4 py-2 text-gray-800 font-bold">UGX {tx.amount.toLocaleString()}</td>
                  <td className={`px-4 py-2 font-semibold ${tx.status === 'success' ? 'text-green-600' : tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
