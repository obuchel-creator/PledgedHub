import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getPledge,
  getPayments,
  deletePledge,
  updatePledge,
  sendPledgeReminder,
  sendCustomNotification,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import ShareButton from '../components/ShareButton';

function resolveId(props) {
  if (props && props.match && props.match.params && props.match.params.id) {
    return props.match.params.id;
  }
  if (props && props.id) {
    return props.id;
  }
  if (typeof window !== 'undefined') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  }
  return null;
}

export default function PledgeDetailScreen(props) {
  const [pledge, setPledge] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donating, setDonating] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationFeedback, setDonationFeedback] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    goal: '',
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: routeId } = useParams();
  const id = routeId || resolveId(props);

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '--';
    return `UGX ${num.toLocaleString('en-UG')}`;
  };

  const formatDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '--'
      : date.toLocaleDateString('en-UG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  };

  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      if (!id || id === 'undefined' || id === 'null') {
        console.error('❌ [PledgeDetailScreen] Invalid pledge ID:', id);
        setError('Unable to determine which pledge to show. The pledge ID is missing or invalid.');
        setLoading(false);
        return;
      }

      console.log('🔵 [PledgeDetailScreen] Fetching pledge with ID:', id);
      setLoading(true);
      setError('');

      try {
        const fetchedPledge = await getPledge(id);
        if (canceled) return;
        
        if (!fetchedPledge) {
          setError('Pledge not found. It may have been deleted or does not exist.');
          setPledge(null);
          setLoading(false);
          return;
        }
        
        console.log('✅ [PledgeDetailScreen] Pledge fetched successfully:', fetchedPledge);
        setPledge(fetchedPledge);

        let fetchedPayments = [];
        try {
          fetchedPayments = await getPayments(id);
        } catch (innerErr) {
          fetchedPayments = await getPayments({ pledgeId: id });
        }

        if (canceled) return;
        setPayments(Array.isArray(fetchedPayments) ? fetchedPayments : []);
      } catch (err) {
        if (canceled) return;
        console.error('❌ [PledgeDetailScreen] Error fetching pledge:', err);
        setError(err?.message || 'Unable to load this pledge right now. Please try again later.');
      } finally {
        if (canceled) return;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      canceled = true;
    };
  }, [id]);

  const totalRaised = useMemo(() => {
    if (pledge && (typeof pledge.amountRaised === 'number' || pledge?.amountRaised)) {
      const value = Number(pledge.amountRaised);
      if (Number.isFinite(value)) return value;
    }

    return payments.reduce((sum, payment) => {
      const amount = Number(payment?.amount);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
  }, [pledge, payments]);

  const handleDonateSubmit = async (event) => {
    event.preventDefault();
    setDonationFeedback({ type: '', text: '' });

    if (!id) {
      setDonationFeedback({ type: 'error', text: 'Unable to determine pledge id.' });
      return;
    }

    const amount = Number(donationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDonationFeedback({ type: 'error', text: 'Enter a valid donation amount.' });
      return;
    }

    setDonating(true);
    try {
      const api = await import('../services/api');
      if (typeof api.createPayment !== 'function') {
        throw new Error('createPayment is not available.');
      }

      await api.createPayment({
        pledgeId: id,
        amount,
        donorName: donorName.trim() || 'Anonymous',
      });

      setDonationFeedback({ type: 'success', text: 'Thank you! The donation has been recorded.' });
      setDonationAmount('');
      setDonorName('');

      try {
        const refreshed = await getPayments(id).catch(() => getPayments({ pledgeId: id }));
        setPayments(Array.isArray(refreshed) ? refreshed : []);
      } catch (refreshErr) {
        setDonationFeedback({
          type: 'error',
          text: refreshErr?.message || 'Donation saved but the recent list could not refresh.',
        });
      }
    } catch (err) {
      setDonationFeedback({ type: 'error', text: err?.message || 'Failed to record donation.' });
    } finally {
      setDonating(false);
    }
  };

  const handleDeletePledge = async () => {
    if (!id) {
      setError('Unable to determine pledge to delete.');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deletePledge(id);
      // Navigate back to dashboard after successful deletion
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to delete pledge. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      title: pledge?.title || '',
      description: pledge?.description || '',
      goal: pledge?.goal || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
      setError('Unable to determine pledge to edit.');
      return;
    }

    if (!editForm.title.trim()) {
      setError('Title is required.');
      return;
    }

    const goalNum = Number(editForm.goal);
    if (!Number.isFinite(goalNum) || goalNum <= 0) {
      setError('Please enter a valid goal amount.');
      return;
    }

    setEditing(true);
    setError('');

    try {
      await updatePledge(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        goal: goalNum,
      });

      // Refresh the pledge data
      const updated = await getPledge(id);
      setPledge(updated || null);
      setShowEditModal(false);
      setDonationFeedback({ type: 'success', text: 'Pledge updated successfully!' });
    } catch (err) {
      setError(err?.message || 'Failed to update pledge. Please try again.');
    } finally {
      setEditing(false);
    }
  };

  const handleSendReminder = async () => {
    if (!id) {
      setDonationFeedback({ type: 'error', text: 'Unable to determine pledge.' });
      return;
    }

    setSendingNotification(true);
    setDonationFeedback({ type: '', text: '' });

    try {
      const result = await sendPledgeReminder(id);
      setDonationFeedback({
        type: 'success',
        text: result.simulated
          ? 'Reminder simulated successfully (Twilio not configured)'
          : 'Reminder sent successfully!',
      });
    } catch (err) {
      setDonationFeedback({ type: 'error', text: err?.message || 'Failed to send reminder.' });
    } finally {
      setSendingNotification(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Refresh pledge and payments data
    try {
      const [updatedPledge, updatedPayments] = await Promise.all([
        getPledge(id),
        getPayments(id).catch(() => getPayments({ pledgeId: id })),
      ]);
      setPledge(updatedPledge || null);
      setPayments(Array.isArray(updatedPayments) ? updatedPayments : []);
      setDonationFeedback({ type: 'success', text: 'Payment recorded successfully!' });
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!id) {
      setDonationFeedback({ type: 'error', text: 'Unable to determine pledge.' });
      return;
    }

    if (!customMessage.trim()) {
      setDonationFeedback({ type: 'error', text: 'Please enter a message.' });
      return;
    }

    setSendingNotification(true);
    setDonationFeedback({ type: '', text: '' });

    try {
      const result = await sendCustomNotification(id, customMessage.trim());
      setShowNotificationModal(false);
      setCustomMessage('');
      setDonationFeedback({
        type: 'success',
        text: result.simulated
          ? 'Message simulated successfully (Twilio not configured)'
          : 'Message sent successfully!',
      });
    } catch (err) {
      setDonationFeedback({ type: 'error', text: err?.message || 'Failed to send message.' });
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <main className="page page--narrow" aria-busy="true">
        <div className="loading-state" role="status">
          Loading pledge...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page page--narrow">
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      </main>
    );
  }

  if (!pledge) {
    return (
      <main className="page page--narrow">
        <div className="empty-state" aria-live="polite">
          <p>Pledge not found.</p>
          <div className="empty-state__actions">
            <Link to="/dashboard" className="btn btn-primary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const goalValue = formatCurrency(pledge?.goal);
  const raisedValue = formatCurrency(totalRaised);
  const progress = (() => {
    const goalNum = Number(pledge?.goal);
    if (!Number.isFinite(goalNum) || goalNum <= 0) {
      return null;
    }
    return Math.min(100, Math.round((totalRaised / goalNum) * 100));
  })();

  return (
    <main className="page page--narrow" aria-labelledby="pledge-title" style={{ background: 'var(--bg-base)', backgroundImage: 'var(--gradient-1), var(--gradient-2), var(--gradient-3)', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
      {/* Custom Notification Modal */}
      {showNotificationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              margin: '2rem 0',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                color: '#3b82f6',
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              Send Custom Message
            </h3>
            <p
              style={{
                margin: '0 0 1.5rem 0',
                color: '#4a5568',
                fontSize: '0.95rem',
              }}
            >
              This message will be sent via SMS to the pledger's phone number.
            </p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter your message here..."
              disabled={sendingNotification}
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#1f2937',
                resize: 'vertical',
                marginBottom: '1.5rem',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowNotificationModal(false);
                  setCustomMessage('');
                }}
                disabled={sendingNotification}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'var(--surface)',
                  color: '#374151',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: sendingNotification ? 'not-allowed' : 'pointer',
                  opacity: sendingNotification ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCustomMessage}
                disabled={sendingNotification || !customMessage.trim()}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: sendingNotification || !customMessage.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: sendingNotification || !customMessage.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {sendingNotification ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              margin: '2rem 0',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                color: '#1e40af',
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              Edit Pledge
            </h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="edit-title"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#374151',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                  }}
                >
                  Title *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  disabled={editing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="edit-description"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#374151',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                  }}
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={editing}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="edit-goal"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#374151',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                  }}
                >
                  Goal Amount (USD) *
                </label>
                <input
                  id="edit-goal"
                  type="number"
                  value={editForm.goal}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                  disabled={editing}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editing}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: 'var(--surface)',
                    color: '#374151',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: editing ? 'not-allowed' : 'pointer',
                    opacity: editing ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: editing ? '#9ca3af' : '#1e40af',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: editing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                color: '#dc2626',
                fontSize: '1.5rem',
                fontWeight: '600',
              }}
            >
              Delete Pledge?
            </h3>
            <p
              style={{
                margin: '0 0 1.5rem 0',
                color: '#4a5568',
                lineHeight: '1.6',
              }}
            >
              Are you sure you want to delete "{pledge?.title}"? This action cannot be undone.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'var(--surface)',
                  color: '#374151',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePledge}
                disabled={deleting}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: deleting ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Pledge'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
        }}
      >
        <header className="page-header">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p className="page-header__eyebrow" style={{ color: 'var(--text-muted)' }}>
                Pledge
              </p>
              <h1 id="pledge-title" className="page-header__title" style={{ color: 'var(--text)' }}>
                {pledge?.title || pledge?.donor_name || 'Untitled Pledge'}
              </h1>
              <p
                className="page-header__subtitle"
                style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}
              >
                {pledge?.purpose ||
                  pledge?.message ||
                  'Track contributions and keep supporters informed.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <ShareButton
                contentType="pledge"
                contentData={{
                  amount: pledge?.amount,
                  campaignTitle: pledge?.campaign_title || pledge?.title,
                }}
                contentId={pledge?.id}
                shareUrl={`${window.location.origin}/share/pledge/${pledge?.id}`}
                style="button"
                size="medium"
              />
              {user && (
                <>
                  <button
                    onClick={handleEditClick}
                    disabled={editing || deleting}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: editing || deleting ? '#9ca3af' : '#1e40af',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: editing || deleting ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) =>
                      !(editing || deleting) && (e.target.style.background = '#1e3a8a')
                    }
                    onMouseLeave={(e) =>
                      !(editing || deleting) && (e.target.style.background = '#1e40af')
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting || editing}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: deleting || editing ? '#9ca3af' : '#dc2626',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: deleting || editing ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) =>
                      !(deleting || editing) && (e.target.style.background = '#b91c1c')
                    }
                    onMouseLeave={(e) =>
                      !(deleting || editing) && (e.target.style.background = '#dc2626')
                    }
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      <section
        className="card card--muted"
        aria-labelledby="pledge-summary-heading"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
        }}
      >
        <h2
          id="pledge-summary-heading"
          className="card__title"
          style={{
            color: 'var(--text)',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
          }}
        >
          Pledge Details
        </h2>

        {/* Main Pledge Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            <p
              style={{
                margin: '0 0 0.5rem 0',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              💰 Pledged Amount
            </p>
            <p
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '1.75rem',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {formatCurrency(pledge?.amount)}
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p
              style={{
                margin: '0 0 0.5rem 0',
                color: '#6b7280',
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              📊 Status
            </p>
            <p
              style={{
                margin: 0,
                color:
                  pledge?.status === 'paid'
                    ? '#10b981'
                    : pledge?.status === 'confirmed'
                      ? '#3b82f6'
                      : '#f59e0b',
                fontSize: '1.25rem',
                fontWeight: '700',
                textTransform: 'capitalize',
              }}
            >
              {pledge?.status || 'Pending'}
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p
              style={{
                margin: '0 0 0.5rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              📅 Collection Date
            </p>
            <p
              style={{
                margin: 0,
                color: 'var(--text)',
                fontSize: '1.1rem',
                fontWeight: '600',
              }}
            >
              {formatDate(pledge?.collection_date)}
            </p>
          </div>
        </div>

        {/* Purpose/Description */}
        {(pledge?.purpose || pledge?.message || pledge?.description) && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '10px',
              borderLeft: '4px solid #3b82f6',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <strong
                style={{
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Purpose:
              </strong>
              <br />
              {pledge?.purpose || pledge?.message || pledge?.description}
            </p>
          </div>
        )}

        {/* Donor Information Card */}
        <div
          style={{
            padding: '1.5rem',
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h3
            style={{
              margin: '0 0 1rem 0',
              color: 'var(--text)',
              fontSize: '1.1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            👤 Donor Information
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <p
              style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontWeight: '600', color: '#6b7280', minWidth: '80px' }}>Name:</span>
              <span style={{ fontWeight: '600' }}>{pledge?.donor_name || 'Anonymous'}</span>
            </p>
            {(pledge?.donor_email) && (
              <p
                style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '600', color: '#6b7280', minWidth: '80px' }}>
                  Email:
                </span>
                <span>{pledge.donor_email || pledge.donorEmail}</span>
              </p>
            )}
            {(pledge?.donor_phone || pledge?.donorPhone) && (
              <p
                style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '600', color: '#6b7280', minWidth: '80px' }}>
                  Phone:
                </span>
                <span>{pledge.donor_phone || pledge.donorPhone}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Notification Actions - Only show if user is logged in */}
      {user && (
        <section
          className="card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px -4px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.05)',
          }}
        >
          <h2 className="card__title" style={{ color: 'var(--text)' }}>
            📲 Send Notifications
          </h2>
          <p className="card__subtitle">
            Remind the pledger about their commitment or send a custom message via SMS.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleSendReminder}
              disabled={sendingNotification}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: sendingNotification
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: sendingNotification ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: sendingNotification ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) =>
                !sendingNotification && (e.target.style.transform = 'translateY(-2px)')
              }
              onMouseLeave={(e) =>
                !sendingNotification && (e.target.style.transform = 'translateY(0)')
              }
            >
              <span>🔔</span>
              {sendingNotification ? 'Sending...' : 'Send Reminder'}
            </button>

            <button
              onClick={() => setShowNotificationModal(true)}
              disabled={sendingNotification}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: '2px solid #3b82f6',
                background: 'var(--surface)',
                color: '#3b82f6',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: sendingNotification ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: sendingNotification ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => !sendingNotification && (e.target.style.background = '#eff6ff')}
              onMouseLeave={(e) => !sendingNotification && (e.target.style.background = 'white')}
            >
              <span>✉️</span>
              Custom Message
            </button>
          </div>

          {donationFeedback.text && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: donationFeedback.type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `1px solid ${donationFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: donationFeedback.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              {donationFeedback.text}
            </div>
          )}

          <p
            style={{
              marginTop: '1rem',
              fontSize: '0.85rem',
              color: '#64748b',
              fontStyle: 'italic',
            }}
          >
            💡 SMS will be sent to the phone number provided in the pledge details.
          </p>
        </section>
      )}

      <section className="card" aria-labelledby="payments-heading">
        <h2 id="payments-heading" className="card__title">
          Payment History
        </h2>
        <p className="card__subtitle">Track payments received for this pledge.</p>

        {user && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowPaymentModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              💰 Record Payment
            </button>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="empty-state" aria-live="polite">
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <ul className="list list--divided" aria-live="polite">
            {payments.map((payment, index) => {
              const key = payment?.id || payment?._id || `${payment?.amount || 'amount'}-${index}`;
              const amount = formatCurrency(payment?.amount);
              const paymentDate = formatDate(payment?.payment_date || payment?.date || payment?.createdAt);
              const method = payment?.payment_method || payment?.method || 'Cash';
              const status = payment?.verification_status || payment?.status || 'Pending';
              const reference = payment?.reference_number || payment?.receipt_number || '';

              return (
                <li key={key} className="list-item">
                  <div className="list-item__meta">
                    <span className="list-item__title">
                      {amount} - {method}
                    </span>
                    <span className="list-item__subtitle">
                      {paymentDate}
                      {reference && ` • Ref: ${reference}`}
                    </span>
                    <span 
                      className="list-item__subtitle" 
                      style={{ 
                        color: status === 'verified' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b',
                        fontWeight: '600'
                      }}
                    >
                      Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {payment?.notes && (
                      <span className="section__body" style={{ fontSize: '0.92rem', marginTop: '0.5rem' }}>
                        {payment.notes}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showPaymentModal && (
        <PaymentModal
          pledge={pledge}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <footer className="section__body" style={{ marginTop: '2rem', color: 'var(--text-subtle)' }}>
        Goal and totals presented reflect the information returned by the backend API.
      </footer>
    </main>
  );
}


