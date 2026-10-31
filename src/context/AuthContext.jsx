import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { session } from '../api/session';
import { setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);

// status: 'loading' (restoring the session) | 'authenticated' | 'unauthenticated' | 'error'
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  // The access token is only in memory, so on every page load we try to restore the session first
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

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
      const data = session.token ? await authApi.getMe() : await authApi.refresh();
      setUser(data.user);
      setBusiness(data.business);
      setStatus('authenticated');
    } catch (err) {
      // 401 means nobody is signed in (no cookie, or it expired). Anything else (offline, 5xx) can be retried.
      setStatus(err.status === 401 ? 'unauthenticated' : 'error');
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
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
    // Tell the server so the refresh token stops working. Do not make the user wait for it.
    authApi.logout().catch(() => {});
    endSession();
  }, [endSession]);

  const value = useMemo(() => ({
    status, user, business, sessionExpired,
    isOwner: user?.role === 'owner',
    login, register, applyAuthResponse, logout, retry: restore,
    clearExpiredNotice: () => setSessionExpired(false),
  }), [status, user, business, sessionExpired, login, register, applyAuthResponse, logout, restore]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
