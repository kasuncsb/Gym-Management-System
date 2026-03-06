// API Client for PowerWorld Gyms — Auth Only
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

// Handle 401 — attempt refresh once, then redirect to login
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    refreshQueue.push((newToken: string) => {
                        original.headers.Authorization = `Bearer ${newToken}`;
                        resolve(apiClient(original));
                    });
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const rt = localStorage.getItem('refreshToken');
                if (!rt) throw new Error('No refresh token');

                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: rt });
                const newAccess = data.data.accessToken;
                const newRefresh = data.data.refreshToken;

                localStorage.setItem('accessToken', newAccess);
                localStorage.setItem('refreshToken', newRefresh);

                refreshQueue.forEach((cb) => cb(newAccess));
                refreshQueue = [];
                isRefreshing = false;

                original.headers.Authorization = `Bearer ${newAccess}`;
                return apiClient(original);
            } catch {
                isRefreshing = false;
                refreshQueue = [];
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        // Normalize error message
        if (error.response?.data?.error?.message) {
            error.message = error.response.data.error.message;
        } else if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        return Promise.reject(error);
    },
);

export const getErrorMessage = (error: any): string => {
    if (error.response?.data?.error?.message) return error.response.data.error.message;
    if (error.response?.data?.message) return error.response.data.message;
    return error.message || 'An unexpected error occurred';
};

// ── Auth ───────────────────────────────────────────
export const authAPI = {
    login: (email: string, password: string) =>
        apiClient.post('/auth/login', { email, password }),

    logout: () => apiClient.post('/auth/logout'),

    register: (data: { fullName: string; email: string; password: string; phone?: string; gender?: string }) =>
        apiClient.post('/auth/register', data),

    getProfile: () => apiClient.get('/auth/profile'),

    changePassword: (currentPassword: string, newPassword: string) =>
        apiClient.post('/auth/change-password', { currentPassword, newPassword }),

    refreshToken: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),

    sendVerificationEmail: () => apiClient.post('/auth/send-verification'),

    verifyEmail: (token: string) =>
        apiClient.post('/auth/verify-email', { token }),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
        apiClient.post('/auth/reset-password', { token, newPassword }),

    completeOnboarding: (data: {
        experienceLevel: 'beginner' | 'intermediate' | 'advanced';
        previousWorkouts?: string;
        fitnessGoals?: string;
        bloodType?: string;
        medicalConditions?: string;
        allergies?: string;
        emergencyName?: string;
        emergencyPhone?: string;
        emergencyRelation?: string;
    }) => apiClient.post('/auth/onboarding', data),
};

export default apiClient;
