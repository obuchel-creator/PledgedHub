import { useState, useEffect } from 'react';
import { getPledges, createPledge, getPayments } from '../services/api';

// Real implementation with API calls
export default function useDashboardData() {
  const [state, setState] = useState({
    pledges: [],
    payments: [],
    loading: true,
    paymentsError: '',
    pledgeForm: {
      fullName: '',
      phone: '',
      email: '',
      amount: '',
      purpose: 'General',
      customPurpose: '',
      pledgeDate: '',
      collectionDate: '',
    },
    pledgeMessage: { text: '', type: '' },
    creatingPledge: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setState((prev) => ({ ...prev, loading: true, paymentsError: '' }));
    try {
      let paymentsError = '';

      const [pledgesResult, paymentsResult] = await Promise.all([
        getPledges().catch(() => ({ success: false, data: [] })),
        getPayments().catch((err) => {
          paymentsError = err?.message || 'Failed to load payments';
          return [];
        })
      ]);

      // Handle various response shapes for pledges
      let pledgesArr = [];
      if (pledgesResult?.success) {
        if (Array.isArray(pledgesResult.data)) {
          pledgesArr = pledgesResult.data;
        } else if (Array.isArray(pledgesResult.data?.pledges)) {
          pledgesArr = pledgesResult.data.pledges;
        } else if (Array.isArray(pledgesResult.pledges)) {
          pledgesArr = pledgesResult.pledges;
        }
      }
      // minimal logging for diagnostics
      console.log('📊 [Dashboard] Loaded pledges:', pledgesArr.length);

      // Handle various response shapes for payments
      let paymentsArr = [];
      if (Array.isArray(paymentsResult)) {
        paymentsArr = paymentsResult;
      } else if (paymentsResult?.success && Array.isArray(paymentsResult.payment)) {
        paymentsArr = paymentsResult.payment;
      } else if (paymentsResult?.payments && Array.isArray(paymentsResult.payments)) {
        paymentsArr = paymentsResult.payments;
      }
      
      // processed payments count
      console.log('💳 [Dashboard] payments count:', paymentsArr.length);

      setState((prev) => ({
        ...prev,
        pledges: pledgesArr,
        payments: paymentsArr,
        paymentsError,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setState((prev) => ({ ...prev, loading: false, paymentsError: err?.message || 'Failed to load dashboard data' }));
    }
  };

  // Handlers: update form state
  const handlePledgeFieldChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      pledgeForm: {
        ...prev.pledgeForm,
        [name]: value,
      },
    }));
  };

  const handlePledgeSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setState((prev) => ({ ...prev, creatingPledge: true, pledgeMessage: { text: '', type: '' } }));

    try {
      const form = state.pledgeForm;
      
      // Validation: Check email first (editable field)
      if (!form.email || form.email.trim() === '') {
        throw new Error('Email is required');
      }
      
      // Validation: Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validation: Check amount next (editable field)
      const amount = Number(form.amount);
      if (!form.amount || form.amount === '' || amount <= 0) {
        throw new Error('Amount is required and must be greater than 0');
      }

      // Validation: Check collection date (editable field)
      if (!form.collectionDate || form.collectionDate.trim() === '') {
        throw new Error('Collection date is required');
      }

      // Validation: Check purpose
      if (!form.purpose || form.purpose.trim() === '') {
        throw new Error('Purpose is required');
      }

      // If purpose is "Other", custom purpose must be filled
      if (form.purpose === 'Other' && (!form.customPurpose || form.customPurpose.trim() === '')) {
        throw new Error('Please describe what you\'re pledging for');
      }

      const finalPurpose = form.purpose === 'Other' ? form.customPurpose : form.purpose;

      console.log('📝 [PLEDGE CREATE] Submitting pledge:', {
        amount: Number(form.amount),
        donor_name: form.fullName,
        donor_email: form.email,
        donor_phone: form.phone,
        purpose: finalPurpose,
        collection_date: form.collectionDate,
        status: 'pending',
        message: finalPurpose,
        date: new Date().toISOString(),
      });

      const result = await createPledge({
        donor_name: form.fullName,
        donor_email: form.email,
        donor_phone: form.phone,
        purpose: finalPurpose,
        collection_date: form.collectionDate,
        amount: Number(form.amount),
        status: 'pending',
        message: finalPurpose,
        date: new Date().toISOString(),
      });

      console.log('✅ [PLEDGE CREATE] Response:', result);

      // Check if the response indicates success
      if (result && (result.success === false || result.error)) {
        throw new Error(result.error || 'Failed to create pledge');
      }

      setState((prev) => ({
        ...prev,
        pledgeForm: {
          fullName: '',
          phone: '',
          email: '',
          amount: '',
          purpose: 'General',
          customPurpose: '',
          pledgeDate: '',
          collectionDate: '',
        },
        pledgeMessage: { text: 'Pledge created successfully!', type: 'success' },
        creatingPledge: false,
      }));

      // Reload pledges to show the new one
      loadData();
    } catch (err) {
      console.error('❌ [PLEDGE CREATE] Error:', err);
      setState((prev) => ({
        ...prev,
        pledgeMessage: { text: err?.message || 'Failed to create pledge. Please try again.', type: 'error' },
        creatingPledge: false,
      }));
    }
  };
  const resetPledgeForm = () => {
    setState((prev) => ({
      ...prev,
      pledgeForm: {
        fullName: '',
        phone: '',
        email: '',
        amount: '',
        purpose: 'General',
        customPurpose: '',
        pledgeDate: '',
        collectionDate: '',
      },
    }));
  };

  return {
    ...state,
    handlePledgeFieldChange,
    handlePledgeSubmit,
    resetPledgeForm,
  };
}
