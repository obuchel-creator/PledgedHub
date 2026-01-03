import React from 'react';
import PropTypes from 'prop-types';

function Modal({ isOpen, onClose, onSubmit, value, onChange, title, placeholder }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.5)', // lighter, subtle white overlay
      zIndex: 1000,
    }}>
      <div className="modal-content" style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        borderRadius: 10,
        padding: 16,
        width: 320,
        maxWidth: '90vw',
        minWidth: 220,
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        fontSize: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: 8 }}>{title || 'Describe your pledge'}</h3>
        <input
          type="text"
          className="input"
          value={value}
          onChange={onChange}
          placeholder={placeholder || 'e.g. Choir honorarium'}
          style={{ width: '100%', marginBottom: 12, fontSize: '1rem', padding: '0.5rem' }}
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn--secondary" style={{ minWidth: 70 }} onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" style={{ minWidth: 70 }} onClick={onSubmit}>OK</button>
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
};

export default Modal;
