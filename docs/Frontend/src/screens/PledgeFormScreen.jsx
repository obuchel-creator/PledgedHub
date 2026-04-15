import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchWithAuth, postWithAuth, putWithAuth } from '../utils/api';
import { getCampaignDetails } from '../services/api';
import Logo from '../components/Logo';

export default function PledgeFormScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', amount: '', purpose: '', donor_name: '', collection_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState(null);
  const [campaignTitle, setCampaignTitle] = useState('');

  useEffect(() => {
    // Check for campaignId in query params
    const params = new URLSearchParams(location.search);
    const cid = params.get('campaignId');
    if (cid) {
      setCampaignId(cid);
      // Fetch campaign details for display
      getCampaignDetails(cid).then(res => {
        if (res && res.data && res.data.title) {
          setCampaignTitle(res.data.title);
        }
      });
    }
    if (isEdit) {
      async function loadPledge() {
        setLoading(true);
        try {
          const res = await fetchWithAuth(`/api/pledges/${id}`);
          if (res.success && res.data.pledge) {
            setForm({
              title: res.data.pledge.title || res.data.pledge.name,
              amount: res.data.pledge.amount,
              purpose: res.data.pledge.purpose,
              donor_name: res.data.pledge.donor_name,
              collection_date: res.data.pledge.collection_date
            });
          } else {
            setError(res.error || 'Failed to load pledge');
          }
        } catch (err) {
          setError('Server error');
        }
        setLoading(false);
      }
      loadPledge();
    }
  }, [id, isEdit, location.search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!form.title || !form.amount) {
        setError('Title and amount are required');
        setLoading(false);
        return;
      }
      const payload = {
        donor_name: form.donor_name,
        amount: form.amount,
        purpose: form.purpose,
        collection_date: form.collection_date,
        ...(campaignId ? { campaign_id: campaignId } : {}),
      };
      let res;
      if (isEdit) {
        res = await putWithAuth(`/api/pledges/${id}`, payload);
      } else {
        res = await postWithAuth('/api/pledges', payload);
      }
      if (res.success) {
        navigate('/pledges');
      } else {
        setError(res.error || 'Failed to save pledge');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="pledge-form-bg">
      <Logo size="large" showText={false} />
      <h2>{isEdit ? 'Edit Pledge' : 'Add New Pledge'}</h2>
      <form onSubmit={handleSubmit} className="pledge-form">
        {campaignId && (
          <div>
            <label>Campaign</label>
            <input value={campaignTitle || campaignId} disabled style={{ background: '#f3f4f6', color: '#374151', fontWeight: 500 }} />
          </div>
        )}
        <div>
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label>Amount (UGX)</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
        </div>
        <div>
          <label>Purpose</label>
          <input name="purpose" value={form.purpose} onChange={handleChange} />
        </div>
        <div>
          <label>Donor Name</label>
          <input name="donor_name" value={form.donor_name} onChange={handleChange} />
        </div>
        <div>
          <label>Collection Date</label>
          <input name="collection_date" type="date" value={form.collection_date} onChange={handleChange} />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</button>
      </form>
    </div>
  );
}
