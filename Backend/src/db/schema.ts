/**
 * Gym Management System — Drizzle ORM Schema v4 (Full schema)
 * All tables centralised here for use by services, controllers, and migration tooling.
 */

import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  decimal,
  boolean,
  date,
  timestamp,
  mysqlEnum,
  index,
  int,
  smallint,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// CONFIG (single branch system - key/value store)
// ============================================================================
export const config = mysqlTable('config', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: varchar('value', { length: 500 }).notNull(),
});

// ============================================================================
// USERS (unified table for all humans: admin, manager, staff, trainer, member)
// ============================================================================
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),

  // Identity
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  dob: date('dob'),
  gender: mysqlEnum('gender', ['male', 'female', 'other']),
  nicNumber: varchar('nic_number', { length: 20 }),

  // Role & status
  role: mysqlEnum('role', ['admin', 'manager', 'staff', 'trainer', 'member']).notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),

  // Auth
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifyToken: varchar('email_verify_token', { length: 255 }),
  qrSecret: varchar('qr_secret', { length: 64 }),
  lastLoginAt: timestamp('last_login_at'),
  failedAttempts: tinyint('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetExpires: timestamp('reset_expires'),

  // Staff/trainer columns (NULL for members)
  employeeCode: varchar('employee_code', { length: 20 }).unique(),
  hireDate: date('hire_date'),
  designation: varchar('designation', { length: 100 }),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
  isKeyHolder: boolean('is_key_holder').notNull().default(false),
  specialization: varchar('specialization', { length: 100 }),
  ptHourlyRate: decimal('pt_hourly_rate', { precision: 8, scale: 2 }),
  ptRating: decimal('pt_rating', { precision: 3, scale: 2 }),
  yearsExperience: tinyint('years_experience'),

  // Member columns (NULL for staff)
  memberCode: varchar('member_code', { length: 20 }).unique(),
  joinDate: date('join_date'),
  memberStatus: mysqlEnum('member_status', ['active', 'inactive', 'suspended']),
  assignedTrainerId: varchar('assigned_trainer', { length: 36 }),

  // Profile media (OCI object keys or local paths in development)
  avatarKey: varchar('avatar_key', { length: 500 }),
  coverKey: varchar('cover_key', { length: 500 }),

  // ID Verification (document type + files in OCI Object Storage)
  idDocumentType: mysqlEnum('id_document_type', ['nic', 'driving_license', 'passport']),
  idNicFront: varchar('id_nic_front', { length: 500 }),
  idNicBack: varchar('id_nic_back', { length: 500 }),
  idVerificationStatus: mysqlEnum('id_verification_status', ['pending', 'approved', 'rejected']),
  idVerificationNote: text('id_verification_note'),
  idSubmittedAt: timestamp('id_submitted_at'),

  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  roleIdx: index('idx_role').on(t.role),
  activeIdx: index('idx_active').on(t.isActive, t.role),
}));

// ============================================================================
// MEMBER_PROFILES (1:1 with users where role='member')
// ============================================================================
export const memberProfiles = mysqlTable('member_profiles', {
  personId: varchar('person_id', { length: 36 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  bloodType: mysqlEnum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  medicalConditions: text('medical_conditions'),
  allergies: text('allergies'),
  fitnessGoals: varchar('fitness_goals', { length: 500 }),
  experienceLevel: mysqlEnum('experience_level', ['beginner', 'intermediate', 'advanced']),
  emergencyName: varchar('emergency_name', { length: 100 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  emergencyRelation: varchar('emergency_relation', { length: 50 }),
  referralSource: mysqlEnum('referral_source', ['facebook', 'walk_in', 'friend', 'website', 'other']),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
  onboardedAt: timestamp('onboarded_at'),
});

// ============================================================================
// SUBSCRIPTION_PLANS
// ============================================================================
export const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  planCode: varchar('plan_code', { length: 30 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  planType: mysqlEnum('plan_type', ['individual', 'couple', 'student', 'corporate', 'daily_pass']).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: smallint('duration_days').notNull(),
  includedPtSessions: tinyint('included_pt_sessions').notNull(),
  isActive: boolean('is_active').notNull(),
  sortOrder: tinyint('sort_order').notNull(),
  createdAt: timestamp('created_at'),
  deletedAt: timestamp('deleted_at'),
});

// ============================================================================
// PROMOTIONS
// ============================================================================
export const promotions = mysqlTable('promotions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  discountType: mysqlEnum('discount_type', ['percentage', 'fixed']).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  isActive: boolean('is_active').notNull(),
  usedCount: smallint('used_count').notNull(),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: mysqlEnum('status', ['pending_payment', 'active', 'frozen', 'grace_period', 'expired', 'cancelled']).notNull(),
  pricePaid: decimal('price_paid', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  promotionId: varchar('promotion_id', { length: 36 }),
  ptSessionsLeft: tinyint('pt_sessions_left').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// SUBSCRIPTION_FREEZES
// ============================================================================
export const subscriptionFreezes = mysqlTable('subscription_freezes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  freezeStart: date('freeze_start').notNull(),
  freezeEnd: date('freeze_end').notNull(),
  reason: varchar('reason', { length: 255 }),
  requestedBy: varchar('requested_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// PAYMENTS
// ============================================================================
export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']).notNull(),
  paymentDate: date('payment_date').notNull(),
  status: mysqlEnum('status', ['completed', 'partially_refunded', 'refunded', 'disputed']).notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  promotionId: varchar('promotion_id', { length: 36 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  recordedBy: varchar('recorded_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// VISITS (check-in / check-out log)
// ============================================================================
export const visits = mysqlTable('visits', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  checkInAt: timestamp('check_in_at').notNull(),
  checkOutAt: timestamp('check_out_at'),
  durationMin: smallint('duration_min'),
  status: mysqlEnum('status', ['active', 'completed', 'auto_closed', 'denied']).notNull(),
  denyReason: varchar('deny_reason', { length: 100 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// PT_SESSIONS (personal training appointments)
// ============================================================================
export const ptSessions = mysqlTable('pt_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  trainerId: varchar('trainer_id', { length: 36 }).notNull(),
  sessionDate: date('session_date').notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['booked', 'confirmed', 'completed', 'cancelled', 'no_show']).notNull(),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  reviewRating: tinyint('review_rating'),
  reviewComment: text('review_comment'),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// WORKOUT_PLANS
// ============================================================================
export const workoutPlans = mysqlTable('workout_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }),
  trainerId: varchar('trainer_id', { length: 36 }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  source: mysqlEnum('source', ['trainer_created', 'ai_generated', 'library']).notNull(),
  difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  durationWeeks: tinyint('duration_weeks').notNull(),
  daysPerWeek: tinyint('days_per_week').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// WORKOUT_LOGS
// ============================================================================
export const workoutLogs = mysqlTable('workout_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }),
  workoutDate: date('workout_date').notNull(),
  durationMin: smallint('duration_min'),
  mood: mysqlEnum('mood', ['great', 'good', 'okay', 'tired', 'poor']),
  caloriesBurned: smallint('calories_burned'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// MEMBER_METRICS (body vitals)
// ============================================================================
export const memberMetrics = mysqlTable('member_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  recordedAt: timestamp('recorded_at'),
  source: mysqlEnum('source', ['manual', 'trainer', 'device']).notNull(),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  restingHr: tinyint('resting_hr'),
  notes: text('notes'),
});

// ============================================================================
// EQUIPMENT
// ============================================================================
export const equipment = mysqlTable('equipment', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['cardio', 'strength_machine', 'free_weight', 'bench', 'accessory', 'other']).notNull(),
  quantity: tinyint('quantity').notNull(),
  status: mysqlEnum('status', ['operational', 'needs_maintenance', 'under_maintenance', 'retired']).notNull(),
  zoneLabel: varchar('zone_label', { length: 50 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// EQUIPMENT_EVENTS (issue reports and maintenance logs)
// ============================================================================
export const equipmentEvents = mysqlTable('equipment_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  eventType: mysqlEnum('event_type', ['issue_reported', 'maintenance_done']).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']),
  description: text('description').notNull(),
  status: mysqlEnum('status', ['open', 'in_progress', 'resolved']),
  loggedBy: varchar('logged_by', { length: 36 }),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// INVENTORY_ITEMS
// ============================================================================
export const inventoryItems = mysqlTable('inventory_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  qtyInStock: smallint('qty_in_stock').notNull(),
  reorderThreshold: smallint('reorder_threshold').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// INVENTORY_TRANSACTIONS
// ============================================================================
export const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  itemId: varchar('item_id', { length: 36 }).notNull(),
  txnType: mysqlEnum('txn_type', ['restock', 'sale', 'adjustment', 'waste']).notNull(),
  qtyChange: smallint('qty_change').notNull(),
  reference: varchar('reference', { length: 100 }),
  recordedBy: varchar('recorded_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// MESSAGES (in-app notifications, announcements, broadcasts)
// ============================================================================
export const messages = mysqlTable('messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  type: mysqlEnum('type', ['notification', 'announcement', 'email']).notNull(),
  channel: mysqlEnum('channel', ['in_app', 'email', 'sms']).notNull(),
  toPersonId: varchar('to_person_id', { length: 36 }),
  targetRole: mysqlEnum('target_role', ['admin', 'manager', 'staff', 'trainer', 'member']),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  priority: mysqlEnum('priority', ['low', 'normal', 'high', 'critical']).notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'read', 'failed']).notNull(),
  sentBy: varchar('sent_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// AI_INTERACTIONS (chat, workout generation, manager insights audit log)
// ============================================================================
export const aiInteractions = mysqlTable('ai_interactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  userRole: mysqlEnum('user_role', ['admin', 'manager', 'staff', 'trainer', 'member']).notNull(),
  interactionType: mysqlEnum('interaction_type', ['chat', 'workout_plan', 'insight']).notNull(),
  promptText: text('prompt_text'),
  responseText: text('response_text'),
  source: mysqlEnum('source', ['rag', 'gemini', 'fallback']).notNull(),
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// BRANCH_CLOSURES
// ============================================================================
export const branchClosures = mysqlTable('branch_closures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  closureDate: date('closure_date').notNull(),
  reason: varchar('reason', { length: 255 }),
  isEmergency: boolean('is_emergency').notNull(),
  closedBy: varchar('closed_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// EXERCISES (library of individual exercises)
// ============================================================================
export const exercises = mysqlTable('exercises', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  muscleGroup: varchar('muscle_group', { length: 60 }),
  equipmentNeeded: varchar('equipment_needed', { length: 100 }),
  instructions: text('instructions'),
  difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  videoUrl: varchar('video_url', { length: 255 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// WORKOUT_PLAN_EXERCISES (join: plan → exercise with sets/reps per day)
// ============================================================================
export const workoutPlanExercises = mysqlTable('workout_plan_exercises', {
  id: varchar('id', { length: 36 }).primaryKey(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  exerciseId: varchar('exercise_id', { length: 36 }).notNull(),
  dayNumber: tinyint('day_number').notNull(),
  sets: tinyint('sets'),
  reps: tinyint('reps'),
  durationSec: smallint('duration_sec'),
  restSec: smallint('rest_sec'),
  notes: text('notes'),
  sortOrder: tinyint('sort_order').notNull(),
});

// ============================================================================
// SHIFTS (staff roster — separate from visits check-in log)
// ============================================================================
export const shifts = mysqlTable('shifts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  staffId: varchar('staff_id', { length: 36 }).notNull(),
  shiftType: mysqlEnum('shift_type', ['morning', 'afternoon', 'evening', 'full_day']).notNull(),
  shiftDate: date('shift_date').notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['scheduled', 'active', 'completed', 'missed', 'swapped']).notNull(),
  notes: varchar('notes', { length: 255 }),
  createdBy: varchar('created_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(memberProfiles, {
    fields: [users.id],
    references: [memberProfiles.personId],
  }),
  assignedTrainer: one(users, {
    fields: [users.assignedTrainerId],
    references: [users.id],
  }),
}));

export const memberProfilesRelations = relations(memberProfiles, ({ one }) => ({
  person: one(users, {
    fields: [memberProfiles.personId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type PtSession = typeof ptSessions.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type MemberMetric = typeof memberMetrics.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type EquipmentEvent = typeof equipmentEvents.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutPlanExercise = typeof workoutPlanExercises.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
