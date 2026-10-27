// Mirrors the handoff's "Error messages to show" table (section 6).
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
  FORBIDDEN: 'Only the owner can do this',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes',
  INVALID_TOKEN: 'Your session expired',
  UNAUTHENTICATED: 'Your session expired',
  PAYMENTS_NOT_CONFIGURED: 'Payments are not available yet',
  NETWORK_ERROR: 'Cannot reach the server. Check your internet connection and try again',
};

export const SESSION_EXPIRED_CODES = ['INVALID_TOKEN', 'UNAUTHENTICATED'];

/** Turn any thrown error into text that is safe and useful to show a person. */
export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again';
  if (err.code === 'INSUFFICIENT_STOCK' && err.message) return err.message; // names the product
  if (MESSAGES[err.code]) return MESSAGES[err.code];
  return 'Something went wrong. Please try again';
}
