import { useEffect, useRef } from 'react';
import {
  ACTIVITY_KEY, ACTIVITY_WRITE_THROTTLE_MS, CHECK_EVERY_MS, DEFAULT_INACTIVITY_HOURS, HEARTBEAT_EVERY_MS, LOGOUT_KEY,
} from '../config/security';

const read = () => { try { return Number(localStorage.getItem(ACTIVITY_KEY)) || 0; } catch { return 0; } };
const write = (value) => { try { localStorage.setItem(ACTIVITY_KEY, String(value)); } catch { /* storage unavailable */ } };

/** True when the saved activity time is older than the timeout. Used before restoring a session on page load. */
export function inactiveTooLong(hours = DEFAULT_INACTIVITY_HOURS) {
  const last = read();
  return last > 0 && Date.now() - last > hours * 3_600_000;
}
export const markActivity = () => write(Date.now());
export const broadcastLogout = () => { try { localStorage.setItem(LOGOUT_KEY, String(Date.now())); } catch { /* ignore */ } };

/**
 * Signs the person out after `hours` without meaningful activity, in this tab and every other tab.
 * Meaningful activity = pointer, key, touch or scroll input in any open tab (shared through localStorage).
 * It also pings the server once a minute so a session ended by an admin is noticed quickly.
 * The server still enforces the same rule; this only makes the screen react on time.
 */
export function useSessionGuard({ enabled, hours = DEFAULT_INACTIVITY_HOURS, onInactive, onOtherTabSignedOut, heartbeat }) {
  const handlers = useRef({});
  handlers.current = { onInactive, onOtherTabSignedOut, heartbeat };

  useEffect(() => {
    if (!enabled) return undefined;
    const limit = hours * 3_600_000;
    if (!read()) markActivity();

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      write(now);
    };
    const check = () => {
      if (Date.now() - read() > limit) handlers.current.onInactive?.();
    };
    const onStorage = (event) => {
      if (event.key === LOGOUT_KEY && event.newValue) handlers.current.onOtherTabSignedOut?.();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };

    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    const checkTimer = setInterval(check, CHECK_EVERY_MS);
    const beatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') handlers.current.heartbeat?.();
    }, HEARTBEAT_EVERY_MS);
    check();

    return () => {
      events.forEach((name) => window.removeEventListener(name, onActivity, { capture: true }));
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(checkTimer);
      clearInterval(beatTimer);
    };
  }, [enabled, hours]);
}
