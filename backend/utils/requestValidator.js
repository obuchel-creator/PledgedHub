/**
 * Request Validation Utility
 * Provides consistent validation and error responses
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Accepts formats like: +256700000000, 256700000000, 0700000000
  const phoneRegex = /^(\+?256|0)\d{9}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateName = (name) => {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
};

const validateId = (id) => {
  const numId = Number(id);
  return Number.isInteger(numId) && numId > 0;
};

const validateAmount = (amount) => {
  const numAmount = Number(amount);
  return Number.isFinite(numAmount) && numAmount > 0;
};

const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

const validateString = (value, fieldName, minLength = 1, maxLength = 1000) => {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  if (value.trim().length > maxLength) {
    return { valid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
  }
  return { valid: true };
};

const validateNumber = (value, fieldName, min = null, max = null) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (min !== null && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (max !== null && num > max) {
    return { valid: false, error: `${fieldName} must be no more than ${max}` };
  }
  return { valid: true };
};

const validateEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(', ')}` };
  }
  return { valid: true };
};

const sendError = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

const sendSuccess = (res, statusCode, data, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validateId,
  validateAmount,
  validateRequired,
  validateString,
  validateNumber,
  validateEnum,
  sendError,
  sendSuccess
};
