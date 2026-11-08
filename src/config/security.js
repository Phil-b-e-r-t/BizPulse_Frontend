// Front-end defaults for session handling. The BACKEND is the authority: it expires and revokes sessions
// and may send its own value (`user.sessionTimeoutHours`, set by the super admin in System settings).
export const DEFAULT_INACTIVITY_HOURS = 24;
export const ACTIVITY_KEY = 'bizpulse.lastActivity'; // a timestamp only. No tokens or personal data.
export const LOGOUT_KEY = 'bizpulse.logout';          // written on sign out so other tabs follow
export const CHECK_EVERY_MS = 30_000;
export const HEARTBEAT_EVERY_MS = 60_000;
export const ACTIVITY_WRITE_THROTTLE_MS = 15_000;
