import React from 'react';
import PropTypes from 'prop-types';

const PasswordInput = ({ id, label, value, onChange, required, disabled, autoComplete, placeholder, show, onToggleShow, name, ...rest }) => (
  <div>
    <label htmlFor={id} style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        name={name || id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, paddingRight: 40 }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...rest}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={onToggleShow}
        style={toggleBtnStyle}
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  </div>
);

PasswordInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
  show: PropTypes.bool,
  onToggleShow: PropTypes.func.isRequired,
  name: PropTypes.string,
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #c7c7c7',
  borderRadius: 4,
  fontSize: 15,
  marginTop: 4,
  marginBottom: 0,
  background: '#f9fafd',
  color: '#222',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const toggleBtnStyle = {
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#888',
  padding: 0,
};

export default PasswordInput;
