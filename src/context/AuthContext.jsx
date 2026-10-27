import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { session } from '../api/session';
import { setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);

// status: 'loading' (checking a stored token) | 'authenticated' | 'unauthenticated' | 'error'
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(session.token ? 'loading' : 'unauthenticated');
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

  const restore = useCallback(async () => {
    if (!session.token) return setStatus('unauthenticated');
    setStatus('loading');
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setBusiness(data.business);
      setStatus('authenticated');
    } catch (err) {
      // A 401 is handled by the API client's expiry callback. Anything else (offline, 5xx) is retryable.
      if (err.status !== 401) setStatus('error');
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
    session.write({ token: data.token, refreshToken: data.refreshToken || null });
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
    endSession();
  }, [endSession]);

  const value = useMemo(() => ({
    status, user, business, sessionExpired,
    isOwner: user?.role === 'owner',
    login, register, logout, retry: restore,
    clearExpiredNotice: () => setSessionExpired(false),
  }), [status, user, business, sessionExpired, login, register, logout, restore]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
