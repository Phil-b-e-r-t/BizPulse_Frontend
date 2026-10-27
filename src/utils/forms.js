import { friendlyError } from '../api/errors';

/**
 * Map a server error onto a react-hook-form instance.
 * 422 VALIDATION_ERROR carries details: [{ path, message }] -> show each under its field.
 * Anything else becomes a form-level message (errors.root.server).
 */
export function applyServerError(err, setError, knownFields = []) {
  if (err?.code === 'VALIDATION_ERROR' && err.details?.length) {
    let placed = false;
    err.details.forEach(({ path, message }) => {
      if (knownFields.includes(path)) {
        setError(path, { type: 'server', message });
        placed = true;
      }
    });
    if (placed) return;
  }
  setError('root.server', { type: 'server', message: friendlyError(err) });
}
