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
  // Predefined item costs
  const ITEM_COSTS = {
    'Wedding Gift': 500000,
    'Cash': 0,
    'Transport': 2000000, // Example: Truck full of matooke
    'Venue': 1500000,
    'Choir': 300000,
    'Sound System': 800000,
    'Decor': 1200000,
    'Photography': 600000,
  };

  // Auto-fill amount when purpose changes
  const handlePurposeChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setCustomPurposeDraft(pledgeForm.customPurpose || "");
      setShowOtherModal(true);
    }
    // If predefined, auto-fill amount
    if (ITEM_COSTS.hasOwnProperty(value)) {
      onFieldChange({
        target: {
          name: 'amount',
          value: ITEM_COSTS[value]
        }
      });
    }
    onFieldChange(e);
  };
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [customPurposeDraft, setCustomPurposeDraft] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(e);
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

  // Common dark input style
  const darkInputStyle = {
    background: '#222',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 8,
    fontSize: '1rem',
    padding: '0.7rem 1rem',
    marginBottom: 8,
    width: '100%',
    boxSizing: 'border-box',
    fontWeight: 500,
  };

  const darkSelectStyle = {
    ...darkInputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    paddingRight: 32,
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
              Name
            </label>
            <input
              id="pledge-fullName"
              name="fullName"
              type="text"
              style={darkInputStyle}
              value={pledgeForm.fullName}
              onChange={onFieldChange}
              placeholder="Your name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="pledge-phone" className="form-label">
              Phone Number <span className="form-help">(Uganda: 256XXXXXXXXX)</span>
            </label>
            <input
              id="pledge-phone"
              name="phone"
              type="tel"
              style={darkInputStyle}
              value={pledgeForm.phone}
              onChange={onFieldChange}
              placeholder="e.g. 256771234567"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="pledge-email" className="form-label">
              Email
            </label>
            <input
              id="pledge-email"
              name="email"
              type="email"
              style={darkInputStyle}
              value={pledgeForm.email}
              onChange={onFieldChange}
              placeholder="Your email"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="pledge-amount" className="form-label">
              Amount (UGX)
            </label>
            <input
              id="pledge-amount"
              name="amount"
              type="number"
              min="0"
              max="500000000"
              step="1000"
              style={darkInputStyle}
              value={pledgeForm.amount}
              onChange={onFieldChange}
              placeholder="Enter amount (UGX)"
              disabled={isSubmitting || (ITEM_COSTS.hasOwnProperty(pledgeForm.purpose) && pledgeForm.purpose !== 'Other')}
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
                style={darkSelectStyle}
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
              <div className="input" style={{ background: '#222', color: '#fff', borderRadius: 8, padding: '0.7rem 1rem' }}>{pledgeForm.customPurpose}</div>
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
              style={darkInputStyle}
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
              style={darkInputStyle}
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
