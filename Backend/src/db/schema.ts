/**
 * Gym Management System — Drizzle ORM Schema v3 (Auth subset)
 * Based on the optimized 21-table schema
 * This file contains tables needed for authentication feature.
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

  // ID Verification (NIC documents uploaded to OCI Object Storage)
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

// Relations
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

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MemberProfile = typeof memberProfiles.$inferSelect;
