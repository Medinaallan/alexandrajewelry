import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AdminContextType } from '../types';
import { api } from '../lib/api';

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('alexandra-admin') === 'true';
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('alexandra-token');
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { token: jwt } = await api.auth.login(username, password);
      setToken(jwt);
      setIsAuthenticated(true);
      localStorage.setItem('alexandra-token', jwt);
      sessionStorage.setItem('alexandra-admin', 'true');
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('alexandra-token');
    sessionStorage.removeItem('alexandra-admin');
  }, []);

  return (
    <AdminContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
