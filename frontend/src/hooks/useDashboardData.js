import { useState, useEffect } from 'react';

// Dummy implementation for testing; replace with real API logic as needed
export default function useDashboardData() {
  const [state, setState] = useState({
    pledges: [],
    payments: [],
    loading: true,
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
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        pledges: [
          { id: 1, donor: 'John Doe', amount: 100, status: 'pending' },
          { id: 2, donor: 'Jane Smith', amount: 200, status: 'collected' },
        ],
        payments: [{ id: 1, donor: 'John Doe', amount: 50, date: '2024-06-01' }],
        loading: false,
      }));
    }, 100);
  }, []);

  // Handlers for testing: update form state
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
  const handlePledgeSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
