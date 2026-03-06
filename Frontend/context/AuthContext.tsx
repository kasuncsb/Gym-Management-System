"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';

export type Role = 'admin' | 'manager' | 'staff' | 'trainer' | 'member';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function dashboardPathForRole(_role: string): string {
  return '/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // On mount: restore user from localStorage (display only, not auth)
    // then validate with backend to confirm cookie is still valid
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }

    // Confirm session is valid by calling profile endpoint
    authAPI.getProfile()
      .then(res => {
        const { id, fullName, email, role, phone } = res.data.data;
        const freshUser: User = { id, fullName, email, role, phone };
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .catch(() => {
        // Not authenticated (or refresh also failed via interceptor)
        setUser(null);
        localStorage.removeItem('user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  /** Call after login/register — user object from server response */
  const login = useCallback((newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  }, [router]);

  const hasRole = useCallback((...roles: Role[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isLoading, loading: isLoading,
      isAuthenticated: !!user,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
