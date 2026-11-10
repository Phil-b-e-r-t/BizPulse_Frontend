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
  ACCOUNT_SUSPENDED: 'This account has been suspended. Please contact BizPulse support',
  ACCOUNT_LOCKED: 'Too many failed login attempts. Your account is temporarily locked',
  SESSION_TERMINATED: 'Your session was ended by an administrator',
  SESSION_EXPIRED_INACTIVITY: 'You were signed out after a period of inactivity',
  NETWORK_ERROR: 'Cannot reach the server. Check your internet connection and try again',
};

// A 401 with one of these codes means the 15-minute access token ran out. The client tries a silent refresh first.
export const SESSION_EXPIRED_CODES = ['INVALID_TOKEN', 'UNAUTHENTICATED', 'SESSION_TERMINATED', 'SESSION_EXPIRED_INACTIVITY', 'ACCOUNT_SUSPENDED'];

// Why a signed-in person was sent back to the login page. Drives the notice shown there.
export const SESSION_END_REASONS = ['SESSION_TERMINATED', 'SESSION_EXPIRED_INACTIVITY', 'ACCOUNT_SUSPENDED'];

/** Turn any thrown error into text that is safe and useful to show a person. */
export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again';
  if (err.code === 'INSUFFICIENT_STOCK' && err.message) return err.message; // names the product
  // The server writes these messages with the lock time or reason, so show them as sent.
  if ((err.code === 'ACCOUNT_LOCKED' || err.code === 'ACCOUNT_SUSPENDED') && err.message) return err.message;
  if ((err.code === 'CONFLICT' || err.code === 'NOT_FOUND') && err.message) return err.message;
  if (MESSAGES[err.code]) return MESSAGES[err.code];
  return 'Something went wrong. Please try again';
}
