// PowerWorld Gym Management System — Drizzle ORM Schema
// Kiribathgoda Branch — Phase 1
// Aligned with BUSINESS-REQUIREMENTS-DOCUMENT.md

import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  datetime,
  date,
  timestamp,
  json,
  mysqlEnum,
  uniqueIndex,
  index,
  time,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// 1. CORE IDENTITY & AUTH
// ============================================================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'manager', 'staff', 'trainer', 'member']).notNull().default('member'),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  gender: mysqlEnum('gender', ['male', 'female', 'prefer_not_to_say']),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  qrCodeSecret: varchar('qr_code_secret', { length: 64 }),
  lastQrGeneratedAt: timestamp('last_qr_generated_at'),
  lastLoginAt: timestamp('last_login_at'),
  failedLoginAttempts: int('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
  roleIdx: index('users_role_idx').on(t.role),
  phoneIdx: index('users_phone_idx').on(t.phone),
}));

export const refreshTokens = mysqlTable('refresh_tokens', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  deviceInfo: varchar('device_info', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userIdx: index('refresh_tokens_user_idx').on(t.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(t.tokenHash),
}));

export const permissions = mysqlTable('permissions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

export const rolePermissions = mysqlTable('role_permissions', {
  role: mysqlEnum('role', ['admin', 'manager', 'staff', 'trainer', 'member']).notNull(),
  permissionCode: varchar('permission_code', { length: 50 }).notNull(),
}, (t) => ({
  uidx: uniqueIndex('role_perm_idx').on(t.role, t.permissionCode),
}));

// ============================================================================
// 2. BRANCH CONFIGURATION
// ============================================================================

export const branches = mysqlTable('branches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  openTime: time('open_time').notNull().default('05:00:00'),
  closeTime: time('close_time').notNull().default('22:00:00'),
  operatingDays: json('operating_days').$type<string[]>().notNull(),
  capacity: int('capacity').default(100),
  gracePeriodDays: int('grace_period_days').default(3).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const branchClosures = mysqlTable('branch_closures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  closureDate: date('closure_date').notNull(),
  reason: varchar('reason', { length: 255 }),
  closedBy: varchar('closed_by', { length: 36 }).references(() => users.id),
  isEmergency: boolean('is_emergency').default(false).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  branchDateIdx: uniqueIndex('branch_closures_date_idx').on(t.branchId, t.closureDate),
}));

export const announcementBanners = mysqlTable('announcement_banners', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  targetRoles: json('target_roles').$type<string[]>(),
  priority: mysqlEnum('priority', ['low', 'normal', 'high', 'critical']).default('normal').notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: varchar('created_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================================
// 3. MEMBER PROFILES
// ============================================================================

export const members = mysqlTable('members', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  memberCode: varchar('member_code', { length: 20 }).notNull().unique(),
  nicNumber: varchar('nic_number', { length: 20 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  medicalConditions: text('medical_conditions'),
  currentMedications: text('current_medications'),
  recentSurgeries: text('recent_surgeries'),
  allergies: text('allergies'),
  homeBranchId: varchar('home_branch_id', { length: 36 }).references(() => branches.id),
  joinDate: date('join_date').notNull(),
  experienceLevel: mysqlEnum('experience_level', ['beginner', 'intermediate', 'advanced', 'returning']),
  fitnessGoals: json('fitness_goals').$type<string[]>(),
  assignedTrainerId: varchar('assigned_trainer_id', { length: 36 }),
  isOnboarded: boolean('is_onboarded').default(false).notNull(),
  onboardedAt: timestamp('onboarded_at'),
  status: mysqlEnum('member_status', ['active', 'inactive', 'suspended', 'incomplete']).default('active').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  userIdx: index('members_user_idx').on(t.userId),
  codeIdx: index('members_code_idx').on(t.memberCode),
  branchIdx: index('members_branch_idx').on(t.homeBranchId),
  trainerIdx: index('members_trainer_idx').on(t.assignedTrainerId),
}));

export const memberDocuments = mysqlTable('member_documents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  documentType: mysqlEnum('document_type', ['nic_front', 'nic_back', 'selfie_with_nic', 'student_id', 'other']).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }),
  mimeType: varchar('mime_type', { length: 50 }),
  fileSizeBytes: int('file_size_bytes'),
  verificationStatus: mysqlEnum('verification_status', ['pending_review', 'verified', 'rejected']).default('pending_review').notNull(),
  rejectionReason: mysqlEnum('rejection_reason', ['blurry', 'incomplete', 'mismatch', 'expired_nic', 'wrong_document', 'custom']),
  rejectionNote: text('rejection_note'),
  reviewedBy: varchar('reviewed_by', { length: 36 }).references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  uploadedAt: timestamp('uploaded_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  memberIdx: index('member_docs_member_idx').on(t.memberId),
  statusIdx: index('member_docs_status_idx').on(t.verificationStatus),
}));

export const memberMetrics = mysqlTable('member_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  recordedAt: timestamp('recorded_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  height: decimal('height', { precision: 5, scale: 2 }),
  bodyFatPercentage: decimal('body_fat_percentage', { precision: 4, scale: 1 }),
  muscleMass: decimal('muscle_mass', { precision: 5, scale: 2 }),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  restingHeartRate: int('resting_heart_rate'),
  waistCircumference: decimal('waist_circumference', { precision: 5, scale: 1 }),
  chestCircumference: decimal('chest_circumference', { precision: 5, scale: 1 }),
  source: mysqlEnum('metrics_source', ['manual', 'trainer', 'health_connect']).default('manual').notNull(),
  notes: text('notes'),
  recordedBy: varchar('recorded_by', { length: 36 }).references(() => users.id),
}, (t) => ({
  memberIdx: index('member_metrics_member_idx').on(t.memberId),
  dateIdx: index('member_metrics_date_idx').on(t.recordedAt),
}));

// ============================================================================
// 4. STAFF & TRAINER PROFILES
// ============================================================================

export const staff = mysqlTable('staff', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  employeeCode: varchar('employee_code', { length: 20 }).notNull().unique(),
  designation: varchar('designation', { length: 100 }),
  branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
  hireDate: date('hire_date').notNull(),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
  isKeyHolder: boolean('is_key_holder').default(false).notNull(),
  status: mysqlEnum('staff_status', ['active', 'inactive', 'on_leave', 'terminated']).default('active').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  userIdx: index('staff_user_idx').on(t.userId),
  codeIdx: index('staff_code_idx').on(t.employeeCode),
  branchIdx: index('staff_branch_idx').on(t.branchId),
}));

export const trainers = mysqlTable('trainers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  staffId: varchar('staff_id', { length: 36 }).references(() => staff.id),
  specialization: varchar('specialization', { length: 100 }),
  bio: text('bio'),
  certifications: json('certifications').$type<Array<{ name: string; issuingBody: string; year: number }>>(),
  yearsOfExperience: int('years_of_experience'),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
  maxClients: int('max_clients').default(20),
  branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
  status: mysqlEnum('trainer_status', ['active', 'inactive', 'on_leave']).default('active').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  userIdx: index('trainers_user_idx').on(t.userId),
  staffIdx: index('trainers_staff_idx').on(t.staffId),
  branchIdx: index('trainers_branch_idx').on(t.branchId),
}));

// ============================================================================
// 5. SHIFT MANAGEMENT & TIME TRACKING
// ============================================================================

export const staffShifts = mysqlTable('staff_shifts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  staffId: varchar('staff_id', { length: 36 }).notNull().references(() => staff.id),
  dayOfWeek: mysqlEnum('day_of_week', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']).notNull(),
  shiftStart: time('shift_start').notNull(),
  shiftEnd: time('shift_end').notNull(),
  shiftType: mysqlEnum('shift_type', ['morning', 'evening', 'split', 'cover']).default('morning').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  staffIdx: index('staff_shifts_staff_idx').on(t.staffId),
  activeIdx: index('staff_shifts_active_idx').on(t.isActive),
}));

export const shiftOverrides = mysqlTable('shift_overrides', {
  id: varchar('id', { length: 36 }).primaryKey(),
  staffId: varchar('staff_id', { length: 36 }).notNull().references(() => staff.id),
  overrideDate: date('override_date').notNull(),
  overrideType: mysqlEnum('override_type', ['day_off', 'extra_shift', 'modified_hours']).notNull(),
  shiftStart: time('shift_start'),
  shiftEnd: time('shift_end'),
  reason: varchar('reason', { length: 255 }),
  approvedBy: varchar('approved_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  staffDateIdx: uniqueIndex('shift_override_staff_date_idx').on(t.staffId, t.overrideDate),
}));

// ============================================================================
// 6. PHYSICAL ACCESS CONTROL (QR)
// ============================================================================

export const zones = mysqlTable('zones', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  name: varchar('name', { length: 50 }).notNull(),
  capacity: int('capacity'),
});

export const gates = mysqlTable('gates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  zoneId: varchar('zone_id', { length: 36 }).references(() => zones.id),
  name: varchar('name', { length: 50 }),
  deviceId: varchar('device_id', { length: 50 }).unique(),
  ipAddress: varchar('ip_address', { length: 50 }),
  lastHeartbeat: timestamp('last_heartbeat'),
  status: mysqlEnum('gate_status', ['active', 'inactive', 'maintenance']).default('active').notNull(),
});

export const visitSessions = mysqlTable('visit_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  checkInAt: timestamp('check_in_at').notNull(),
  checkOutAt: timestamp('check_out_at'),
  durationMinutes: int('duration_minutes'),
  status: mysqlEnum('session_status', ['active', 'completed', 'auto_closed', 'cancelled']).default('active').notNull(),
  visitType: mysqlEnum('visit_type', ['member_visit', 'staff_shift', 'manager_visit', 'admin_visit']).notNull(),
  isAutoCloseProcessed: boolean('is_auto_close_processed').default(false).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userIdx: index('visit_sessions_user_idx').on(t.userId),
  branchIdx: index('visit_sessions_branch_idx').on(t.branchId),
  statusIdx: index('visit_sessions_status_idx').on(t.status),
  checkInIdx: index('visit_sessions_checkin_idx').on(t.checkInAt),
}));

export const accessLogs = mysqlTable('access_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  gateId: varchar('gate_id', { length: 36 }).references(() => gates.id),
  sessionId: varchar('session_id', { length: 36 }).references(() => visitSessions.id),
  scannedAt: timestamp('scanned_at').notNull(),
  direction: mysqlEnum('direction', ['in', 'out']).notNull(),
  isAuthorized: boolean('is_authorized').notNull(),
  denyReason: varchar('deny_reason', { length: 100 }),
  isSynthetic: boolean('is_synthetic').default(false).notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userIdx: index('access_logs_user_idx').on(t.userId),
  sessionIdx: index('access_logs_session_idx').on(t.sessionId),
  scannedIdx: index('access_logs_scanned_idx').on(t.scannedAt),
  directionIdx: index('access_logs_direction_idx').on(t.direction),
}));

// ============================================================================
// 7. SUBSCRIPTIONS & PAYMENTS
// ============================================================================

export const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: int('duration_days').notNull(),
  features: json('features').$type<string[]>(),
  includedPtSessions: int('included_pt_sessions').default(0).notNull(),
  maxMembers: int('max_members').default(1).notNull(),
  requiresDocument: varchar('requires_document', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
});

export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  planId: varchar('plan_id', { length: 36 }).notNull().references(() => subscriptionPlans.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: mysqlEnum('subscription_status', [
    'pending_payment', 'active', 'frozen', 'expired', 'grace_period', 'inactive', 'cancelled',
  ]).default('pending_payment').notNull(),
  pricePaid: decimal('price_paid', { precision: 10, scale: 2 }),
  ptSessionsRemaining: int('pt_sessions_remaining').default(0).notNull(),
  autoRenew: boolean('auto_renew').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  memberIdx: index('subscriptions_member_idx').on(t.memberId),
  statusIdx: index('subscriptions_status_idx').on(t.status),
  endDateIdx: index('subscriptions_end_date_idx').on(t.endDate),
}));

export const subscriptionFreezes = mysqlTable('subscription_freezes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull().references(() => subscriptions.id),
  freezeStart: date('freeze_start').notNull(),
  freezeEnd: date('freeze_end').notNull(),
  actualUnfreezeDate: date('actual_unfreeze_date'),
  reason: varchar('reason', { length: 255 }),
  requestedBy: varchar('requested_by', { length: 36 }).references(() => users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  subIdx: index('sub_freezes_sub_idx').on(t.subscriptionId),
}));

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  subscriptionId: varchar('subscription_id', { length: 36 }).references(() => subscriptions.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']).notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  paymentDate: date('payment_date').notNull(),
  status: mysqlEnum('payment_status', ['completed', 'refunded', 'disputed']).default('completed').notNull(),
  recordedBy: varchar('recorded_by', { length: 36 }).references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  memberIdx: index('payments_member_idx').on(t.memberId),
  subIdx: index('payments_sub_idx').on(t.subscriptionId),
  dateIdx: index('payments_date_idx').on(t.paymentDate),
}));

// ============================================================================
// 8. WORKOUTS & FITNESS
// ============================================================================

export const workoutPlans = mysqlTable('workout_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).references(() => members.id),
  trainerId: varchar('trainer_id', { length: 36 }).references(() => trainers.id),
  planName: varchar('plan_name', { length: 150 }).notNull(),
  planDescription: text('plan_description'),
  source: mysqlEnum('plan_source', ['ai_generated', 'trainer_created', 'curated_library']).notNull(),
  durationWeeks: int('duration_weeks').notNull(),
  daysPerWeek: int('days_per_week').notNull(),
  difficulty: mysqlEnum('plan_difficulty', ['beginner', 'intermediate', 'advanced']),
  category: varchar('category', { length: 50 }),
  planData: json('plan_data'),
  isActive: boolean('is_active').default(true).notNull(),
  startedAt: date('started_at'),
  completedAt: date('completed_at'),
  aiModelUsed: varchar('ai_model_used', { length: 50 }),
  aiPromptHash: varchar('ai_prompt_hash', { length: 64 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  memberIdx: index('workout_plans_member_idx').on(t.memberId),
  trainerIdx: index('workout_plans_trainer_idx').on(t.trainerId),
  sourceIdx: index('workout_plans_source_idx').on(t.source),
}));

export const workoutExercises = mysqlTable('workout_exercises', {
  id: varchar('id', { length: 36 }).primaryKey(),
  planId: varchar('plan_id', { length: 36 }).notNull().references(() => workoutPlans.id, { onDelete: 'cascade' }),
  dayNumber: int('day_number').notNull(),
  exerciseOrder: int('exercise_order').notNull(),
  exerciseName: varchar('exercise_name', { length: 100 }).notNull(),
  sets: int('sets'),
  reps: varchar('reps', { length: 50 }),
  restSeconds: int('rest_seconds'),
  notes: text('notes'),
  equipment: varchar('equipment', { length: 100 }),
  muscleGroups: json('muscle_groups').$type<string[]>(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  planIdx: index('workout_exercises_plan_idx').on(t.planId),
}));

export const workoutLogs = mysqlTable('workout_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  planId: varchar('plan_id', { length: 36 }).references(() => workoutPlans.id),
  workoutDate: date('workout_date').notNull(),
  exercises: json('exercises'),
  durationMinutes: int('duration_minutes'),
  mood: mysqlEnum('workout_mood', ['great', 'good', 'okay', 'tired', 'poor']),
  caloriesBurned: int('calories_burned'),
  notes: text('notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  memberIdx: index('workout_logs_member_idx').on(t.memberId),
  dateIdx: index('workout_logs_date_idx').on(t.workoutDate),
}));

// ============================================================================
// 9. TRAINER AVAILABILITY & PERSONAL TRAINING
// ============================================================================

export const trainerAvailability = mysqlTable('trainer_availability', {
  id: varchar('id', { length: 36 }).primaryKey(),
  trainerId: varchar('trainer_id', { length: 36 }).notNull().references(() => trainers.id),
  availableDate: date('available_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  slotDurationMinutes: int('slot_duration_minutes').default(60).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  trainerDateIdx: index('trainer_avail_trainer_date_idx').on(t.trainerId, t.availableDate),
}));

export const trainingSessions = mysqlTable('training_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
  trainerId: varchar('trainer_id', { length: 36 }).notNull().references(() => trainers.id),
  sessionDate: date('session_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  status: mysqlEnum('training_session_status', [
    'booked', 'confirmed', 'in_progress', 'completed',
    'cancelled_by_member', 'cancelled_by_trainer', 'no_show',
  ]).default('booked').notNull(),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: varchar('cancellation_reason', { length: 255 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  memberIdx: index('training_sessions_member_idx').on(t.memberId),
  trainerIdx: index('training_sessions_trainer_idx').on(t.trainerId),
  dateIdx: index('training_sessions_date_idx').on(t.sessionDate),
  trainerDateTimeIdx: uniqueIndex('training_sessions_trainer_slot_idx').on(t.trainerId, t.sessionDate, t.startTime),
}));

export const sessionNotes = mysqlTable('session_notes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).notNull().references(() => trainingSessions.id),
  trainerId: varchar('trainer_id', { length: 36 }).notNull().references(() => trainers.id),
  performanceRating: int('performance_rating'),
  exercisesCompleted: json('exercises_completed').$type<string[]>(),
  weightProgression: text('weight_progression'),
  areasOfConcern: text('areas_of_concern'),
  recommendations: text('recommendations'),
  nextSessionFocus: text('next_session_focus'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  sessionIdx: index('session_notes_session_idx').on(t.sessionId),
}));

// ============================================================================
// 10. EQUIPMENT & INVENTORY
// ============================================================================

export const equipment = mysqlTable('equipment', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('equipment_category', [
    'cardio', 'strength_machine', 'free_weight', 'bench', 'accessory', 'other',
  ]).notNull(),
  manufacturer: varchar('manufacturer', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  purchaseDate: date('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
  warrantyExpiry: date('warranty_expiry'),
  status: mysqlEnum('equipment_status', [
    'operational', 'needs_maintenance', 'under_maintenance', 'retired',
  ]).default('operational').notNull(),
  locationZone: varchar('location_zone', { length: 50 }),
  lastMaintenanceDate: date('last_maintenance_date'),
  nextMaintenanceDue: date('next_maintenance_due'),
  maintenanceIntervalDays: int('maintenance_interval_days'),
  notes: text('notes'),
  qrCode: varchar('qr_code', { length: 100 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  branchIdx: index('equipment_branch_idx').on(t.branchId),
  statusIdx: index('equipment_status_idx').on(t.status),
}));

export const equipmentIssues = mysqlTable('equipment_issues', {
  id: varchar('id', { length: 36 }).primaryKey(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull().references(() => equipment.id),
  reportedBy: varchar('reported_by', { length: 36 }).notNull().references(() => users.id),
  issueType: mysqlEnum('issue_type', [
    'malfunction', 'damage', 'noise', 'safety_concern', 'missing_part', 'other',
  ]).notNull(),
  severity: mysqlEnum('issue_severity', ['low', 'medium', 'high', 'critical']).notNull(),
  description: text('description').notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  status: mysqlEnum('issue_status', ['open', 'in_progress', 'resolved', 'dismissed']).default('open').notNull(),
  resolvedBy: varchar('resolved_by', { length: 36 }).references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolutionNote: text('resolution_note'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  equipmentIdx: index('equip_issues_equipment_idx').on(t.equipmentId),
  statusIdx: index('equip_issues_status_idx').on(t.status),
}));

export const maintenanceLogs = mysqlTable('maintenance_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull().references(() => equipment.id),
  issueId: varchar('issue_id', { length: 36 }).references(() => equipmentIssues.id),
  description: text('description').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  performedBy: varchar('performed_by', { length: 100 }),
  isExternalVendor: boolean('is_external_vendor').default(false).notNull(),
  durationHours: decimal('duration_hours', { precision: 4, scale: 1 }),
  partsReplaced: text('parts_replaced'),
  statusAfter: mysqlEnum('status_after', ['operational', 'needs_more_work']).notNull(),
  performedAt: timestamp('performed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  loggedBy: varchar('logged_by', { length: 36 }).references(() => users.id),
}, (t) => ({
  equipmentIdx: index('maint_logs_equipment_idx').on(t.equipmentId),
}));

export const inventoryItems = mysqlTable('inventory_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  sku: varchar('sku', { length: 50 }),
  quantityInStock: int('quantity_in_stock').default(0).notNull(),
  reorderThreshold: int('reorder_threshold').default(5).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),
  supplier: varchar('supplier', { length: 100 }),
  lastRestockedAt: timestamp('last_restocked_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (t) => ({
  branchIdx: index('inventory_items_branch_idx').on(t.branchId),
  categoryIdx: index('inventory_items_category_idx').on(t.category),
}));

export const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  itemId: varchar('item_id', { length: 36 }).notNull().references(() => inventoryItems.id),
  changeAmount: int('change_amount').notNull(),
  reason: mysqlEnum('transaction_reason', ['sale', 'restock', 'damage', 'adjustment', 'expired']).notNull(),
  memberId: varchar('member_id', { length: 36 }).references(() => members.id),
  recordedBy: varchar('recorded_by', { length: 36 }).references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  itemIdx: index('inv_transactions_item_idx').on(t.itemId),
}));

// ============================================================================
// 11. NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable('notifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  priority: mysqlEnum('notification_priority', ['low', 'normal', 'high', 'critical']).default('normal').notNull(),
  actionUrl: varchar('action_url', { length: 255 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userIdx: index('notifications_user_idx').on(t.userId),
  readIdx: index('notifications_read_idx').on(t.isRead),
  typeIdx: index('notifications_type_idx').on(t.type),
}));

// ============================================================================
// 12. SYSTEM & AUDIT
// ============================================================================

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  actorId: varchar('actor_id', { length: 36 }).references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: varchar('target_id', { length: 36 }),
  changes: json('changes').$type<{ before?: Record<string, any>; after?: Record<string, any> }>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 255 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  actorIdx: index('audit_logs_actor_idx').on(t.actorId),
  actionIdx: index('audit_logs_action_idx').on(t.action),
  targetIdx: index('audit_logs_target_idx').on(t.targetType, t.targetId),
  dateIdx: index('audit_logs_date_idx').on(t.createdAt),
}));

export const systemConfig = mysqlTable('system_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  description: varchar('description', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 36 }).references(() => users.id),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const cronJobRuns = mysqlTable('cron_job_runs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  jobName: varchar('job_name', { length: 100 }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  status: mysqlEnum('cron_status', ['running', 'completed', 'failed']).notNull(),
  result: json('result'),
  errorMessage: text('error_message'),
}, (t) => ({
  jobIdx: index('cron_runs_job_idx').on(t.jobName),
  dateIdx: index('cron_runs_date_idx').on(t.startedAt),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type AccessLog = typeof accessLogs.$inferSelect;
export type VisitSession = typeof visitSessions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type EquipmentIssue = typeof equipmentIssues.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type MemberDocument = typeof memberDocuments.$inferSelect;
export type MemberMetric = typeof memberMetrics.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type StaffShift = typeof staffShifts.$inferSelect;
export type SubscriptionFreeze = typeof subscriptionFreezes.$inferSelect;
