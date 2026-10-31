// Mirrors the handoff's "Error messages to show" table (section 6) and docs/API_CHANGELOG.md in the backend repo.
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = '', details = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const MESSAGES = {
  SKU_TAKEN: 'Another product already uses this code',
  EMAIL_TAKEN: 'An account with this email already exists. Log in instead',
  INVALID_CREDENTIALS: 'Wrong email or password',
  ACCOUNT_DISABLED: 'This account has been turned off. Please contact the business owner',
  FORBIDDEN: 'Only the owner can do this',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes',
  INVALID_TOKEN: 'Your session expired',
  UNAUTHENTICATED: 'Your session expired',
  INVALID_REFRESH_TOKEN: 'Your session expired',
  PAYMENTS_NOT_CONFIGURED: 'Payments are not available yet',
  IDEMPOTENCY_IN_PROGRESS: 'Still saving the last sale. Please wait a moment and try again',
  IDEMPOTENCY_KEY_REUSED: 'Something went wrong with this sale. Please start it again',
  NETWORK_ERROR: 'Cannot reach the server. Check your internet connection and try again',
};

// A 401 with one of these codes means the 15-minute access token ran out. The client tries a silent refresh first.
export const SESSION_EXPIRED_CODES = ['INVALID_TOKEN', 'UNAUTHENTICATED'];

/** Turn any thrown error into text that is safe and useful to show a person. */
export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again';
  if (err.code === 'INSUFFICIENT_STOCK' && err.message) return err.message; // names the product
  if (MESSAGES[err.code]) return MESSAGES[err.code];
  return 'Something went wrong. Please try again';
}
