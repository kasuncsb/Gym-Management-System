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

    // 429: do not retry (avoids amplifying rate-limit lockout). Reject with clear message.
    if (error.response?.status === 429) {
      return Promise.reject(error);
    }

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

  /** Update basic info (fullName, phone, dob, gender; members: emergency contact). */
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    dob?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
  }) => apiClient.patch('/auth/profile', data),

  /** Upload profile avatar (image file). Use profileAvatarUrl() for img src. */
  uploadAvatar: (file: File, config?: { onUploadProgress?: (e: { loaded: number; total?: number }) => void }) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/auth/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  },

  /** Upload profile cover image. Use profileCoverUrl() for img src. */
  uploadCover: (file: File, config?: { onUploadProgress?: (e: { loaded: number; total?: number }) => void }) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/auth/profile/cover', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  },

  /** URL for profile avatar image (cookie-authenticated). Pass cacheBust (e.g. Date.now()) after upload. */
  profileAvatarUrl: (cacheBust?: number) =>
    `/api/auth/profile/avatar${cacheBust != null ? `?t=${cacheBust}` : ''}`,

  /** URL for profile cover image (cookie-authenticated). Pass cacheBust after upload. */
  profileCoverUrl: (cacheBust?: number) =>
    `/api/auth/profile/cover${cacheBust != null ? `?t=${cacheBust}` : ''}`,

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

  uploadIdDocuments: (formData: FormData, config?: { onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void }) =>
    apiClient.post('/auth/upload-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    }),

  // Admin endpoints (ID documents are streamed from backend; fetch with credentials to display)
  getIdSubmissions: () => apiClient.get('/auth/admin/id-submissions'),

  /** Fetches ID document image as blob (sends cookies). Use URL.createObjectURL(blob) for img src. */
  getIdDocumentBlob: (userId: string, type: 'front' | 'back') =>
    apiClient.get<Blob>(`/auth/admin/id-document/${userId}/${type}`, { responseType: 'blob' }).then(r => r.data),

  adminVerifyId: (userId: string, status: 'approved' | 'rejected', note?: string) =>
    apiClient.post(`/auth/admin/verify-id/${userId}`, { status, note }),
};

/** Safely read API error message; handles HTML or non-standard response bodies from proxies. */
function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error) || !error.response?.data) return null;
  const data = error.response.data;
  if (typeof data !== 'object' || data === null) return null;
  const err = (data as Record<string, unknown>).error;
  if (typeof err !== 'object' || err === null) return null;
  const msg = (err as Record<string, unknown>).message;
  return typeof msg === 'string' ? msg : null;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMsg = getApiErrorMessage(error);
    if (apiMsg) return apiMsg;
    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a few minutes and try again.';
    }
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status && error.response.status >= 500) {
      return 'The server is temporarily unavailable. Please try again later.';
    }
    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export default apiClient;
