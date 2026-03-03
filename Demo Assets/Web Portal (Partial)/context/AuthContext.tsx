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
    token: string | null;
    login: (accessToken: string, refreshToken: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map backend role to dashboard base path */
export function dashboardPathForRole(role: string): string {
    switch (role) {
        case 'admin': return '/admin-dashboard';
        case 'manager': return '/manager-dashboard';
        case 'staff':
        case 'trainer': return '/staff-dashboard';
        case 'member':
        default: return '/member';
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((accessToken: string, refreshToken: string, newUser: User) => {
        setToken(accessToken);
        setUser(newUser);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch { /* ignore */ }
        setToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
    }, [router]);

    const hasRole = useCallback((...roles: Role[]) => {
        return !!user && roles.includes(user.role);
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user, token, login, logout,
            isLoading, loading: isLoading,
            isAuthenticated: !!token && !!user,
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
