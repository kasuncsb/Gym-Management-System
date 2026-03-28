/**
 * Database seed — 4 users (one per role) + LKR subscription tiers + library workout templates + sample inventory.
 * Run with: npm run db:seed
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(scriptDir, '..', '..', '.env') });
dotenv.config({ path: join(scriptDir, '..', '.env') });

import { db } from '../src/config/database.js';
import {
  users,
  members,
  trainers,
  config,
  subscriptionPlans,
  inventoryItems,
  subscriptions,
  payments,
  visits,
  ptSessions,
  memberMetrics,
  workoutPlans,
  shifts,
} from '../src/db/schema.js';
import { ids } from '../src/utils/id.js';
import { hashPassword } from '../src/utils/password.js';
import { insertLifecycleRow } from '../src/utils/lifecycle.js';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { LIBRARY_WORKOUT_PLANS } from './data/libraryWorkoutPlans.seed.js';
import { stringifyProgram, workoutProgramJsonSchema } from '../src/validators/workoutProgram.js';

const SEED_PASSWORD = 'PWlogin!26';

function dateAtNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

const SEED_EMAILS = [
  'kasuncsb+admin@gmail.com',
  'kasuncsb+manager@gmail.com',
  'kasuncsb+trainer@gmail.com',
  'kasuncsb+member@gmail.com',
];

const SEED_USERS = [
  {
    role: 'admin' as const,
    email: 'kasuncsb+admin@gmail.com',
    fullName: 'Asiri Wickramasinghe',
    employeeCode: 'PWG-ADM-001',
    designation: 'System Administrator',
    hireDate: '2022-01-15',
    baseSalary: '185000.00',
    isKeyHolder: true,
  },
  {
    role: 'manager' as const,
    email: 'kasuncsb+manager@gmail.com',
    fullName: 'Dilini Perera',
    employeeCode: 'PWG-MGR-001',
    designation: 'Branch Manager',
    hireDate: '2023-03-01',
    baseSalary: '145000.00',
    isKeyHolder: true,
  },
  {
    role: 'trainer' as const,
    email: 'kasuncsb+trainer@gmail.com',
    fullName: 'Chathurika Silva',
    employeeCode: 'PWG-TRN-001',
    designation: 'Head Trainer',
    specialization: 'Strength & Conditioning',
    ptHourlyRate: '3500.00',
    yearsExperience: 8,
    hireDate: '2021-06-01',
    baseSalary: '95000.00',
    isKeyHolder: false,
  },
  {
    role: 'member' as const,
    email: 'kasuncsb+member@gmail.com',
    fullName: 'Nimal Perera',
    memberCode: 'PWG-KBG-2025001',
    memberStatus: 'active' as const,
  },
];

async function removeSeedUsers() {
  const rows = await db.select({ id: users.id }).from(users).where(inArray(users.email, SEED_EMAILS));
  const userIds = rows.map((r) => r.id);
  if (!userIds.length) return;

  const subRows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(inArray(subscriptions.memberId, userIds));
  const subIds = subRows.map((s) => s.id);
  if (subIds.length) {
    await db.delete(payments).where(inArray(payments.subscriptionId, subIds));
    await db.delete(subscriptions).where(inArray(subscriptions.id, subIds));
  }

  await db.delete(visits).where(inArray(visits.personId, userIds));
  await db
    .delete(ptSessions)
    .where(or(inArray(ptSessions.memberId, userIds), inArray(ptSessions.trainerId, userIds)));
  await db.delete(memberMetrics).where(inArray(memberMetrics.personId, userIds));
  await db.delete(workoutPlans).where(inArray(workoutPlans.memberId, userIds));
  await db.delete(shifts).where(inArray(shifts.staffId, userIds));

  await db.delete(users).where(inArray(users.id, userIds));
}

async function seed() {
  console.log('🌱 Seeding database...');

  const configData = [
    { key: 'branch_capacity', value: '120' },
    { key: 'grace_days', value: '3' },
    { key: 'timezone', value: 'Asia/Colombo' },
    { key: 'checkin_qr_ttl_seconds', value: '120' },
    { key: 'checkin_scan_max_retries', value: '5' },
    { key: 'payment_failure_max_retries', value: '3' },
    { key: 'login_failure_lock_threshold', value: '5' },
    { key: 'login_failure_lock_minutes', value: '15' },
    { key: 'db_backup_retention_days', value: '14' },
    { key: 'db_backup_frequency', value: 'daily' },
    { key: 'ai_chat_rate_limit_per_minute', value: '20' },
    { key: 'pt_booking_advance_days_max', value: '60' },
    { key: 'gym_open_time', value: '06:00' },
    { key: 'gym_close_time', value: '22:00' },
    { key: 'session_idle_timeout_minutes', value: '30' },
    { key: 'email_queue_max_attempts', value: '5' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'notify_email', value: 'true' },
    { key: 'notify_sms', value: 'false' },
    { key: 'auto_backup', value: 'true' },
  ];
  for (const c of configData) {
    await db.insert(config).values(c).onDuplicateKeyUpdate({ set: { value: c.value } });
  }
  console.log('✅ Config seeded');

  await removeSeedUsers();
  console.log('🗑️  Removed existing seed users (if any)');

  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const u of SEED_USERS) {
    const id = ids.uuid();
    const userLid = await insertLifecycleRow();

    if (u.role === 'admin' || u.role === 'manager') {
      await db.insert(users).values({
        id,
        lifecycleId: userLid,
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        isActive: true,
        emailVerified: true,
        qrSecret: ids.qrSecret(),
        employeeCode: u.employeeCode,
        designation: u.designation,
        hireDate: dateAtNoon(u.hireDate),
        baseSalary: u.baseSalary,
        isKeyHolder: u.isKeyHolder ?? false,
      });
      continue;
    }

    if (u.role === 'trainer') {
      await db.insert(users).values({
        id,
        lifecycleId: userLid,
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: 'trainer',
        isActive: true,
        emailVerified: true,
        qrSecret: ids.qrSecret(),
      });
      const trLid = await insertLifecycleRow();
      await db.insert(trainers).values({
        userId: id,
        lifecycleId: trLid,
        employeeCode: u.employeeCode,
        hireDate: dateAtNoon(u.hireDate),
        designation: u.designation,
        baseSalary: u.baseSalary,
        isKeyHolder: u.isKeyHolder ?? false,
        specialization: u.specialization ?? null,
        ptHourlyRate: u.ptHourlyRate ?? null,
        yearsExperience: u.yearsExperience ?? null,
      });
      continue;
    }

    await db.insert(users).values({
      id,
      lifecycleId: userLid,
      email: u.email,
      fullName: u.fullName,
      passwordHash,
      role: 'member',
      isActive: true,
      emailVerified: true,
      qrSecret: ids.qrSecret(),
    });
    const memLid = await insertLifecycleRow();
    await db.insert(members).values({
      userId: id,
      lifecycleId: memLid,
      memberCode: u.memberCode!,
      memberStatus: u.memberStatus ?? 'active',
      joinDate: new Date(),
      isOnboarded: true,
      onboardedAt: new Date(),
    });
  }

  console.log('✅ 4 users created (admin, manager, trainer, member)');

  const [trainerRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'kasuncsb+trainer@gmail.com'))
    .limit(1);
  if (trainerRow) {
    const shiftId = ids.uuid();
    const shiftLc = await insertLifecycleRow();
    await db.insert(shifts).values({
      id: shiftId,
      lifecycleId: shiftLc,
      staffId: trainerRow.id,
      shiftType: 'morning',
      shiftDate: dateAtNoon('2026-03-29'),
      startTime: '06:00:00',
      endTime: '14:00:00',
      status: 'scheduled',
      notes: 'Seed shift — trainer weekly grid',
      createdBy: trainerRow.id,
    });
    console.log('✅ Sample shift seeded for trainer (kasuncsb+trainer@gmail.com)');
  }

  const SEED_PLANS = [
    {
      planCode: 'KBG-DAY',
      name: 'Day Pass',
      description: 'Single day, full floor access.',
      planType: 'daily_pass' as const,
      price: '800.00',
      durationDays: 1,
    },
    {
      planCode: 'KBG-WK1',
      name: 'Weekly',
      description: '7 days unlimited access.',
      planType: 'individual' as const,
      price: '2800.00',
      durationDays: 7,
    },
    {
      planCode: 'KBG-M1',
      name: 'Monthly',
      description: '30 days individual membership.',
      planType: 'individual' as const,
      price: '5500.00',
      durationDays: 30,
    },
    {
      planCode: 'KBG-M3',
      name: '3 Months',
      description: '90 days — saves vs monthly.',
      planType: 'individual' as const,
      price: '14500.00',
      durationDays: 90,
    },
    {
      planCode: 'KBG-M6',
      name: '6 Months',
      description: '180 days individual membership.',
      planType: 'individual' as const,
      price: '24000.00',
      durationDays: 180,
    },
    {
      planCode: 'KBG-Y1',
      name: 'Annual',
      description: '12 months — best per-month value.',
      planType: 'individual' as const,
      price: '42000.00',
      durationDays: 365,
    },
    {
      planCode: 'KBG-STU',
      name: 'Student Monthly',
      description: '30 days; valid student ID at desk.',
      planType: 'student' as const,
      price: '4500.00',
      durationDays: 30,
    },
    {
      planCode: 'KBG-CP2',
      name: 'Couple Monthly',
      description: 'Two adults, one membership, 30 days.',
      planType: 'couple' as const,
      price: '9500.00',
      durationDays: 30,
    },
    {
      planCode: 'KBG-CORP',
      name: 'Corporate (10 seats)',
      description: '30-day team block; invoice on request.',
      planType: 'corporate' as const,
      price: '38000.00',
      durationDays: 30,
    },
    {
      planCode: 'KBG-ELITE',
      name: 'Peak Plus Monthly',
      description: '30 days; peak-hour perks where available.',
      planType: 'individual' as const,
      price: '6500.00',
      durationDays: 30,
    },
  ];

  for (const p of SEED_PLANS) {
    const [existing] = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planCode, p.planCode))
      .limit(1);
    if (existing) continue;
    const planId = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(subscriptionPlans).values({
      id: planId,
      lifecycleId: lc,
      planCode: p.planCode,
      name: p.name,
      description: p.description,
      planType: p.planType,
      price: p.price,
      durationDays: p.durationDays,
      isActive: true,
    });
  }
  console.log('✅ Subscription plans seeded (~10 LKR tiers)');

  await db.delete(workoutPlans).where(and(eq(workoutPlans.source, 'library'), isNull(workoutPlans.memberId)));
  for (const def of LIBRARY_WORKOUT_PLANS) {
    workoutProgramJsonSchema.parse(def.program);
    const wId = ids.uuid();
    const wLc = await insertLifecycleRow();
    await db.insert(workoutPlans).values({
      id: wId,
      lifecycleId: wLc,
      memberId: null,
      trainerId: null,
      name: def.name,
      description: def.description,
      source: 'library',
      difficulty: def.difficulty,
      durationWeeks: def.durationWeeks,
      daysPerWeek: def.daysPerWeek,
      isActive: true,
      programJson: stringifyProgram(def.program),
    });
  }
  console.log(`✅ Library workout plans seeded (${LIBRARY_WORKOUT_PLANS.length} programmes)`);

  const SEED_INVENTORY = [
    { name: 'Treadmill', category: 'cardio', qtyInStock: 5, reorderThreshold: 2, isActive: true },
    { name: 'Bench Press Station', category: 'strength', qtyInStock: 4, reorderThreshold: 1, isActive: true },
    { name: 'Squat Rack', category: 'strength', qtyInStock: 3, reorderThreshold: 1, isActive: true },
    { name: 'Dumbbell Set (5–50kg)', category: 'free_weights', qtyInStock: 2, reorderThreshold: 1, isActive: true },
    { name: 'Rowing Machine', category: 'cardio', qtyInStock: 3, reorderThreshold: 1, isActive: true },
  ];

  for (const item of SEED_INVENTORY) {
    const [existing] = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.name, item.name))
      .limit(1);
    if (existing) continue;
    const itemId = ids.uuid();
    const ilc = await insertLifecycleRow();
    await db.insert(inventoryItems).values({
      id: itemId,
      lifecycleId: ilc,
      ...item,
    });
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
