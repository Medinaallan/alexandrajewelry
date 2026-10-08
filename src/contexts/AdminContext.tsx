import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AdminContextType } from '../types';
import { api, setUnauthorizedHandler } from '../lib/api';

const TOKEN_KEY = 'alexandra-token';

const AdminContext = createContext<AdminContextType | null>(null);

/** Expiry time of a JWT in ms, or null if the token can't be read. */
function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function loadToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const expiry = tokenExpiry(token);
  if (expiry === null || expiry <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  // The token is the single source of truth for the session
  const [token, setToken] = useState<string | null>(loadToken);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { token: jwt } = await api.auth.login(username, password);
      localStorage.setItem(TOKEN_KEY, jwt);
      setToken(jwt);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  // Close the session as soon as the API rejects the token, and when it expires
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    const expiry = tokenExpiry(token);
    if (expiry === null) return;
    // setTimeout can't wait longer than ~24 days
    const timer = setTimeout(logout, Math.min(Math.max(expiry - Date.now(), 0), 2_000_000_000));
    return () => clearTimeout(timer);
  }, [token, logout]);

  return (
    <AdminContext.Provider value={{ isAuthenticated: token !== null, token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
