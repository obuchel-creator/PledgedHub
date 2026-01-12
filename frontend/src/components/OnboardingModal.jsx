import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

/**
 * OnboardingModal - Shown after first login or registration
 * Greets user, highlights key features, and collects optional preferences
 */
function OnboardingModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState({ darkMode: false, reminders: true });

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  const steps = [
    {
      title: `Welcome, ${user?.username || user?.name || user?.email || 'PledgeHub User'}!`,
      content: (
        <>
          <p style={{ marginBottom: 12 }}>
            Thank you for joining PledgeHub. Here you can manage pledges, campaigns, payments, and more—all in one place.
          </p>
          <ul style={{ marginBottom: 12, paddingLeft: 18 }}>
            <li>✔️ Track your pledges and payments</li>
            <li>✔️ Get automated reminders</li>
            <li>✔️ Access advanced analytics</li>
            <li>✔️ Secure, role-based access</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Personalize Your Experience',
      content: (
        <>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={e => setPreferences(p => ({ ...p, darkMode: e.target.checked }))}
            />{' '}
            Enable dark mode
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={preferences.reminders}
              onChange={e => setPreferences(p => ({ ...p, reminders: e.target.checked }))}
            />{' '}
            Receive payment reminders
          </label>
        </>
      ),
    },
    {
      title: 'You’re All Set!',
      content: (
        <>
          <p style={{ marginBottom: 12 }}>
            Explore your dashboard, create pledges, and experience the power of automation and analytics.
          </p>
          <p style={{ color: '#16a34a', fontWeight: 600 }}>Welcome to the PledgeHub family! 🎉</p>
        </>
      ),
    },
  ];

  function handleNext() {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleNext}
      value={''}
      onChange={() => {}}
      title={steps[step].title}
      placeholder={''}
    >
      <div style={{ marginBottom: 16 }}>{steps[step].content}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {step > 0 && (
          <button type="button" className="btn btn--secondary" onClick={handleBack}>
            Back
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={handleNext}>
          {step === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </Modal>
  );
}

OnboardingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OnboardingModal;
