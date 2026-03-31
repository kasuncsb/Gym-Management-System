/**
 * API client — axios instance using Next.js proxy at /api.
 * Authentication is handled entirely via httpOnly cookies set by the backend.
 * No tokens are stored or managed client-side.
 */
import axios, { type AxiosError } from 'axios';

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

      // Refresh failed. Redirect to login only for auth failures — not for 429 (rate limit) or network errors.
      if (typeof window !== 'undefined') {
        const st = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
        if (st !== 429) {
          const path = window.location.pathname;
          const publicRoutes = [
            '/', '/login',
            '/simulate',
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
  // member extras
  myVisits?: number;
  myWorkouts?: number;
  // trainer extras
  sessionsToday?: number;
  upcomingSessions?: number;
  assignedMembersCount?: number;
  pendingEquipmentIssues?: number;
  // manager extras
  trainersOnShift?: number;
  pendingIdVerifications?: number;
  // admin extras
  systemAlertCount?: number;
}

export type DashboardLinePoint = { label: string; value: number };
export type ManagerActivityPoint = { label: string; visits: number; workouts: number; ptSessions: number };

export type MemberDashboardAnalytics = {
  weeklyWorkoutActivity: DashboardLinePoint[];
  workoutFrequency: DashboardLinePoint[];
};

export type ManagerDashboardAnalytics = {
  occupancyTrend: DashboardLinePoint[];
  avgHourlyOccupancy: DashboardLinePoint[];
  revenueTrend: DashboardLinePoint[];
  activityOverview: ManagerActivityPoint[];
};

/** Branch PT booking constraints (config + calendar day context when returned from availability). */
export type PtBookingRules = {
  timezone: string;
  gymOpen: string;
  gymClose: string;
  minBookDate: string;
  maxBookDate: string;
  advanceDaysMax: number;
  isClosedDay?: boolean;
};

export type TrainerPtAvailability = {
  trainerId: string;
  trainerName: string;
  date: string;
  hasShift: boolean;
  workingWindows: Array<{ start: string; end: string; shiftType: string; status: string }>;
  busySlots: Array<{ startTime: string; endTime: string; status: string }>;
  bookingRules: PtBookingRules;
};

/** Body shape for POST /ai/workout-plan and /ops/workouts/plans/generate */
export type AiWorkoutPlanPreferencesPayload = {
  primaryFocus?: string;
  daysPerWeek?: string;
  sessionLength?: string;
  equipmentAccess?: string;
  emphasis?: string;
  avoidOrInjuries?: string;
  extraNotes?: string;
};

export const opsAPI = {
  // dashboards/reports
  dashboard: (role: 'admin' | 'manager' | 'trainer' | 'member') =>
    apiClient.get<{ success: boolean; data: OpsDashboard }>(`/ops/dashboard/${role}`).then(r => r.data.data),
  dashboardAnalytics: (role: 'manager' | 'member') =>
    apiClient
      .get<{ success: boolean; data: MemberDashboardAnalytics | ManagerDashboardAnalytics }>(`/ops/dashboard/${role}/analytics`)
      .then((r) => r.data.data),
  reportSummary: (params?: { type?: string; fromDate?: string; toDate?: string }) =>
    apiClient.get('/ops/reports/summary', { params }).then(r => r.data.data),
  recentReports: () =>
    apiClient.get('/ops/reports/recent').then(r => r.data.data),

  // subscriptions/payments
  /** Public catalog (no auth). */
  publicSubscriptionPlans: () =>
    apiClient.get('/ops/public/subscription-plans').then(r => r.data.data as any[]),
  plans: (options?: { includeInactive?: boolean }) =>
    apiClient.get('/ops/subscriptions/plans', {
      params: options?.includeInactive ? { includeInactive: 'true' } : undefined,
    }).then(r => r.data.data as any[]),
  createPlan: (payload: { name: string; description?: string; planType: 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass'; price: number; durationDays: number }) =>
    apiClient.post('/ops/subscriptions/plans', payload).then(r => r.data.data),
  updatePlan: (id: string, payload: Partial<{ name: string; description: string; price: number; durationDays: number; isActive: boolean }>) =>
    apiClient.patch(`/ops/subscriptions/plans/${id}`, payload).then(r => r.data.data),
  mySubscriptions: () =>
    apiClient.get('/ops/subscriptions/me').then(r => r.data.data as any[]),
  purchaseSubscription: (payload: {
    planId: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    promotionCode?: string;
    cardPan?: string;
  }) => apiClient.post('/ops/subscriptions/purchase', payload).then(r => r.data.data),
  myPayments: () =>
    apiClient.get('/ops/payments/me').then(r => r.data.data as any[]),
  downloadInvoiceHtml: async (paymentId: string) => {
    const res = await apiClient.get<string>(`/ops/payments/${paymentId}/invoice`, { responseType: 'text' as any });
    return res.data;
  },

  // visits / check-in
  checkIn: () =>
    apiClient.post('/ops/visits/check-in').then(r => r.data.data),
  checkOut: () =>
    apiClient.post('/ops/visits/check-out').then(r => r.data.data),
  doorScan: (payload: { token: string; code: string }) =>
    apiClient.post('/ops/visits/door-scan', payload).then(r => r.data.data),
  branchCapacity: () =>
    apiClient.get('/ops/branch/capacity').then(r => r.data.data as { capacity: number }),
  systemStatus: () =>
    apiClient.get('/ops/system/status').then(r => r.data.data as { maintenanceMode: boolean }),
  myVisits: (limit = 20) =>
    apiClient.get('/ops/visits/me', { params: { limit } }).then(r => r.data.data as any[]),
  visitStats: () =>
    apiClient.get('/ops/visits/stats').then(r => r.data.data as { activeNow: number; todayTotal: number }),
  visits: (limit = 100) =>
    apiClient.get('/ops/visits', { params: { limit } }).then(r => r.data.data as any[]),

  // PT sessions
  myPtSessions: () =>
    apiClient.get('/ops/pt-sessions/me').then(r => r.data.data as any[]),
  trainerPtSessions: () =>
    apiClient.get('/ops/pt-sessions/trainer').then(r => r.data.data as any[]),
  /** Shift windows + booked/confirmed blocks for a trainer on a given date (booking helper). */
  trainerPtAvailability: (trainerId: string, date: string) =>
    apiClient
      .get('/ops/pt-sessions/availability', { params: { trainerId, date } })
      .then((r) => r.data.data as TrainerPtAvailability),
  ptBookingRules: () =>
    apiClient.get('/ops/pt-sessions/booking-rules').then((r) => r.data.data as PtBookingRules),
  allPtSessions: () =>
    apiClient.get('/ops/pt-sessions').then(r => r.data.data as any[]),
  createPtSession: (payload: {
    memberId: string;
    trainerId: string;
    sessionDate: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
  }) => apiClient.post('/ops/pt-sessions', payload).then(r => r.data.data),
  updatePtSession: (
    id: string,
    payload: {
      status?: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
      cancelReason?: string;
      reviewRating?: number;
      reviewComment?: string | null;
    },
  ) => apiClient.patch(`/ops/pt-sessions/${id}`, payload).then(r => r.data.data),

  // workouts / metrics
  myWorkoutPlans: () =>
    apiClient.get('/ops/workouts/plans/me').then(r => r.data.data as any[]),
  memberWorkoutPlans: (memberId: string) =>
    apiClient.get(`/ops/workouts/plans/member/${memberId}`).then(r => r.data.data as any[]),
  removeMyWorkoutPlan: (planId: string) =>
    apiClient.delete(`/ops/workouts/plans/me/${planId}`).then(r => r.data.data),
  assignWorkoutPlan: (payload: { memberId: string; name: string; description?: string; difficulty?: 'beginner' | 'intermediate' | 'advanced'; durationWeeks: number; daysPerWeek: number; libraryPlanId?: string }) =>
    apiClient.post('/ops/workouts/plans/assign', payload).then(r => r.data.data),
  generateAiWorkoutPlan: (payload?: { memberId?: string; preferences?: AiWorkoutPlanPreferencesPayload }) =>
    apiClient.post('/ops/workouts/plans/generate', payload ?? {}).then(r => r.data.data),
  myWorkoutLogs: () =>
    apiClient.get('/ops/workouts/logs/me').then(r => r.data.data as any[]),
  addWorkoutLog: (payload: { planId?: string; workoutDate: string; durationMin?: number; mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor'; caloriesBurned?: number; notes?: string }) =>
    apiClient.post('/ops/workouts/logs', payload).then(r => r.data.data),
  activeWorkoutSession: () =>
    apiClient.get('/ops/workouts/sessions/active').then(r => r.data.data as any | null),
  startWorkoutSession: (payload: { planId?: string; notes?: string }) =>
    apiClient.post('/ops/workouts/sessions/start', payload).then(r => r.data.data),
  addWorkoutSessionEvent: (sessionId: string, payload: {
    eventType: 'paused' | 'resumed' | 'exercise_started' | 'set_completed' | 'exercise_completed' | 'simulated';
    payload?: Record<string, unknown>;
  }) =>
    apiClient.post(`/ops/workouts/sessions/${sessionId}/events`, payload).then(r => r.data.data),
  stopWorkoutSession: (sessionId: string, payload?: {
    complete?: boolean;
    durationMin?: number;
    caloriesBurned?: number;
    mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor';
    notes?: string;
  }) =>
    apiClient.post(`/ops/workouts/sessions/${sessionId}/stop`, payload ?? {}).then(r => r.data.data),
  myMetrics: () =>
    apiClient.get('/ops/metrics/me').then(r => r.data.data as any[]),
  memberMetrics: (memberId: string) =>
    apiClient.get(`/ops/metrics/member/${memberId}`).then(r => r.data.data as any[]),
  addMetric: (payload: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post('/ops/metrics/me', payload).then(r => r.data.data),
  addMemberMetric: (memberId: string, payload: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post(`/ops/metrics/member/${memberId}`, payload).then(r => r.data.data),

  // subscriptions (admin/manager)
  allSubscriptions: () =>
    apiClient.get('/ops/subscriptions').then(r => r.data.data as any[]),
  allPayments: () =>
    apiClient.get('/ops/payments').then(r => r.data.data as any[]),

  // equipment / inventory
  equipment: () =>
    apiClient.get('/ops/equipment').then(r => r.data.data as any[]),
  createEquipment: (payload: { name: string; category: 'cardio' | 'strength_machine' | 'free_weight' | 'bench' | 'accessory' | 'other'; quantity: number; zoneLabel?: string }) =>
    apiClient.post('/ops/equipment', payload).then(r => r.data.data),
  updateEquipment: (id: string, payload: { status: 'operational' | 'needs_maintenance' | 'under_maintenance' | 'retired'; zoneLabel?: string }) =>
    apiClient.patch(`/ops/equipment/${id}`, payload).then(r => r.data.data),
  equipmentEvents: () =>
    apiClient.get('/ops/equipment-events').then(r => r.data.data as any[]),
  addEquipmentEvent: (payload: { equipmentId: string; eventType: 'issue_reported' | 'maintenance_done'; severity?: 'low' | 'medium' | 'high' | 'critical'; description: string; status?: 'open' | 'in_progress' | 'resolved' }) =>
    apiClient.post('/ops/equipment-events', payload).then(r => r.data.data),
  resolveEquipmentEvent: (id: string) =>
    apiClient.patch(`/ops/equipment-events/${id}/resolve`).then(r => r.data.data),
  inventoryItems: () =>
    apiClient.get('/ops/inventory/items').then(r => r.data.data as any[]),
  createInventoryItem: (payload: { name: string; category: string; qtyInStock: number; reorderThreshold: number }) =>
    apiClient.post('/ops/inventory/items', payload).then(r => r.data.data),
  updateInventoryItem: (id: string, payload: Partial<{ name: string; category: string; reorderThreshold: number; isActive: boolean }>) =>
    apiClient.patch(`/ops/inventory/items/${id}`, payload).then(r => r.data.data),
  inventoryTransactions: (itemId?: string) =>
    apiClient.get('/ops/inventory/transactions', { params: itemId ? { itemId } : undefined }).then(r => r.data.data as any[]),
  addInventoryTxn: (payload: { itemId: string; txnType: 'restock' | 'sale' | 'adjustment' | 'waste'; qtyChange: number; reference?: string }) =>
    apiClient.post('/ops/inventory/transactions', payload).then(r => r.data.data),

  // staff broadcast (audit trail only; replaces legacy in-app messages)
  staffBroadcast: (payload: { subject: string; body: string; targetRole?: string | null; toPersonId?: string | null; priority?: 'low' | 'normal' | 'high' | 'critical' }) =>
    apiClient.post('/ops/staff-broadcast', payload).then(r => r.data.data),
  trainers: () =>
    apiClient.get('/ops/trainers').then(r => r.data.data as Array<{ id: string; fullName: string }>),
  users: (role?: 'admin' | 'manager' | 'trainer' | 'member') =>
    apiClient.get('/ops/users', { params: role ? { role } : undefined }).then(r => r.data.data as any[]),
  createUser: (payload: {
    fullName: string;
    email: string;
    role: 'admin' | 'manager' | 'trainer' | 'member';
    password: string;
    phone?: string;
    dob?: string;
    gender?: 'male' | 'female' | 'other';
    nicNumber?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    bloodType?: string;
    medicalConditions?: string;
    allergies?: string;
    memberStatus?: 'active' | 'inactive' | 'suspended';
    hireDate?: string;
    designation?: string;
    specialization?: string;
    ptHourlyRate?: number;
    yearsExperience?: number;
  }) => apiClient.post('/ops/users', payload).then(r => r.data.data),
  updateUser: (id: string, payload: Partial<{ fullName: string; phone: string; isActive: boolean; role: 'admin' | 'manager' | 'trainer' | 'member'; memberStatus: 'active' | 'inactive' | 'suspended' }>) =>
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

  auditLogs: (limit = 500) =>
    apiClient.get('/ops/audit-logs', { params: { limit } }).then(r => r.data.data as any[]),

  // promotions
  promotions: () =>
    apiClient.get('/ops/promotions').then(r => r.data.data as any[]),
  createPromotion: (payload: { code: string; name: string; discountType: 'percentage' | 'fixed'; discountValue: number; validFrom: string; validUntil?: string; isActive?: boolean }) =>
    apiClient.post('/ops/promotions', payload).then(r => r.data.data),
  updatePromotion: (id: string, payload: Partial<{ name: string; discountType: 'percentage' | 'fixed'; discountValue: number; validFrom: string; validUntil: string; isActive: boolean }>) =>
    apiClient.patch(`/ops/promotions/${id}`, payload).then(r => r.data.data),
  deactivatePromotion: (id: string) =>
    apiClient.delete(`/ops/promotions/${id}`).then(r => r.data.data),

  workoutLibrary: () =>
    apiClient.get('/ops/workouts/library').then(r => r.data.data as any[]),
  getWorkoutPlan: (planId: string) =>
    apiClient.get(`/ops/workouts/plans/${planId}`).then(r => r.data.data as any),
  patchWorkoutPlan: (planId: string, payload: { program: Record<string, unknown> }) =>
    apiClient.patch(`/ops/workouts/plans/${planId}`, payload).then(r => r.data.data),

  // shifts
  shifts: (filters?: { staffId?: string; shiftDate?: string }) =>
    apiClient.get('/ops/shifts', { params: filters }).then(r => r.data.data as any[]),
  myShifts: () =>
    apiClient.get('/ops/shifts/me').then(r => r.data.data as any[]),
  createShift: (payload: { staffId: string; shiftType: 'morning' | 'afternoon' | 'evening' | 'full_day'; shiftDate: string; startTime: string; endTime: string; notes?: string }) =>
    apiClient.post('/ops/shifts', payload).then(r => r.data.data),
  updateShift: (id: string, status: 'scheduled' | 'active' | 'completed' | 'missed' | 'swapped') =>
    apiClient.patch(`/ops/shifts/${id}`, { status }).then(r => r.data.data),

  // simulator
  simulateGenerateDoorOtp: (expiresInSec = 120) =>
    apiClient.post('/ops/simulate/door/otp', { expiresInSec }).then(r => r.data.data as { token: string; code: string; expiresAt: string }),
  simulateDoorScan: (payload: { token: string; code: string; personId?: string }) =>
    apiClient.post('/ops/simulate/door/scan', payload).then(r => r.data.data),
  simulatePayment: (payload: { memberId: string; planId: string; paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' }) =>
    apiClient.post('/ops/simulate/payment', payload).then(r => r.data.data),
  simulateWorkout: (payload: { memberId: string; durationMin?: number; caloriesBurned?: number; notes?: string; action?: 'simulate' | 'start' | 'stop' }) =>
    apiClient.post('/ops/simulate/workout', payload).then(r => r.data.data),
  simulateTrainerShift: (payload: { trainerId: string; action?: 'in' | 'out' }) =>
    apiClient.post('/ops/simulate/trainer-shift', payload).then(r => r.data.data),
  simulateAppointment: (payload: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }) =>
    apiClient.post('/ops/simulate/appointment', payload).then(r => r.data.data),
  simulateVitals: (payload: { memberId: string; weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post('/ops/simulate/vitals', payload).then(r => r.data.data),
  simulationState: () =>
    apiClient.get('/ops/simulate/state').then(r => r.data.data as any),

  // public simulator endpoints (no auth required)
  publicSimulationBootstrap: () =>
    apiClient.get('/ops/simulate/public/bootstrap').then(r => r.data.data as { members: any[]; trainers: any[]; plans: any[]; state: any }),
  publicSimulateGenerateDoorOtp: (expiresInSec = 120) =>
    apiClient.post('/ops/simulate/public/door/otp', { expiresInSec }).then(r => r.data.data as { token: string; code: string; expiresAt: string }),
  publicSimulateDoorScan: (payload: { token: string; code: string; personId: string }) =>
    apiClient.post('/ops/simulate/public/door/scan', payload).then(r => r.data.data),
  publicSimulatePayment: (payload: { memberId: string; planId: string; paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' }) =>
    apiClient.post('/ops/simulate/public/payment', payload).then(r => r.data.data),
  publicSimulateCardPayment: (payload: { memberId: string; planId: string; cardPan: string; cardHolder?: string }) =>
    apiClient.post('/ops/simulate/public/payment/card', payload).then(r => r.data.data),
  publicSimulateWorkout: (payload: { memberId: string; durationMin?: number; caloriesBurned?: number; notes?: string; action?: 'simulate' | 'start' | 'stop' }) =>
    apiClient.post('/ops/simulate/public/workout', payload).then(r => r.data.data),
  publicSimulateTrainerShift: (payload: { trainerId: string; action?: 'in' | 'out' }) =>
    apiClient.post('/ops/simulate/public/trainer-shift', payload).then(r => r.data.data),
  publicSimulateAppointment: (payload: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }) =>
    apiClient.post('/ops/simulate/public/appointment', payload).then(r => r.data.data),
  publicSimulateVitals: (payload: { memberId: string; weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string }) =>
    apiClient.post('/ops/simulate/public/vitals', payload).then(r => r.data.data),
  publicSimulationState: () =>
    apiClient.get('/ops/simulate/public/state').then(r => r.data.data as any),
};

// ── AI API ────────────────────────────────────────────────────────────────────
export type AiChatHistoryMessage = { role: 'user' | 'assistant'; text: string };

export const aiAPI = {
  health: () => apiClient.get('/ai/health').then(r => r.data.data),
  /** Latest session transcript for the logged-in user (persisted server-side). */
  chatHistory: (sessionId?: string) =>
    apiClient
      .get('/ai/chat/history', { params: sessionId ? { sessionId } : undefined })
      .then((r) => r.data.data as { sessionId: string | null; messages: AiChatHistoryMessage[] }),
  /** Longer timeout: Gemini may take >15s for full chat replies after raising output token budget. */
  chat: (message: string, sessionId?: string) =>
    apiClient
      .post('/ai/chat', { message, sessionId }, { timeout: 90_000 })
      .then(r => r.data.data as { answer: string; source: 'rag' | 'gemini' | 'fallback'; sessionId: string }),
  insights: (question?: string) =>
    apiClient
      .post('/ai/insights', { question }, { timeout: 90_000 })
      .then(
        r =>
          r.data.data as {
            content: string;
            summary: string;
            insights: string[];
            generatedBy: 'gemini' | 'fallback';
          },
      ),
  workoutPlan: (opts?: { memberId?: string; preferences?: AiWorkoutPlanPreferencesPayload }) =>
    apiClient
      .post('/ai/workout-plan', {
        ...(opts?.memberId ? { memberId: opts.memberId } : {}),
        ...(opts?.preferences ? { preferences: opts.preferences } : {}),
      })
      .then(r => r.data.data as { id?: string | null; name?: string | null; source?: string | null }),
};

/** Safely read API error message; handles HTML, nginx/proxy bodies, and rate-limit JSON. */
function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error) || !error.response?.data) return null;
  const data = error.response.data;
  if (typeof data === 'string') {
    const t = data.trim();
    if (t.startsWith('<')) return null;
    return t.length ? t.slice(0, 800) : null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const nested = d.error;
  if (typeof nested === 'object' && nested !== null) {
    const msg = (nested as Record<string, unknown>).message;
    if (typeof msg === 'string' && msg.length) return msg;
  }
  if (typeof nested === 'string' && nested.length) return nested;
  if (typeof d.message === 'string' && d.message.length) return d.message;
  return null;
}

function retryAfterHint(error: AxiosError): string {
  const raw = error.response?.headers?.['retry-after'];
  if (raw == null) return '';
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0 && n < 3600) return ` Try again in about ${n}s.`;
  return '';
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMsg = getApiErrorMessage(error);
    if (apiMsg) return apiMsg;
    const st = error.response?.status;
    const ra = retryAfterHint(error);

    if (st === 429) {
      return `Too many requests.${ra || ' Please wait a minute and try again.'}`.trim();
    }
    if (st === 408 || error.code === 'ECONNABORTED') {
      return 'The request timed out. Check your connection and try again.';
    }
    if (st === 413) {
      return 'The upload or request body is too large. Try a smaller file or shorter text.';
    }
    if (st === 415) {
      return 'This file type is not supported for upload.';
    }
    if (st === 401) {
      return 'Your session has expired or you are not signed in.';
    }
    if (st === 403) return 'You do not have permission to perform this action.';
    if (st === 404) return 'The requested resource was not found.';
    if (st === 409) {
      return 'This action conflicts with the current data. Refresh the page and try again.';
    }
    if (st === 422) {
      return 'Some fields are invalid. Check your input and try again.';
    }
    if (st === 502 || st === 503 || st === 504) {
      return 'The service is temporarily unavailable. Please try again shortly.';
    }
    if (st !== undefined && st >= 500) {
      return 'The server is temporarily unavailable. Please try again later.';
    }

    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Network error — check your connection and that the server is reachable.';
      }
      return error.message || 'Unable to reach the server.';
    }

    return error.message || 'Request failed';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export default apiClient;
