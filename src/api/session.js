// Tokens live in sessionStorage (cleared when the tab closes), never in source code.
// User and business objects are NOT persisted; they are re-fetched from GET /auth/me.
const KEY = 'bizpulse.session';

function safe(fn, fallback = null) {
  try { return fn(); } catch { return fallback; }
}

export const session = {
  read() {
    return safe(() => JSON.parse(sessionStorage.getItem(KEY)) || null);
  },
  write(data) {
    safe(() => sessionStorage.setItem(KEY, JSON.stringify(data)));
  },
  clear() {
    safe(() => sessionStorage.removeItem(KEY));
  },
  get token() { return this.read()?.token || null; },
  get refreshToken() { return this.read()?.refreshToken || null; },
};
