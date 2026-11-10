import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { session } from '../api/session';
import { setSessionExpiredHandler, api } from '../api/client';
import { DEFAULT_INACTIVITY_HOURS } from '../config/security';
import { broadcastLogout, inactiveTooLong, markActivity, useSessionGuard } from '../hooks/useSessionGuard';

const AuthContext = createContext(null);

// status: 'loading' (restoring the session) | 'authenticated' | 'unauthenticated' | 'error'
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  // The access token is only in memory, so on every page load we try to restore the session first
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Why the session ended: SESSION_EXPIRED_INACTIVITY | SESSION_TERMINATED | ACCOUNT_SUSPENDED | other
  const [sessionEndReason, setSessionEndReason] = useState(null);

  const endSession = useCallback(() => {
    session.clear();
    queryClient.clear();
    setUser(null);
    setBusiness(null);
    setStatus('unauthenticated');
  }, [queryClient]);

  // Restore after a reload or a reopened tab: the refresh-token cookie gives us a new access token.
  // With a token already in memory (the "Try again" button) just load the profile.
  const restore = useCallback(async () => {
    setStatus('loading');
    try {
      // Away longer than the inactivity limit (even with the browser closed): do not restore the session.
      if (!session.token && inactiveTooLong()) {
        authApi.logout().catch(() => {});
        setSessionEndReason('SESSION_EXPIRED_INACTIVITY');
        setSessionExpired(true);
        setStatus('unauthenticated');
        return;
      }
      const data = session.token ? await authApi.getMe() : await authApi.refresh();
      markActivity();
      setUser(data.user);
      setBusiness(data.business);
      setStatus('authenticated');
    } catch (err) {
      // 401 means nobody is signed in (no cookie, or it expired). Anything else (offline, 5xx) can be retried.
      setStatus(err.status === 401 ? 'unauthenticated' : 'error');
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler((reason) => {
      setSessionEndReason(reason || null);
      setSessionExpired(true);
      endSession();
    });
  }, [endSession]);

  useEffect(() => { restore(); }, [restore]);

  const applyAuthResponse = useCallback((data) => {
    session.setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    setSessionExpired(false);
    setSessionEndReason(null);
    markActivity();
    setStatus('authenticated');
  }, []);

  const login = useCallback(async (creds) => {
    applyAuthResponse(await authApi.login(creds));
  }, [applyAuthResponse]);

  const register = useCallback(async (payload) => {
    applyAuthResponse(await authApi.register(payload));
  }, [applyAuthResponse]);

  const logout = useCallback(() => {
    setSessionExpired(false);
    setSessionEndReason(null);
    broadcastLogout();
    // Tell the server so the refresh token stops working. Do not make the user wait for it.
    authApi.logout().catch(() => {});
    endSession();
  }, [endSession]);

  const timeoutHours = user?.sessionTimeoutHours || DEFAULT_INACTIVITY_HOURS;
  useSessionGuard({
    enabled: status === 'authenticated',
    hours: timeoutHours,
    onInactive: () => {
      authApi.logout().catch(() => {});
      broadcastLogout();
      setSessionEndReason('SESSION_EXPIRED_INACTIVITY');
      setSessionExpired(true);
      endSession();
    },
    onOtherTabSignedOut: () => {
      endSession();
    },
    // Not counted as user activity by the server (see the header). Detects sessions ended by an admin.
    heartbeat: () => api.get('/auth/me', undefined, { headers: { 'X-BizPulse-Heartbeat': '1' } }).catch(() => {}),
  });

  const value = useMemo(() => ({
    status, user, business, sessionExpired, sessionEndReason,
    isSuperAdmin: user?.role === 'superadmin',
    isOwner: user?.role === 'owner',
    login, register, applyAuthResponse, logout, retry: restore,
    clearExpiredNotice: () => setSessionExpired(false),
  }), [status, user, business, sessionExpired, sessionEndReason, login, register, applyAuthResponse, logout, restore]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
