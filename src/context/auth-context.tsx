'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { PublicUser } from '@/lib/types';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    city?: string;
    neighborhood?: string;
    interests?: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<{ user: PublicUser | null }>('/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval=setInterval(()=>{api.post('/auth/sessions',{action:'refresh'}).catch(()=>{});},10*60*1000);
    return ()=>clearInterval(interval);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: PublicUser; nextStep?: string }>('/auth/login', { email, password });
    if(res.nextStep){window.location.assign(`/${document.documentElement.lang||'fr'}/account-security/#step=${res.nextStep}`);throw new ApiError('Additional verification required.',202);}
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: Parameters<AuthContextValue['register']>[0]) => {
    const res = await api.post<{ user: PublicUser; nextStep?: string }>('/auth/register', data);
    if(res.nextStep){window.location.assign(`/${document.documentElement.lang||'fr'}/account-security/#step=${res.nextStep}`);throw new ApiError('Check your email to verify your account.',202);}
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
