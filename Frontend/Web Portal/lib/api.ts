// API Client for PowerWorld Gyms — Phase 1
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

    register: (data: any) =>
        apiClient.post('/members/register', data),

    getProfile: () => apiClient.get('/auth/profile'),

    changePassword: (oldPassword: string, newPassword: string) =>
        apiClient.post('/auth/change-password', { oldPassword, newPassword }),

    refreshToken: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refreshToken }),

    getQRCode: () => apiClient.get('/auth/qr-code'),

    verifyEmail: (token: string) =>
        apiClient.post('/auth/verify-email', { token }),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
        apiClient.post('/auth/reset-password', { token, newPassword }),
};

// ── Members ────────────────────────────────────────
export const memberAPI = {
    getProfile: () => apiClient.get('/members/profile'),

    updateProfile: (data: any) => apiClient.put('/members/profile', data),

    getAll: (page = 1, limit = 20, status?: string) =>
        apiClient.get('/members', { params: { page, limit, status } }),

    search: (query: string) =>
        apiClient.get('/members/search', { params: { q: query } }),

    getStats: () => apiClient.get('/members/stats'),

    uploadDocument: (data: { documentType: string; storageKey: string; originalFilename?: string; mimeType?: string; fileSizeBytes?: number }) =>
        apiClient.post('/members/documents', data),
};

// ── Subscriptions ──────────────────────────────────
export const subscriptionAPI = {
    validate: () => apiClient.get('/subscriptions/validate'),
    getMySubscriptions: () => apiClient.get('/subscriptions/my-subscriptions'),
    getActive: () => apiClient.get('/subscriptions/active'),
    getAllPlans: () => apiClient.get('/subscriptions/plans'),
    getPlan: (id: string) => apiClient.get(`/subscriptions/plans/${id}`),
    getUpcomingRenewals: () => apiClient.get('/subscriptions/renewals/upcoming'),
};

// ── QR / Access ────────────────────────────────────
export const qrAPI = {
    scan: (qrData: string, gateId?: string) =>
        apiClient.post('/qr/scan', { qrData, gateId }),

    getAttendanceHistory: (limit = 50) =>
        apiClient.get('/qr/attendance/history', { params: { limit } }),

    getAccessLogs: (startDate?: string, endDate?: string, authorized?: string, limit = 100) =>
        apiClient.get('/qr/access-logs', { params: { startDate, endDate, authorized, limit } }),
};

// ── Equipment ──────────────────────────────────────
export const equipmentAPI = {
    list: (branchId?: string) => apiClient.get('/equipment', { params: { branchId } }),
    create: (data: any) => apiClient.post('/equipment', data),
    reportIssue: (equipmentId: string, data: any) =>
        apiClient.post(`/equipment/${equipmentId}/issues`, data),
    logMaintenance: (equipmentId: string, data: any) =>
        apiClient.post(`/equipment/${equipmentId}/maintenance`, data),
    getOpenIssues: (branchId?: string) =>
        apiClient.get('/equipment/issues', { params: { branchId } }),
};

// ── Admin ──────────────────────────────────────────
export const adminAPI = {
    getMetrics: () => apiClient.get('/admin/metrics'),
    getPendingDocuments: () => apiClient.get('/admin/documents/pending'),
    approveDocument: (id: string) => apiClient.put(`/admin/documents/${id}/approve`),
    rejectDocument: (id: string, reason: string, note?: string) =>
        apiClient.put(`/admin/documents/${id}/reject`, { reason, note }),
    getAllUsers: (page = 1, limit = 20) =>
        apiClient.get('/admin/users', { params: { page, limit } }),
};

// ── Manager ────────────────────────────────────────
export const managerAPI = {
    getMetrics: () => apiClient.get('/manager/metrics'),
    getBranchMembers: (page = 1, limit = 20) =>
        apiClient.get('/manager/members', { params: { page, limit } }),
    getStaffList: (page = 1, limit = 50) =>
        apiClient.get('/manager/staff', { params: { page, limit } }),
};

// ── Staff ──────────────────────────────────────────
export const staffAPI = {
    getMetrics: () => apiClient.get('/staff/metrics'),
    getTodayCheckIns: () => apiClient.get('/staff/checkins/today'),
    getEquipmentStatus: () => apiClient.get('/staff/equipment'),
    reportEquipmentIssue: (id: string) => apiClient.post(`/staff/equipment/${id}/report`),
};

// ── Public ─────────────────────────────────────────
export const publicAPI = {
    getPlans: () => apiClient.get('/public/plans'),
    getBranches: () => apiClient.get('/public/branches'),
    getStats: () => apiClient.get('/public/stats'),
    getFeaturedTrainers: () => apiClient.get('/public/trainers'),
};

export default apiClient;
