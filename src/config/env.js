// Single place that reads build-time environment variables.
const trimSlash = (s) => (s || '').replace(/\/+$/, '');

export const env = {
  apiUrl: trimSlash(import.meta.env.VITE_API_URL) || 'http://localhost:5000/api/v1',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
};
