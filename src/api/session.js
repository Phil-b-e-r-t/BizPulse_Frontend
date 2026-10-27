// The access token lives in memory only: it is gone on reload and when the tab closes.
// The long-lived refresh token is kept by the browser in an httpOnly cookie that JavaScript cannot read,
// so a reload restores the session by calling POST /auth/refresh (see AuthContext).
// User and business objects are NOT persisted; they come from the auth responses and GET /auth/me.
let accessToken = null;

// Older versions stored tokens in sessionStorage. Remove anything left over.
try { sessionStorage.removeItem('bizpulse.session'); } catch { /* storage unavailable */ }

export const session = {
  read() { return accessToken ? { token: accessToken } : null; },
  write(data) { accessToken = data?.token || null; },
  setToken(token) { accessToken = token || null; },
  clear() { accessToken = null; },
  get token() { return accessToken; },
  // Kept so older code keeps working. The refresh token is never visible to JavaScript.
  get refreshToken() { return null; },
};
