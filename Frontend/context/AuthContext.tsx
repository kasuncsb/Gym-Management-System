"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';

export type Role = 'admin' | 'manager' | 'trainer' | 'member';

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

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case 'trainer': return '/trainer/dashboard';
    case 'manager': return '/manager/dashboard';
    case 'admin':   return '/admin/dashboard';
    default:        return '/member/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // BUG-14 fix: isAuthenticated only becomes true after the server confirms the
  // session via the profile API. Never trust localStorage alone — prevents the
  // flash where stale cache shows protected content before session validation.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Hydration fix: mounted starts false on both server and client so the first
  // paint is byte-identical to the SSR output. localStorage is only read after
  // mount to eliminate React hydration error #418 in production builds.
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Guard: only run on client after mount. This is the fix for React hydration
    // error #418 — localStorage must never be read during the initial render that
    // Next.js compares against the SSR snapshot.
    if (!mounted) return;

    // BUG-01 fix: Only attempt profile validation if we have a stored user hint.
    // Anonymous/public-page visitors (homepage, /login, /forgot-password, etc.)
    // skip the API call entirely.
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    // Optimistically populate display name from cache for instant UI render,
    // but isAuthenticated stays false until the server confirms below.
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('user');
      setIsLoading(false);
      return;
    }

    authAPI.getProfile()
      .then(res => {
        const { id, fullName, email, role, phone } = res.data.data;
        const freshUser: User = { id, fullName, email, role, phone };
        setUser(freshUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .catch(() => {
        // Session invalid or expired — clear everything
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      })
      .finally(() => setIsLoading(false));
  }, [mounted]);

  /** Call after login/register — user object from server response */
  const login = useCallback((newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    // Set a lightweight role cookie so the Edge proxy can do role-based redirects
    // without needing to decode the JWT (which is httpOnly and inaccessible at edge).
    document.cookie = `user_role=${newUser.role}; path=/; samesite=lax`;
  }, []);

  // BUG-22 fix: Previously, logout() called authAPI.logout() through the standard
  // Axios interceptor. If the access token was expired the interceptor tried to
  // refresh, failed, and triggered window.location.href='/login'. Then router.push('/')
  // fired on top, creating a navigation conflict/double-redirect. Now we always
  // clean up local state first, and ignore server errors gracefully.
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Server-side token revocation is best-effort only.
      // Local cleanup below is what actually matters for UX.
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    // Clear role cookie
    document.cookie = 'user_role=; path=/; max-age=0';
    router.push('/');
  }, [router]);

  const hasRole = useCallback((...roles: Role[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isLoading, loading: isLoading,
      isAuthenticated,
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
