// API Client for PowerWorld Gyms
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API Services
export const authAPI = {
    login: (email: string, password: string, userType: string = 'member') =>
        apiClient.post('/auth/login', { email, password, userType }),

    register: (data: any) =>
        apiClient.post('/members/register', data),

    getProfile: () =>
        apiClient.get('/auth/profile'),

    changePassword: (oldPassword: string, newPassword: string) =>
        apiClient.post('/auth/change-password', { oldPassword, newPassword }),

    refreshToken: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),

    getQRCode: () =>
        apiClient.get('/auth/qr-code'),
};

export const memberAPI = {
    getProfile: () =>
        apiClient.get('/members/profile'),

    updateProfile: (data: any) =>
        apiClient.put('/members/profile', data),

    getAll: (page: number = 1, limit: number = 20, status?: string) =>
        apiClient.get('/members', { params: { page, limit, status } }),

    search: (query: string) =>
        apiClient.get('/members/search', { params: { q: query } }),

    getStats: () =>
        apiClient.get('/members/stats'),
};

export const subscriptionAPI = {
    validate: () =>
        apiClient.get('/subscriptions/validate'),

    getMySubscriptions: () =>
        apiClient.get('/subscriptions/my-subscriptions'),

    getActive: () =>
        apiClient.get('/subscriptions/active'),

    getAllPlans: () =>
        apiClient.get('/subscriptions/plans'),

    getPlan: (id: string) =>
        apiClient.get(`/subscriptions/plans/${id}`),
};

export const qrAPI = {
    scan: (qrData: string, gateId?: string, deviceId?: string, location?: string) =>
        apiClient.post('/qr/scan', { qrData, gateId, deviceId, location }),

    getAttendanceHistory: (limit: number = 50) =>
        apiClient.get('/qr/attendance/history', { params: { limit } }),

    getAccessLogs: (startDate?: string, endDate?: string, status?: string, limit: number = 100) =>
        apiClient.get('/qr/access-logs', { params: { startDate, endDate, status, limit } }),
};

export default apiClient;
