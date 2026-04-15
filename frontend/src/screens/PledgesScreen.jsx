import React, { useState, useEffect } from 'react';
import { getPledges } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './PledgesScreen.css';

export default function PledgesScreen() {
  const [pledges, setPledges] = useState([]);
  const [filteredPledges, setFilteredPledges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const navigate = useNavigate();

  useEffect(() => {
    loadPledges();
  }, []);

  useEffect(() => {
    filterAndSortPledges();
  }, [pledges, searchTerm, statusFilter, sortBy]);

  const loadPledges = async () => {
    setLoading(true);
    try {
      console.log('🔵 [PLEDGES SCREEN] Calling getPledges API...');
      const result = await getPledges();
      console.log('🔵 [PLEDGES SCREEN] API Result:', result);
      
      // Accept both { data: [...] } and { data: { pledges: [...] } } and { pledges: [...] }
      let pledgesArr = [];
      if (result?.success) {
        if (Array.isArray(result.data)) {
          pledgesArr = result.data;
        } else if (Array.isArray(result.data?.pledges)) {
          pledgesArr = result.data.pledges;
        } else if (Array.isArray(result.pledges)) {
          pledgesArr = result.pledges;
        }
      }
      console.log('🔵 [PLEDGES SCREEN] Extracted pledges array:', pledgesArr);
      console.log('🔵 [PLEDGES SCREEN] Number of pledges:', pledgesArr.length);
      setPledges(pledgesArr);
    } catch (err) {
      console.error('❌ [PLEDGES SCREEN] Failed to load pledges:', err);
      setPledges([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPledges = () => {
    let filtered = [...pledges];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search by donor name or email
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p => p.donor_name?.toLowerCase().includes(term) ||
             p.donor_email?.toLowerCase().includes(term) ||
             p.purpose?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'date-desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name':
          return a.donor_name?.localeCompare(b.donor_name);
        default:
          return 0;
      }
    });

    setFilteredPledges(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'partial':
        return 'status-partial';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-UG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  };

  const handleRefresh = () => {
    loadPledges();
  };



  return (
    <div className="pledges-container">
      <div className="pledges-header">
        <h1>📋 Pledges Management</h1>
        <p>Track and manage all pledge payments and statuses</p>
      </div>

      <div className="pledges-controls">
        <div className="pledges-search">
          <input
            type="text"
            placeholder="Search by donor name, email, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="pledges-filter">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({pledges.length})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            ✓ Paid ({pledges.filter(p => p.status === 'paid').length})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            ⏳ Pending ({pledges.filter(p => p.status === 'pending').length})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'partial' ? 'active' : ''}`}
            onClick={() => setStatusFilter('partial')}
          >
            ⚡ Partial ({pledges.filter(p => p.status === 'partial').length})
          </button>
        </div>
      </div>

      <div className="pledges-content">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#252525',
                border: '1px solid #333333',
                borderRadius: '8px',
                color: '#d4d4d4',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '10px 15px',
                background: viewMode === 'table' ? '#FCD116' : '#252525',
                color: viewMode === 'table' ? '#0f0f0f' : '#d4d4d4',
                border: '1px solid #333333',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Table
            </button>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '10px 15px',
                background: viewMode === 'card' ? '#FCD116' : '#252525',
                color: viewMode === 'card' ? '#0f0f0f' : '#d4d4d4',
                border: '1px solid #333333',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              🃏 Cards
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`refresh-btn ${loading ? 'spinning' : ''}`}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {filteredPledges.length === 0 ? (
          <div className="pledges-empty">
            <div className="pledges-empty-icon">📭</div>
            <div className="pledges-empty-title">No Pledges Found</div>
            <div className="pledges-empty-text">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No pledges have been created yet.'}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="pledges-table-wrapper">
            <table className="pledges-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Collection Date</th>
                  <th>Last Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPledges.map((pledge) => (
                  <tr key={pledge.id}>
                    <td>
                      <span className="pledge-id">#{pledge.id}</span> {pledge.donor_name}
                    </td>
                    <td><span className="pledge-amount">{formatCurrency(pledge.amount)}</span></td>
                    <td>{pledge.purpose || '-'}</td>
                    <td>
                      <span className={`pledge-status ${getStatusColor(pledge.status)}`}>
                        {pledge.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(pledge.collection_date)}</td>
                    <td>
                      {pledge.last_payment_date ? (
                        <span style={{ fontSize: '13px', color: '#10b981' }}>
                          {formatDateTime(pledge.last_payment_date)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="pledge-actions">
                        <button 
                          className="action-btn"
                          onClick={() => navigate(`/pledges/${pledge.id}`)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => {
                            window.open(`/share/pledge/${pledge.id}`, '_blank');
                          }}
                        >
                          Share
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pledges-grid">
            {filteredPledges.map((pledge) => (
              <div className="pledge-card" key={pledge.id}>
                <div className="pledge-card-header">
                  <span className="pledge-card-id">#{pledge.id}</span>
                  <span className={`pledge-card-status ${getStatusColor(pledge.status)}`}>
                    {pledge.status}
                  </span>
                </div>

                <div className="pledge-card-donor">
                  <div className="pledge-card-label">Donor Name</div>
                  <div className="pledge-card-value">{pledge.donor_name}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div className="pledge-card-label">Email</div>
                  <div className="pledge-card-value" style={{ fontSize: '13px' }}>
                    {pledge.donor_email}
                  </div>
                </div>

                <div className="pledge-card-amount">
                  {formatCurrency(pledge.amount)}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div className="pledge-card-label">Purpose</div>
                  <div className="pledge-card-value" style={{ fontSize: '13px' }}>
                    {pledge.purpose || 'General Pledge'}
                  </div>
                </div>

                <div className="pledge-card-date">
                  📅 Due: {formatDate(pledge.collection_date)}
                </div>

                {pledge.last_payment_date && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="pledge-card-label" style={{ color: '#10b981', marginBottom: '4px' }}>💰 Last Payment</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                      {formatDateTime(pledge.last_payment_date)}
                    </div>
                  </div>
                )}

                <div className="pledge-card-actions">
                  <button 
                    className="card-action-btn"
                    onClick={() => navigate(`/pledges/${pledge.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="card-action-btn"
                    onClick={() => {
                      window.open(`/share/pledge/${pledge.id}`, '_blank');
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center', color: '#808080', fontSize: '13px' }}>
          Showing {filteredPledges.length} of {pledges.length} pledges
        </div>
      </div>
    </div>
  );
}


