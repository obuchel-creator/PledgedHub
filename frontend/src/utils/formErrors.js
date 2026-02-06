const STATUS_PREFIX = /^\d{3}:\s*/i;
const BAD_REQUEST_PREFIX = /^bad request:\s*/i;

const FIELD_MAPPINGS = [
  { match: /donor name|donor_name|full name|name is required/i, message: "Please enter the donor's name." },
  { match: /campaign title|title is required/i, message: 'Please enter a campaign title.' },
  { match: /email( address)? is required|email is required/i, message: 'Please enter an email address.' },
  { match: /phone number|donor_phone|phone is required/i, message: 'Please enter a phone number.' },
  { match: /amount is required/i, message: 'Please enter the pledge amount.' },
  { match: /amount must be a valid number/i, message: 'Please enter a valid amount.' },
  { match: /amount must be greater than 0/i, message: 'Amount must be greater than 0.' },
  { match: /goal amount|goal must|campaign goal/i, message: 'Campaign goal must be a positive number.' },
  { match: /suggested amount/i, message: 'Suggested amount must be a positive number.' },
  { match: /collection date/i, message: 'Please select a collection date.' },
  { match: /pledge date|date\) is required/i, message: 'Please select a pledge date.' },
  { match: /password is required/i, message: 'Please enter a password.' },
  { match: /confirm password/i, message: 'Please confirm your password.' },
  { match: /passwords do not match|passwords must match/i, message: 'Passwords do not match.' },
  { match: /invalid credentials|invalid password|incorrect password/i, message: 'Incorrect email or password. Please try again.' },
  { match: /account is locked/i, message: 'Your account is locked. Please contact support.' },
  { match: /pledge name must match your registered name/i, message: null },
  { match: /phone number must match your registered number/i, message: null },
  { match: /session has expired|session.*invalid|refresh your credentials/i, message: 'Your session has expired. Please logout and login again.' },
  { match: /tenant context required/i, message: 'Please sign in to continue.' },
  { match: /unauthorized|forbidden/i, message: 'You are not authorized to perform this action.' },
  { match: /network error/i, message: 'Network error. Please check your connection and try again.' },
];

export function cleanApiErrorMessage(rawError) {
  const message = String(rawError || '').trim();
  if (!message) return '';
  return message.replace(STATUS_PREFIX, '').replace(BAD_REQUEST_PREFIX, '').trim();
}

export function formatFormErrorMessage(rawError, fallback = 'Something went wrong. Please try again.') {
  const cleaned = cleanApiErrorMessage(rawError);
  if (!cleaned) return fallback;
  const normalized = cleaned.toLowerCase();

  const mapping = FIELD_MAPPINGS.find(({ match }) => match.test(normalized));
  if (mapping) {
    // If message is null, use the cleaned original message (for detailed server messages)
    if (mapping.message === null) return cleaned;
    return mapping.message;
  }

  return cleaned;
}

export function requiredMessage(label) {
  return `Please enter ${label}.`;
}
