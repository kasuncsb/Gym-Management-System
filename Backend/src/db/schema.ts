/**
 * Gym Management System — Drizzle ORM Schema v5
 * entity_lifecycle + members/trainers extensions; subscription freezes removed.
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
  smallint,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// CONFIG
// ============================================================================
export const config = mysqlTable('config', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: varchar('value', { length: 500 }).notNull(),
});

// ============================================================================
// ENTITY_LIFECYCLE (created_at / updated_at / deleted_at for linked rows)
// ============================================================================
export const entityLifecycle = mysqlTable('entity_lifecycle', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================================================
// USERS — identity + auth + admin/manager ops only; avatar/cover
// ============================================================================
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),

  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  dob: date('dob'),
  gender: mysqlEnum('gender', ['male', 'female', 'other']),
  nicNumber: varchar('nic_number', { length: 20 }),

  role: mysqlEnum('role', ['admin', 'manager', 'trainer', 'member']).notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),

  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifyToken: varchar('email_verify_token', { length: 255 }),
  qrSecret: varchar('qr_secret', { length: 64 }),
  lastLoginAt: timestamp('last_login_at'),
  failedAttempts: tinyint('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetExpires: timestamp('reset_expires'),

  /** Admin / manager only (trainers use `trainers` table) */
  employeeCode: varchar('employee_code', { length: 20 }).unique(),
  hireDate: date('hire_date'),
  designation: varchar('designation', { length: 100 }),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
  isKeyHolder: boolean('is_key_holder').notNull().default(false),

  avatarKey: varchar('avatar_key', { length: 500 }),
  coverKey: varchar('cover_key', { length: 500 }),
}, (t) => ({
  roleIdx: index('idx_role').on(t.role),
  activeIdx: index('idx_active').on(t.isActive, t.role),
}));

// ============================================================================
// MEMBERS (1:1 users where role=member)
// ============================================================================
export const members = mysqlTable('members', {
  userId: varchar('user_id', { length: 36 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),

  bloodType: mysqlEnum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  medicalConditions: text('medical_conditions'),
  allergies: text('allergies'),
  fitnessGoals: varchar('fitness_goals', { length: 500 }),
  experienceLevel: mysqlEnum('experience_level', ['beginner', 'intermediate', 'advanced']),
  emergencyName: varchar('emergency_name', { length: 100 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  emergencyRelation: varchar('emergency_relation', { length: 50 }),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
  onboardedAt: timestamp('onboarded_at'),

  idDocumentType: mysqlEnum('id_document_type', ['nic', 'driving_license', 'passport']),
  idNicFront: varchar('id_nic_front', { length: 500 }),
  idNicBack: varchar('id_nic_back', { length: 500 }),
  idVerificationStatus: mysqlEnum('id_verification_status', ['pending', 'approved', 'rejected']),
  idVerificationNote: text('id_verification_note'),
  idSubmittedAt: timestamp('id_submitted_at'),

  memberCode: varchar('member_code', { length: 20 }).unique(),
  joinDate: date('join_date'),
  memberStatus: mysqlEnum('member_status', ['active', 'inactive', 'suspended']),
  assignedTrainerId: varchar('assigned_trainer', { length: 36 }),
});

// ============================================================================
// TRAINERS (1:1 users where role=trainer)
// ============================================================================
export const trainers = mysqlTable('trainers', {
  userId: varchar('user_id', { length: 36 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),

  employeeCode: varchar('employee_code', { length: 20 }).unique(),
  hireDate: date('hire_date'),
  designation: varchar('designation', { length: 100 }),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
  isKeyHolder: boolean('is_key_holder').notNull().default(false),
  specialization: varchar('specialization', { length: 100 }),
  ptHourlyRate: decimal('pt_hourly_rate', { precision: 8, scale: 2 }),
  ptRating: decimal('pt_rating', { precision: 3, scale: 2 }),
  yearsExperience: tinyint('years_experience'),
});

// ============================================================================
// SUBSCRIPTION_PLANS
// ============================================================================
export const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  planCode: varchar('plan_code', { length: 30 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  planType: mysqlEnum('plan_type', ['individual', 'couple', 'student', 'corporate', 'daily_pass']).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: smallint('duration_days').notNull(),
  isActive: boolean('is_active').notNull(),
});

// ============================================================================
// PROMOTIONS
// ============================================================================
export const promotions = mysqlTable('promotions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  discountType: mysqlEnum('discount_type', ['percentage', 'fixed']).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  isActive: boolean('is_active').notNull(),
  usedCount: smallint('used_count').notNull(),
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: mysqlEnum('status', ['pending_payment', 'active', 'grace_period', 'expired', 'cancelled']).notNull(),
  pricePaid: decimal('price_paid', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  promotionId: varchar('promotion_id', { length: 36 }),
});

// ============================================================================
// PAYMENTS
// ============================================================================
export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']).notNull(),
  paymentDate: date('payment_date').notNull(),
  status: mysqlEnum('status', ['completed', 'disputed']).notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  instrumentHash: varchar('instrument_hash', { length: 64 }),
  promotionId: varchar('promotion_id', { length: 36 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  recordedBy: varchar('recorded_by', { length: 36 }),
  invoiceNumber: varchar('invoice_number', { length: 50 }),
}, (t) => ({
  invoiceUq: uniqueIndex('uq_pay_invoice').on(t.invoiceNumber),
}));

// ============================================================================
// VISITS
// ============================================================================
export const visits = mysqlTable('visits', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  personId: varchar('person_id', { length: 36 }).notNull(),
  checkInAt: timestamp('check_in_at').notNull(),
  checkOutAt: timestamp('check_out_at'),
  durationMin: smallint('duration_min'),
  status: mysqlEnum('status', ['active', 'completed', 'auto_closed', 'denied']).notNull(),
  denyReason: varchar('deny_reason', { length: 100 }),
});

// ============================================================================
// PT_SESSIONS
// ============================================================================
export const ptSessions = mysqlTable('pt_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  trainerId: varchar('trainer_id', { length: 36 }).notNull(),
  sessionDate: date('session_date').notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['booked', 'confirmed', 'completed', 'cancelled', 'no_show']).notNull(),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  reviewRating: tinyint('review_rating'),
  reviewComment: text('review_comment'),
});

// ============================================================================
// WORKOUT_PLANS
// ============================================================================
export const workoutPlans = mysqlTable('workout_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  memberId: varchar('member_id', { length: 36 }),
  trainerId: varchar('trainer_id', { length: 36 }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  source: mysqlEnum('source', ['trainer_created', 'ai_generated', 'library']).notNull(),
  difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  durationWeeks: tinyint('duration_weeks').notNull(),
  daysPerWeek: tinyint('days_per_week').notNull(),
  isActive: boolean('is_active').notNull(),
  programJson: text('program_json').notNull(),
});

// ============================================================================
// MEMBER_METRICS
// ============================================================================
export const memberMetrics = mysqlTable('member_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
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
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['cardio', 'strength_machine', 'free_weight', 'bench', 'accessory', 'other']).notNull(),
  quantity: tinyint('quantity').notNull(),
  status: mysqlEnum('status', ['operational', 'needs_maintenance', 'under_maintenance', 'retired']).notNull(),
  zoneLabel: varchar('zone_label', { length: 50 }),
});

// ============================================================================
// EQUIPMENT_EVENTS
// ============================================================================
export const equipmentEvents = mysqlTable('equipment_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  eventType: mysqlEnum('event_type', ['issue_reported', 'maintenance_done']).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']),
  description: text('description').notNull(),
  status: mysqlEnum('status', ['open', 'in_progress', 'resolved']),
  loggedBy: varchar('logged_by', { length: 36 }),
  resolvedBy: varchar('resolved_by', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
});

// ============================================================================
// INVENTORY_ITEMS
// ============================================================================
export const inventoryItems = mysqlTable('inventory_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  qtyInStock: smallint('qty_in_stock').notNull(),
  reorderThreshold: smallint('reorder_threshold').notNull(),
  isActive: boolean('is_active').notNull(),
});

// ============================================================================
// INVENTORY_TRANSACTIONS
// ============================================================================
export const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  itemId: varchar('item_id', { length: 36 }).notNull(),
  txnType: mysqlEnum('txn_type', ['restock', 'sale', 'adjustment', 'waste']).notNull(),
  qtyChange: smallint('qty_change').notNull(),
  reference: varchar('reference', { length: 100 }),
  recordedBy: varchar('recorded_by', { length: 36 }),
});

// ============================================================================
// MESSAGES
// ============================================================================
export const messages = mysqlTable('messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  type: mysqlEnum('type', ['notification', 'announcement', 'email']).notNull(),
  channel: mysqlEnum('channel', ['in_app', 'email', 'sms']).notNull(),
  toPersonId: varchar('to_person_id', { length: 36 }),
  targetRole: mysqlEnum('target_role', ['admin', 'manager', 'trainer', 'member']),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  priority: mysqlEnum('priority', ['low', 'normal', 'high', 'critical']).notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'read', 'failed']).notNull(),
  sentBy: varchar('sent_by', { length: 36 }),
});

// ============================================================================
// AI_INTERACTIONS
// ============================================================================
export const aiInteractions = mysqlTable('ai_interactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  userId: varchar('user_id', { length: 36 }).notNull(),
  userRole: mysqlEnum('user_role', ['admin', 'manager', 'trainer', 'member']).notNull(),
  interactionType: mysqlEnum('interaction_type', ['chat', 'workout_plan', 'insight']).notNull(),
  promptText: text('prompt_text'),
  responseText: text('response_text'),
  source: mysqlEnum('source', ['rag', 'gemini', 'fallback']).notNull(),
  metadataJson: text('metadata_json'),
});

// ============================================================================
// AI_CHAT_SESSIONS / AI_CHAT_MESSAGES
// ============================================================================
export const aiChatSessions = mysqlTable('ai_chat_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  userId: varchar('user_id', { length: 36 }).notNull(),
  role: mysqlEnum('role', ['member', 'manager']).notNull(),
  title: varchar('title', { length: 140 }),
  lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
}, (t) => ({
  userRoleIdx: index('idx_ai_chat_sessions_user_role').on(t.userId, t.role),
  lastMessageIdx: index('idx_ai_chat_sessions_last_message').on(t.lastMessageAt),
}));

export const aiChatMessages = mysqlTable('ai_chat_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  role: mysqlEnum('role', ['user', 'assistant']).notNull(),
  source: mysqlEnum('source', ['rag', 'gemini', 'fallback', 'system']).notNull().default('system'),
  content: text('content').notNull(),
}, (t) => ({
  sessionCreatedIdx: index('idx_ai_chat_messages_session_created').on(t.sessionId),
  userCreatedIdx: index('idx_ai_chat_messages_user_created').on(t.userId),
}));

// ============================================================================
// WORKOUT_SESSIONS / WORKOUT_SESSION_EVENTS
// ============================================================================
export const workoutSessions = mysqlTable('workout_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  personId: varchar('person_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }),
  status: mysqlEnum('status', ['active', 'paused', 'completed', 'stopped']).notNull().default('active'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  durationMin: smallint('duration_min'),
  caloriesBurned: smallint('calories_burned'),
  mood: mysqlEnum('mood', ['great', 'good', 'okay', 'tired', 'poor']),
  notes: text('notes'),
}, (t) => ({
  personStatusIdx: index('idx_workout_sessions_person_status').on(t.personId, t.status),
  startedIdx: index('idx_workout_sessions_started').on(t.startedAt),
}));

export const workoutSessionEvents = mysqlTable('workout_session_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  sessionId: varchar('session_id', { length: 36 }).notNull(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  eventType: mysqlEnum('event_type', ['started', 'paused', 'resumed', 'exercise_started', 'set_completed', 'exercise_completed', 'stopped', 'completed', 'simulated']).notNull(),
  payloadJson: text('payload_json'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  sessionIdx: index('idx_workout_session_events_session').on(t.sessionId, t.createdAt),
  personIdx: index('idx_workout_session_events_person').on(t.personId, t.createdAt),
}));

// ============================================================================
// BRANCH_CLOSURES
// ============================================================================
export const branchClosures = mysqlTable('branch_closures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  closureDate: date('closure_date').notNull(),
  reason: varchar('reason', { length: 255 }),
  isEmergency: boolean('is_emergency').notNull(),
  closedBy: varchar('closed_by', { length: 36 }),
});

// ============================================================================
// SHIFTS
// ============================================================================
export const shifts = mysqlTable('shifts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lifecycleId: varchar('lifecycle_id', { length: 36 }).notNull().unique().references(() => entityLifecycle.id),
  staffId: varchar('staff_id', { length: 36 }).notNull(),
  shiftType: mysqlEnum('shift_type', ['morning', 'afternoon', 'evening', 'full_day']).notNull(),
  shiftDate: date('shift_date').notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['scheduled', 'active', 'completed', 'missed', 'swapped']).notNull(),
  notes: varchar('notes', { length: 255 }),
  createdBy: varchar('created_by', { length: 36 }),
});

// ============================================================================
// AUDIT_LOGS
// ============================================================================
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  actorId: varchar('actor_id', { length: 36 }),
  actorLabel: varchar('actor_label', { length: 200 }),
  action: varchar('action', { length: 120 }).notNull(),
  category: mysqlEnum('category', ['member', 'payment', 'system', 'security', 'trainer', 'access', 'config']),
  entityType: varchar('entity_type', { length: 60 }),
  entityId: varchar('entity_id', { length: 36 }),
  detail: varchar('detail', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  createdIdx: index('idx_audit_created').on(t.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ one }) => ({
  member: one(members, { fields: [users.id], references: [members.userId] }),
  trainer: one(trainers, { fields: [users.id], references: [trainers.userId] }),
  lifecycle: one(entityLifecycle, { fields: [users.lifecycleId], references: [entityLifecycle.id] }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, { fields: [members.userId], references: [users.id] }),
  lifecycle: one(entityLifecycle, { fields: [members.lifecycleId], references: [entityLifecycle.id] }),
  assignedTrainer: one(users, { fields: [members.assignedTrainerId], references: [users.id] }),
}));

export const trainersRelations = relations(trainers, ({ one }) => ({
  user: one(users, { fields: [trainers.userId], references: [users.id] }),
  lifecycle: one(entityLifecycle, { fields: [trainers.lifecycleId], references: [entityLifecycle.id] }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type Trainer = typeof trainers.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type PtSession = typeof ptSessions.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type MemberMetric = typeof memberMetrics.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type EquipmentEvent = typeof equipmentEvents.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSessionEvent = typeof workoutSessionEvents.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type EntityLifecycle = typeof entityLifecycle.$inferSelect;
