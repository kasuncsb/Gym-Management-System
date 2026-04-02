"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { authAPI } from '../lib/api';

function isStandalonePwaRuntime(): boolean {
  try {
    const mql = window.matchMedia?.("(display-mode: standalone)");
    const iosStandalone = (window.navigator as any)?.standalone === true;
    return Boolean((mql && mql.matches) || iosStandalone);
  } catch {
    return false;
  }
}

export type Role = 'admin' | 'manager' | 'trainer' | 'member';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarKey?: string | null;
  coverKey?: string | null;
  avatarUrl?: string;
  phone?: string;
  /** For members: must verify email before dashboard access */
  emailVerified?: boolean;
  /** For members: must complete onboarding before dashboard access */
  isOnboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (...roles: Role[]) => boolean;
  /** Separate versions so uploading cover does not refetch avatar (and vice versa). */
  avatarMediaVersion: number;
  coverMediaVersion: number;
  bumpAvatarMediaVersion: () => void;
  bumpCoverMediaVersion: () => void;
  /** @deprecated Use avatarMediaVersion / bumpAvatarMediaVersion for navbar/profile avatar. */
  profileMediaVersion: number;
  bumpProfileMediaVersion: () => void;
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
  const profileRequestRef = useRef<Promise<User | null> | null>(null);
  const [avatarMediaVersion, setAvatarMediaVersion] = useState(0);
  const [coverMediaVersion, setCoverMediaVersion] = useState(0);
  const router = useRouter();

  const bumpAvatarMediaVersion = useCallback(() => {
    setAvatarMediaVersion((v) => v + 1);
  }, []);
  const bumpCoverMediaVersion = useCallback(() => {
    setCoverMediaVersion((v) => v + 1);
  }, []);
  const bumpProfileMediaVersion = useCallback(() => {
    setAvatarMediaVersion((v) => v + 1);
    setCoverMediaVersion((v) => v + 1);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  const fetchProfileDeduped = useCallback(async (): Promise<User | null> => {
    if (profileRequestRef.current) return profileRequestRef.current;
    const req = authAPI.getProfile()
      .then((res) => {
        const d = res.data.data;
        const freshUser: User = {
          id: d.id,
          fullName: d.fullName,
          email: d.email,
          role: d.role,
          avatarKey: d.avatarKey ?? null,
          coverKey: d.coverKey ?? null,
          phone: d.phone,
          emailVerified: d.emailVerified,
          isOnboarded: d.profile?.isOnboarded,
        };
        setUser(freshUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(freshUser));
        return freshUser;
      })
      .catch((err) => {
        // 429: keep cached session — do not log the user out on transient rate limits.
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          setIsAuthenticated(true);
          try {
            const stored = localStorage.getItem('user');
            if (stored) {
              const u = JSON.parse(stored) as User;
              setUser(u);
              return u;
            }
          } catch {
            // ignore and fall through
          }
          return null;
        }
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        document.cookie = 'user_role=; path=/; max-age=0';

        // Keep client hints aligned with httpOnly cookies: stale tokens often leave
        // localStorage cleared but cookies still present, which breaks login/PWA routing.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        const hasResponse = axios.isAxiosError(err) && !!err.response;
        if (hasResponse && (status === 401 || status === 403)) {
          void authAPI.logout().catch(() => {});
        } else if (!hasResponse) {
          // Offline / DNS / timeout: cookies may still be valid — retry profile when online.
          try {
            sessionStorage.setItem('auth_retry_probe', '1');
          } catch {
            /* ignore */
          }
        }
        return null;
      })
      .finally(() => {
        profileRequestRef.current = null;
      });
    profileRequestRef.current = req;
    return req;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onOnline = () => {
      try {
        if (sessionStorage.getItem('auth_retry_probe') !== '1') return;
        sessionStorage.removeItem('auth_retry_probe');
      } catch {
        return;
      }
      void fetchProfileDeduped();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [mounted, fetchProfileDeduped]);

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

    fetchProfileDeduped()
      .finally(() => setIsLoading(false));
  }, [mounted, fetchProfileDeduped]);

  /** Call after login/register — user object from server response */
  const login = useCallback((newUser: User) => {
    try {
      sessionStorage.removeItem('auth_retry_probe');
    } catch {
      /* ignore */
    }
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
    }
    setUser(null);
    setIsAuthenticated(false);
    setAvatarMediaVersion(0);
    setCoverMediaVersion(0);
    localStorage.removeItem('user');
    sessionStorage.clear();
    document.cookie = 'user_role=; path=/; max-age=0';
    // Hard navigation so the whole app tree unmounts and no stale state remains (fixes empty dashboard on next login).
    window.location.href = isStandalonePwaRuntime() ? '/pwa/onboarding' : '/';
  }, []);

  const hasRole = useCallback((...roles: Role[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    return fetchProfileDeduped();
  }, [fetchProfileDeduped]);

  return (
    <AuthContext.Provider value={{
      user, login, refreshUser, logout,
      isLoading, loading: isLoading,
      isAuthenticated,
      hasRole,
      avatarMediaVersion,
      coverMediaVersion,
      bumpAvatarMediaVersion,
      bumpCoverMediaVersion,
      profileMediaVersion: avatarMediaVersion,
      bumpProfileMediaVersion,
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
