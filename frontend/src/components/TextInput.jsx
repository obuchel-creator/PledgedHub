import React from 'react';
import PropTypes from 'prop-types';

const TextInput = ({ id, label, value, onChange, required, disabled, autoComplete, placeholder, type = 'text', name, ...rest }) => (
  <div>
    <label htmlFor={id} style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>{label}</label>
    <input
      id={id}
      name={name || id}
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      style={inputStyle}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      {...rest}
    />
  </div>
);

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
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

export default TextInput;
