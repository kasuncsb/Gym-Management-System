/**
 * Database seed — 4 users (one per role: admin, manager, trainer, member)
 * Uses fixed plain-text passwords for reliable login after deploy/docker init.
 * Run with: npm run db:seed
 *
 * Removes existing seeded users before inserting.
 * .env is at project root; deploy.yml and docker-compose automate schema + seed.
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// Script is at Backend/scripts/seed.ts — load .env from project root (Backend/../.env)
const scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(scriptDir, '..', '..', '.env') });
dotenv.config({ path: join(scriptDir, '..', '.env') });

import { db } from '../src/config/database.js';
import { users, memberProfiles, config, subscriptionPlans, inventoryItems } from '../src/db/schema.js';
import { ids } from '../src/utils/id.js';
import { hashPassword } from '../src/utils/password.js';
import { inArray } from 'drizzle-orm';

/** Fixed password for all seed users — use this to log in after deploy/docker init. */
const SEED_PASSWORD = 'PWlogin!26';

const SEED_EMAILS = [
  'admin@powerworldgyms.lk',
  'manager@powerworldgyms.lk',
  'trainer@powerworldgyms.lk',
  'member@powerworldgyms.lk',
];

const SEED_USERS = [
  {
    role: 'admin' as const,
    email: 'admin@powerworldgyms.lk',
    fullName: 'Asiri Wickramasinghe',
    employeeCode: 'PWG-ADM-001',
    designation: 'System Administrator',
  },
  {
    role: 'manager' as const,
    email: 'manager@powerworldgyms.lk',
    fullName: 'Dilini Perera',
    employeeCode: 'PWG-MGR-001',
    designation: 'Branch Manager',
  },
  {
    role: 'trainer' as const,
    email: 'trainer@powerworldgyms.lk',
    fullName: 'Chathurika Silva',
    employeeCode: 'PWG-TRN-001',
    designation: 'Head Trainer',
    specialization: 'Strength & Conditioning',
    ptHourlyRate: '3500.00',
    yearsExperience: 8,
  },
  {
    role: 'member' as const,
    email: 'member@powerworldgyms.lk',
    fullName: 'Nimal Perera',
    memberCode: 'PWG-KBG-2025001',
    memberStatus: 'active' as const,
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed config (upsert)
  const configData = [
    { key: 'branch_capacity', value: '120' },
    { key: 'grace_days', value: '3' },
    { key: 'timezone', value: 'Asia/Colombo' },
    { key: 'checkin_qr_ttl_seconds', value: '120' },
    { key: 'checkin_scan_max_retries', value: '5' },
    { key: 'subscription_freeze_max_days', value: '90' },
    { key: 'payment_failure_max_retries', value: '3' },
    { key: 'login_failure_lock_threshold', value: '5' },
    { key: 'login_failure_lock_minutes', value: '15' },
    { key: 'db_backup_retention_days', value: '14' },
    { key: 'db_backup_frequency', value: 'daily' },
    { key: 'ai_chat_rate_limit_per_minute', value: '20' },
    { key: 'pt_booking_advance_days_max', value: '60' },
    { key: 'session_idle_timeout_minutes', value: '30' },
    { key: 'email_queue_max_attempts', value: '5' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'notify_email', value: 'true' },
    { key: 'notify_sms', value: 'false' },
    { key: 'auto_backup', value: 'true' },
    { key: 'db_backup_frequency', value: 'daily' },
  ];
  for (const c of configData) {
    await db.insert(config).values(c).onDuplicateKeyUpdate({ set: { value: c.value } });
  }
  console.log('✅ Config seeded');

  // Remove existing seed users (by email)
  await db.delete(users).where(inArray(users.email, SEED_EMAILS));
  console.log('🗑️  Removed existing seed users');

  // Insert 4 users with fixed password (avatar_key, cover_key, id_document_type left null)
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const u of SEED_USERS) {
    const id = ids.uuid();
    const isMember = u.role === 'member';

    await db.insert(users).values({
      id,
      email: u.email,
      fullName: u.fullName,
      passwordHash,
      role: u.role,
      isActive: true,
      emailVerified: true,
      qrSecret: ids.qrSecret(),
      ...(u.employeeCode && { employeeCode: u.employeeCode }),
      ...(u.designation && { designation: u.designation }),
      ...(u.specialization && { specialization: u.specialization }),
      ...(u.ptHourlyRate && { ptHourlyRate: u.ptHourlyRate }),
      ...(u.yearsExperience !== undefined && { yearsExperience: u.yearsExperience }),
      ...(u.memberCode && { memberCode: u.memberCode }),
      ...(u.memberStatus && { memberStatus: u.memberStatus, joinDate: new Date() }),
    });

    if (isMember) {
      await db.insert(memberProfiles).values({
        personId: id,
        isOnboarded: true,
        onboardedAt: new Date(),
      });
    }
  }

  console.log('✅ 4 users created (admin, manager, trainer, member)');

  // Seed subscription plans (upsert by planCode)
  const SEED_PLANS = [
    {
      id: ids.uuid(),
      planCode: 'BASIC-MTH',
      name: 'Basic Monthly',
      description: 'Full gym access for 30 days. No PT sessions included.',
      planType: 'individual' as const,
      price: '2500.00',
      durationDays: 30,
      includedPtSessions: 0,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: ids.uuid(),
      planCode: 'PREM-MTH',
      name: 'Premium Monthly',
      description: 'Full gym access + 2 personal training sessions per month.',
      planType: 'individual' as const,
      price: '4500.00',
      durationDays: 30,
      includedPtSessions: 2,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: ids.uuid(),
      planCode: 'PREM-ANN',
      name: 'Annual Premium',
      description: 'Best value — 12 months access + 24 PT sessions + priority booking.',
      planType: 'individual' as const,
      price: '42000.00',
      durationDays: 365,
      includedPtSessions: 24,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of SEED_PLANS) {
    // Check if plan with this code exists
    const existing = await db.select({ id: subscriptionPlans.id }).from(subscriptionPlans)
      .where(inArray(subscriptionPlans.planCode, [plan.planCode])).limit(1);
    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(plan);
    }
  }
  console.log('✅ Subscription plans seeded (Basic Monthly, Premium Monthly, Annual Premium)');

  // Seed inventory / equipment items
  const SEED_INVENTORY = [
    { id: ids.uuid(), name: 'Treadmill', category: 'cardio', qtyInStock: 5, reorderThreshold: 2, isActive: true },
    { id: ids.uuid(), name: 'Bench Press Station', category: 'strength', qtyInStock: 4, reorderThreshold: 1, isActive: true },
    { id: ids.uuid(), name: 'Squat Rack', category: 'strength', qtyInStock: 3, reorderThreshold: 1, isActive: true },
    { id: ids.uuid(), name: 'Dumbbell Set (5–50kg)', category: 'free_weights', qtyInStock: 2, reorderThreshold: 1, isActive: true },
    { id: ids.uuid(), name: 'Rowing Machine', category: 'cardio', qtyInStock: 3, reorderThreshold: 1, isActive: true },
  ];

  for (const item of SEED_INVENTORY) {
    const existing = await db.select({ id: inventoryItems.id }).from(inventoryItems)
      .where(inArray(inventoryItems.name, [item.name])).limit(1);
    if (existing.length === 0) {
      await db.insert(inventoryItems).values(item);
    }
  }
  console.log('✅ Inventory items seeded (5 items)');

  console.log('\n📋 Login credentials (password for all):', SEED_PASSWORD);
  console.log('─'.repeat(60));
  for (const u of SEED_USERS) {
    console.log(`   ${u.role.padEnd(8)} ${u.email}`);
  }
  console.log('─'.repeat(60));
  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
