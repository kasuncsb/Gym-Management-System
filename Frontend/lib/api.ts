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

  /** URL for profile avatar (cookie-authenticated). Include userId so cache keys are per-user; cacheBust after upload. */
  profileAvatarUrl: (userId?: string | null, cacheBust?: number) => {
    const params = new URLSearchParams();
    if (userId) params.set('u', userId);
    if (cacheBust != null) params.set('t', String(cacheBust));
    const q = params.toString();
    return `/api/auth/profile/avatar${q ? `?${q}` : ''}`;
  },

  /** URL for profile cover (cookie-authenticated). Include userId so cache keys are per-user; cacheBust after upload. */
  profileCoverUrl: (userId?: string | null, cacheBust?: number) => {
    const params = new URLSearchParams();
    if (userId) params.set('u', userId);
    if (cacheBust != null) params.set('t', String(cacheBust));
    const q = params.toString();
    return `/api/auth/profile/cover${q ? `?${q}` : ''}`;
  },

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

// ── Operations API (core gym domains) ────────────────────────────────────────
export interface OpsDashboard {
  activeMembers: number;
  todayVisits: number;
  openIssues: number;
  monthlyRevenue: number;
  myVisits?: number;
  myWorkouts?: number;
  sessionsToday?: number;
}

export const opsAPI = {
  // dashboards/reports
  dashboard: (role: 'admin' | 'manager' | 'trainer' | 'member' | 'staff') =>
    apiClient.get<{ success: boolean; data: OpsDashboard }>(`/ops/dashboard/${role}`).then(r => r.data.data),
  reportSummary: () =>
    apiClient.get('/ops/reports/summary').then(r => r.data.data),
  recentReports: () =>
    apiClient.get('/ops/reports/recent').then(r => r.data.data),

  // subscriptions/payments
  plans: (options?: { includeInactive?: boolean }) =>
    apiClient.get('/ops/subscriptions/plans', {
      params: options?.includeInactive ? { includeInactive: 'true' } : undefined,
    }).then(r => r.data.data as any[]),
  createPlan: (payload: { name: string; description?: string; planType: 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass'; price: number; durationDays: number; includedPtSessions?: number }) =>
    apiClient.post('/ops/subscriptions/plans', payload).then(r => r.data.data),
  updatePlan: (id: string, payload: Partial<{ name: string; description: string; price: number; durationDays: number; isActive: boolean }>) =>
    apiClient.patch(`/ops/subscriptions/plans/${id}`, payload).then(r => r.data.data),
  mySubscriptions: () =>
    apiClient.get('/ops/subscriptions/me').then(r => r.data.data as any[]),
  purchaseSubscription: (payload: { planId: string; paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online'; promotionCode?: string }) =>
    apiClient.post('/ops/subscriptions/purchase', payload).then(r => r.data.data),
  requestFreeze: (payload: { subscriptionId?: string; freezeStart: string; freezeEnd: string; reason?: string }) =>
    apiClient.post('/ops/subscriptions/freeze', payload).then(r => r.data.data),
  myPayments: () =>
    apiClient.get('/ops/payments/me').then(r => r.data.data as any[]),

  // visits / check-in
  checkIn: () =>
    apiClient.post('/ops/visits/check-in').then(r => r.data.data),
  checkOut: () =>
    apiClient.post('/ops/visits/check-out').then(r => r.data.data),
  myVisits: (limit = 20) =>
    apiClient.get('/ops/visits/me', { params: { limit } }).then(r => r.data.data as any[]),
  visits: (limit = 100) =>
    apiClient.get('/ops/visits', { params: { limit } }).then(r => r.data.data as any[]),

  // PT sessions
  myPtSessions: () =>
    apiClient.get('/ops/pt-sessions/me').then(r => r.data.data as any[]),
  trainerPtSessions: () =>
    apiClient.get('/ops/pt-sessions/trainer').then(r => r.data.data as any[]),
  createPtSession: (payload: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }) =>
    apiClient.post('/ops/pt-sessions', payload).then(r => r.data.data),

  // workouts / metrics
  myWorkoutPlans: () =>
    apiClient.get('/ops/workouts/plans/me').then(r => r.data.data as any[]),
  assignWorkoutPlan: (payload: { memberId: string; name: string; description?: string; difficulty?: 'beginner' | 'intermediate' | 'advanced'; durationWeeks: number; daysPerWeek: number }) =>
    apiClient.post('/ops/workouts/plans/assign', payload).then(r => r.data.data),
  myWorkoutLogs: () =>
    apiClient.get('/ops/workouts/logs/me').then(r => r.data.data as any[]),
  addWorkoutLog: (payload: { planId?: string; workoutDate: string; durationMin?: number; mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor'; caloriesBurned?: number; notes?: string }) =>
    apiClient.post('/ops/workouts/logs', payload).then(r => r.data.data),
  myMetrics: () =>
    apiClient.get('/ops/metrics/me').then(r => r.data.data as any[]),
  addMetric: (payload: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post('/ops/metrics/me', payload).then(r => r.data.data),
  addMemberMetric: (memberId: string, payload: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post(`/ops/metrics/member/${memberId}`, payload).then(r => r.data.data),

  // equipment / inventory
  equipment: () =>
    apiClient.get('/ops/equipment').then(r => r.data.data as any[]),
  updateEquipment: (id: string, payload: { status: 'operational' | 'needs_maintenance' | 'under_maintenance' | 'retired'; zoneLabel?: string }) =>
    apiClient.patch(`/ops/equipment/${id}`, payload).then(r => r.data.data),
  equipmentEvents: () =>
    apiClient.get('/ops/equipment-events').then(r => r.data.data as any[]),
  addEquipmentEvent: (payload: { equipmentId: string; eventType: 'issue_reported' | 'maintenance_done'; severity?: 'low' | 'medium' | 'high' | 'critical'; description: string; status?: 'open' | 'in_progress' | 'resolved' }) =>
    apiClient.post('/ops/equipment-events', payload).then(r => r.data.data),
  inventoryItems: () =>
    apiClient.get('/ops/inventory/items').then(r => r.data.data as any[]),
  addInventoryTxn: (payload: { itemId: string; txnType: 'restock' | 'sale' | 'adjustment' | 'waste'; qtyChange: number; reference?: string }) =>
    apiClient.post('/ops/inventory/transactions', payload).then(r => r.data.data),

  // messaging / users / closures / config
  messages: () =>
    apiClient.get('/ops/messages').then(r => r.data.data as any[]),
  markMessageRead: (id: string) =>
    apiClient.patch(`/ops/messages/${id}/read`).then(r => r.data.data),
  users: (role?: 'admin' | 'manager' | 'staff' | 'trainer' | 'member') =>
    apiClient.get('/ops/users', { params: role ? { role } : undefined }).then(r => r.data.data as any[]),
  createUser: (payload: { fullName: string; email: string; role: 'admin' | 'manager' | 'staff' | 'trainer' | 'member'; password: string; phone?: string }) =>
    apiClient.post('/ops/users', payload).then(r => r.data.data),
  updateUser: (id: string, payload: Partial<{ fullName: string; phone: string; isActive: boolean; role: 'admin' | 'manager' | 'staff' | 'trainer' | 'member'; memberStatus: 'active' | 'inactive' | 'suspended' }>) =>
    apiClient.patch(`/ops/users/${id}`, payload).then(r => r.data.data),
  members: () =>
    apiClient.get('/ops/members').then(r => r.data.data as any[]),
  closures: () =>
    apiClient.get('/ops/closures').then(r => r.data.data as any[]),
  createClosure: (payload: { closureDate: string; reason?: string; isEmergency?: boolean }) =>
    apiClient.post('/ops/closures', payload).then(r => r.data.data),
  deleteClosure: (id: string) =>
    apiClient.delete(`/ops/closures/${id}`).then(r => r.data.data),
  config: () =>
    apiClient.get('/ops/config').then(r => r.data.data as Array<{ key: string; value: string }>),
  updateConfig: (values: Record<string, string>) =>
    apiClient.patch('/ops/config', values).then(r => r.data.data),

  // simulator
  simulateGenerateDoorOtp: (expiresInSec = 120) =>
    apiClient.post('/ops/simulate/door/otp', { expiresInSec }).then(r => r.data.data as { token: string; code: string; expiresAt: string }),
  simulateDoorScan: (payload: { token: string; code: string; personId?: string }) =>
    apiClient.post('/ops/simulate/door/scan', payload).then(r => r.data.data),
  simulatePayment: (payload: { memberId: string; planId: string; paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' }) =>
    apiClient.post('/ops/simulate/payment', payload).then(r => r.data.data),
  simulateWorkout: (payload: { memberId: string; durationMin?: number; caloriesBurned?: number; notes?: string }) =>
    apiClient.post('/ops/simulate/workout', payload).then(r => r.data.data),
  simulateTrainerShift: (payload: { trainerId: string; action?: 'in' | 'out' }) =>
    apiClient.post('/ops/simulate/trainer-shift', payload).then(r => r.data.data),
  simulateAppointment: (payload: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }) =>
    apiClient.post('/ops/simulate/appointment', payload).then(r => r.data.data),
  simulationState: () =>
    apiClient.get('/ops/simulate/state').then(r => r.data.data as any),
};

// ── AI API ────────────────────────────────────────────────────────────────────
export const aiAPI = {
  health: () => apiClient.get('/ai/health').then(r => r.data.data),
  chat: (message: string) => apiClient.post('/ai/chat', { message }).then(r => r.data.data as { answer: string; source: 'rag' | 'gemini' | 'fallback' }),
  insights: (question?: string) => apiClient.post('/ai/insights', { question }).then(r => r.data.data as { summary: string; insights: string[]; generatedBy: 'gemini' | 'fallback' }),
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
