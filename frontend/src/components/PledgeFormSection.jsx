import React, { useState } from 'react';
import './PledgeFormSection.custom.css';
import Modal from './Modal';
import PropTypes from 'prop-types';
import { PLEDGE_PURPOSE_OPTIONS } from '../constants/pledge';

/**
 * PledgeFormSection Component
 * Standalone pledge form with improved UX and separated concerns
 */

function PledgeFormSection({ 
  onSubmit, 
  pledgeForm, 
  onFieldChange, 
  isSubmitting = false, 
  message = null 
}) {
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [customPurposeDraft, setCustomPurposeDraft] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(e);
  };

  // When user selects 'Other', open modal and clear draft
  const handlePurposeChange = (e) => {
    if (e.target.value === 'Other') {
      setCustomPurposeDraft(pledgeForm.customPurpose || "");
      setShowOtherModal(true);
    }
    onFieldChange(e);
  };

  const handleOtherModalOk = () => {
    // Simulate event for parent handler
    onFieldChange({
      target: {
        name: 'customPurpose',
        value: customPurposeDraft
      }
    });
    setShowOtherModal(false);
  };

  const handleOtherModalCancel = () => {
    setShowOtherModal(false);
    // Optionally clear customPurpose if modal cancelled
    // onFieldChange({ target: { name: 'customPurpose', value: '' } });
  };

  return (
    <section className="pledge-form-section card card--glass">
      <div className="pledge-form-section__header">
        <div>
          <h2 className="pledge-form-section__title">Make a Pledge</h2>
          <p className="pledge-form-section__subtitle">
            Capture wedding pledges with contact details and pickup dates so nothing slips through
            the cracks.
          </p>
        </div>
        {/* Removed top Cancel/Add Pledge toggle button for cleaner UX */}
      </div>

      {message?.text && (
        <div
          className={`alert ${message.type === 'error' ? 'alert--error' : 'alert--success'}`}
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      <form
        className="pledge-form"
        onSubmit={handleSubmit}
        noValidate
      >
          <div className="pledge-form__grid">
            <div className="form-field">
              <label htmlFor="pledge-fullName" className="form-label">
                Pledger name *
              </label>
              <input
                id="pledge-fullName"
                name="fullName"
                type="text"
                className="input"
                value={pledgeForm.fullName}
                onChange={onFieldChange}
                placeholder="e.g. John Doe"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="pledge-phone" className="form-label">
                Phone number *
              </label>
              <input
                id="pledge-phone"
                name="phone"
                type="tel"
                className="input"
                value={pledgeForm.phone}
                onChange={onFieldChange}
                placeholder="e.g. +256771234567"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="pledge-email" className="form-label">
                Email (optional)
              </label>
              <input
                id="pledge-email"
                name="email"
                type="email"
                className="input"
                value={pledgeForm.email}
                onChange={onFieldChange}
                placeholder="e.g. sarah@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-field">
              <label htmlFor="pledge-amount" className="form-label">
                Amount pledged (UGX) *
              </label>
              <input
                id="pledge-amount"
                name="amount"
                type="number"
                min="0"
                max="500000000"
                step="1000"
                className="input"
                value={pledgeForm.amount}
                onChange={onFieldChange}
                placeholder="e.g. 500000"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-field form-field--full">
              <label htmlFor="pledge-purpose" className="form-label">
                What are you pledging for? *
              </label>
              <div className="pledge-purpose-select-wrapper">
                <select
                  id="pledge-purpose"
                  name="purpose"
                  className="pledge-purpose-select"
                  value={pledgeForm.purpose}
                  onChange={handlePurposeChange}
                  disabled={isSubmitting}
                >
                  {PLEDGE_PURPOSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal for custom purpose if 'Other' is selected */}
            <Modal
              isOpen={showOtherModal}
              onClose={handleOtherModalCancel}
              onSubmit={handleOtherModalOk}
              value={customPurposeDraft}
              onChange={e => setCustomPurposeDraft(e.target.value)}
              title="Describe the pledge"
              placeholder="e.g. Choir honorarium"
            />
            {pledgeForm.purpose === 'Other' && pledgeForm.customPurpose && (
              <div className="form-field form-field--full">
                <label className="form-label">Custom purpose</label>
                <div className="input" style={{ background: '#f7f7f7', color: '#333' }}>{pledgeForm.customPurpose}</div>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="pledge-date" className="form-label">
                Date pledged *
              </label>
              <input
                id="pledge-date"
                name="pledgeDate"
                type="date"
                className="input"
                value={pledgeForm.pledgeDate}
                onChange={onFieldChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="pledge-collectionDate" className="form-label">
                Collection date *
              </label>
              <input
                id="pledge-collectionDate"
                name="collectionDate"
                type="date"
                className="input"
                value={pledgeForm.collectionDate}
                onChange={onFieldChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div
            className="pledge-form__actions"
            style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '1.5rem' }}
          >
            <button
              type="submit"
              className="btn btn--primary"
              style={{ minWidth: '120px', padding: '0.5rem 1rem', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Pledge...' : 'Create Pledge'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              style={{ minWidth: '100px', padding: '0.5rem 1rem', fontSize: '0.95rem' }}
              onClick={() => {}}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
    </section>
  );
}

PledgeFormSection.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  pledgeForm: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  message: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }),
};

export default PledgeFormSection;
