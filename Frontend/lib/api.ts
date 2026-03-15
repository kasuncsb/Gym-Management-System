/**
 * API client — axios instance using Next.js proxy at /api.
 * Authentication is handled entirely via httpOnly cookies set by the backend.
 * No tokens are stored or managed client-side.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Response interceptor: handle token expiry ─────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(null));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't retry refresh, login/register requests, or endpoints flagged with _noRetry.
    // BUG-13 fix: Without the _noRetry guard, mutation endpoints (logout,
    // change-password, send-verification) would be silently re-fired after a
    // token refresh, potentially triggering side-effects twice.
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original._noRetry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/register') ||
      // Profile 401s are handled by AuthContext's own catch — don't cascade to refresh
      original.url?.includes('/auth/profile')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(original));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Refresh — cookies sent automatically (same origin)
      await apiClient.post('/auth/refresh');
      processQueue(null);
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError);
      
      // Refresh failed. Only forcefully redirect if on a protected route.
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const publicRoutes = [
          '/', '/login',
          '/member/register', '/member/register/personal-details',
          '/member/register/identity-verification', '/member/register/subscription',
          '/member/register/verify-email', '/member/register/dashboard',
          '/member/forgot-password', '/member/forgot-password/pin-code',
          '/member/forgot-password/new-password', '/member/forgot-password/success',
          '/member/verify-email', '/member/reset-password',
        ];
        if (!publicRoutes.some(r => path === r || path.startsWith(r + '/'))) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    gender?: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;
    bloodType?: string;
    medicalConditions?: string;
    allergies?: string;
  }) => apiClient.post('/auth/register', data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout', undefined, { _noRetry: true } as any),

  refresh: () => apiClient.post('/auth/refresh'),

  getProfile: () => apiClient.get('/auth/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }, { _noRetry: true } as any),

  sendVerificationEmail: () => apiClient.post('/auth/send-verification', null, { _noRetry: true } as any),

  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),

  completeOnboarding: (data: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    fitnessGoals?: string;
    bloodType?: string;
    medicalConditions?: string;
    allergies?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
  }) => apiClient.post('/auth/onboarding', data),

  uploadIdDocuments: (formData: FormData) =>
    apiClient.post('/auth/upload-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Admin endpoints (ID documents are streamed from backend; fetch with credentials to display)
  getIdSubmissions: () => apiClient.get('/auth/admin/id-submissions'),

  /** Fetches ID document image as blob (sends cookies). Use URL.createObjectURL(blob) for img src. */
  getIdDocumentBlob: (userId: string, type: 'front' | 'back') =>
    apiClient.get<Blob>(`/auth/admin/id-document/${userId}/${type}`, { responseType: 'blob' }).then(r => r.data),

  adminVerifyId: (userId: string, status: 'approved' | 'rejected', note?: string) =>
    apiClient.post(`/auth/admin/verify-id/${userId}`, { status, note }),
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export default apiClient;
