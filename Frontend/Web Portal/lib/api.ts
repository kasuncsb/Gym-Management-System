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
// Response interceptor for global error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 Unauthorized (Token expired)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        // Normalize error message from backend structure
        // Backend returns: { success: false, error: { code: '...', message: '...' } }
        if (error.response?.data?.error?.message) {
            error.message = error.response.data.error.message;
        } else if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        return Promise.reject(error);
    }
);

// Helper to extract user-friendly error message
export const getErrorMessage = (error: any): string => {
    if (error.response?.data?.error?.message) {
        return error.response.data.error.message;
    }
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
};

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

    verifyEmail: (token: string) =>
        apiClient.post('/auth/verify-email', { token }),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
        apiClient.post('/auth/reset-password', { token, newPassword }),
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

    uploadDocument: (data: { type: string; fileUrl: string }) =>
        apiClient.post('/members/documents', data),
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

    getUpcomingRenewals: () =>
        apiClient.get('/subscriptions/renewals/upcoming'),
};

export const qrAPI = {
    scan: (qrData: string, gateId?: string, deviceId?: string, location?: string) =>
        apiClient.post('/qr/scan', { qrData, gateId, deviceId, location }),

    getAttendanceHistory: (limit: number = 50) =>
        apiClient.get('/qr/attendance/history', { params: { limit } }),

    getAccessLogs: (startDate?: string, endDate?: string, status?: string, limit: number = 100) =>
        apiClient.get('/qr/access-logs', { params: { startDate, endDate, status, limit } }),
};

export const appointmentAPI = {
    create: (data: { trainerId: string; startTime: string; endTime: string; type?: string; notes?: string }) =>
        apiClient.post('/appointments', data),

    listMy: () =>
        apiClient.get('/appointments/me'),
};

export const leadAPI = {
    list: () =>
        apiClient.get('/leads'),

    create: (data: { name: string; email?: string; phone?: string; source?: string }) =>
        apiClient.post('/leads', data),

    updateStatus: (leadId: string, status: string, notes?: string) =>
        apiClient.patch(`/leads/${leadId}/status`, { status, notes }),
};

// Role-specific APIs
export const adminAPI = {
    getMetrics: () =>
        apiClient.get('/admin/metrics'),

    getPendingDocuments: () =>
        apiClient.get('/admin/documents/pending'),

    approveDocument: (id: string) =>
        apiClient.put(`/admin/documents/${id}/approve`),

    rejectDocument: (id: string, reason: string) =>
        apiClient.put(`/admin/documents/${id}/reject`, { reason }),

    getAllUsers: (page: number = 1, limit: number = 20) =>
        apiClient.get('/admin/users', { params: { page, limit } }),
};

export const managerAPI = {
    getMetrics: () =>
        apiClient.get('/manager/metrics'),

    getBranchMembers: (page: number = 1, limit: number = 20) =>
        apiClient.get('/manager/members', { params: { page, limit } }),

    getStaffList: () =>
        apiClient.get('/manager/staff'),
};

export const staffAPI = {
    getMetrics: () =>
        apiClient.get('/staff/metrics'),

    getTodayCheckIns: () =>
        apiClient.get('/staff/checkins/today'),

    getEquipmentStatus: () =>
        apiClient.get('/staff/equipment'),

    reportEquipmentIssue: (id: string) =>
        apiClient.post(`/staff/equipment/${id}/report`),
};

export default apiClient;
