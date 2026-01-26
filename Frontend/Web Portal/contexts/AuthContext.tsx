// Authentication Context
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, userType?: string) => Promise<void>;
    logout: () => void;
    register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string, userType: string = 'member') => {
        try {
            const response = await authAPI.login(email, password, userType);
            const { token, refreshToken, user: userData } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);

            // Redirect based on role
            if (userType === 'staff') {
                const role = userData.role;
                if (role === 'ADMIN') {
                    router.push('/admin');
                } else if (role === 'MANAGER') {
                    router.push('/manager');
                } else {
                    router.push('/staff');
                }
            } else if (userType === 'trainer') {
                router.push('/trainer');
            } else {
                router.push('/member');
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || 'Login failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    const register = async (data: any) => {
        try {
            const response = await authAPI.register(data);
            // Auto-login after registration
            await login(data.email, data.password);
        } catch (error: any) {
            throw new Error(error.response?.data?.error?.message || 'Registration failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
