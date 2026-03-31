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
  workoutSessions,
  equipment,
  equipmentEvents,
  inventoryTransactions,
  promotions,
  branchClosures,
  auditLogs,
  aiInteractions,
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

const dayMs = 24 * 60 * 60 * 1000;
const toYmd = (d: Date) => d.toISOString().slice(0, 10);
const dateAtNoonFrom = (d: Date) => dateAtNoon(toYmd(d));
const pad2 = (n: number) => String(n).padStart(2, '0');

function parseHMSMinutes(raw: string): number | null {
  const s = raw.trim();
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function hmsFromMinutes(totalMins: number): string {
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  return `${pad2(hh)}:${pad2(mm)}:00`;
}

function endHMS(startHms: string, durationMinutes: number): string {
  const startM = parseHMSMinutes(startHms);
  if (startM == null) throw new Error(`Invalid start time: ${startHms}`);
  return hmsFromMinutes(startM + durationMinutes);
}

const SEED_EMAILS = [
  'kasuncsb+admin@gmail.com',
  'kasuncsb+manager@gmail.com',
  'kasuncsb+trainer@gmail.com',
  'kasuncsb+member@gmail.com',
  // Legacy seeded trainer/member accounts (removed during re-seed)
  'kasuncsb+trainer1@gmail.com',
  'kasuncsb+trainer2@gmail.com',
  'kasuncsb+trainer3@gmail.com',
  'kasuncsb+member1@gmail.com',
  'kasuncsb+member2@gmail.com',
  'kasuncsb+member3@gmail.com',
  'kasuncsb+member4@gmail.com',
  'kasuncsb+member5@gmail.com',
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
    email: 'kasuncsb+trainer1@gmail.com',
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
    email: 'kasuncsb+member1@gmail.com',
    fullName: 'Nimal Perera',
    memberCode: 'PWG-KBG-2025001',
    memberStatus: 'active' as const,
    assignedTrainerEmail: 'kasuncsb+trainer1@gmail.com',
    idVerificationStatus: 'approved' as const,
  },
  {
    role: 'trainer' as const,
    email: 'kasuncsb+trainer2@gmail.com',
    fullName: 'Rangana Perera',
    employeeCode: 'PWG-TRN-002',
    designation: 'Senior Trainer',
    specialization: 'Sports Conditioning',
    ptHourlyRate: '3200.00',
    yearsExperience: 6,
    hireDate: '2022-01-10',
    baseSalary: '82000.00',
    isKeyHolder: false,
  },
  {
    role: 'member' as const,
    email: 'kasuncsb+member2@gmail.com',
    fullName: 'Ishantha Rodrigo',
    memberCode: 'PWG-KBG-2025002',
    memberStatus: 'active' as const,
    assignedTrainerEmail: 'kasuncsb+trainer1@gmail.com',
    idVerificationStatus: 'approved' as const,
  },
  {
    role: 'trainer' as const,
    email: 'kasuncsb+trainer3@gmail.com',
    fullName: 'Sahan Jayasekara',
    employeeCode: 'PWG-TRN-003',
    designation: 'Trainer',
    specialization: 'Weight Management',
    ptHourlyRate: '3000.00',
    yearsExperience: 4,
    hireDate: '2022-09-01',
    baseSalary: '76000.00',
    isKeyHolder: false,
  },
  {
    role: 'member' as const,
    email: 'kasuncsb+member3@gmail.com',
    fullName: 'Kavinda Weerasooriya',
    memberCode: 'PWG-KBG-2025003',
    memberStatus: 'active' as const,
    assignedTrainerEmail: 'kasuncsb+trainer2@gmail.com',
    idVerificationStatus: 'approved' as const,
  },
  {
    role: 'member' as const,
    email: 'kasuncsb+member4@gmail.com',
    fullName: 'Thilina Kumara',
    memberCode: 'PWG-KBG-2025004',
    memberStatus: 'active' as const,
    assignedTrainerEmail: 'kasuncsb+trainer3@gmail.com',
    idVerificationStatus: 'approved' as const,
  },
  {
    role: 'member' as const,
    email: 'kasuncsb+member5@gmail.com',
    fullName: 'Chamara Perera',
    memberCode: 'PWG-KBG-2025005',
    memberStatus: 'active' as const,
    assignedTrainerEmail: 'kasuncsb+trainer2@gmail.com',
    // Keep one member in pending state so manager/admin dashboards show pending ID verifications
    idVerificationStatus: 'pending' as const,
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
  await db.delete(workoutSessions).where(inArray(workoutSessions.personId, userIds));
  await db.delete(inventoryTransactions).where(inArray(inventoryTransactions.recordedBy, userIds));
  await db
    .delete(equipmentEvents)
    .where(or(inArray(equipmentEvents.loggedBy, userIds), inArray(equipmentEvents.resolvedBy, userIds)));
  await db.delete(auditLogs).where(inArray(auditLogs.actorId, userIds));
  await db.delete(aiInteractions).where(inArray(aiInteractions.userId, userIds));

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

  const userIdByEmail = new Map<string, string>();

  for (const u of SEED_USERS) {
    const id = ids.uuid();
    const userLid = await insertLifecycleRow();
    userIdByEmail.set(u.email, id);

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
      assignedTrainerId: u.assignedTrainerEmail ? userIdByEmail.get(u.assignedTrainerEmail) ?? null : null,
      idVerificationStatus: u.idVerificationStatus ?? 'approved',
    });
  }

  console.log(`✅ ${SEED_USERS.length} users created (admin/manager + 3 trainers + 5 members)`);

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
    // Intentionally create low-stock items so trainer tasks + manager alerts have something to work on.
    { name: 'Treadmill', category: 'cardio', qtyInStock: 1, reorderThreshold: 2, isActive: true },
    { name: 'Bench Press Station', category: 'strength', qtyInStock: 4, reorderThreshold: 2, isActive: true },
    { name: 'Squat Rack', category: 'strength', qtyInStock: 0, reorderThreshold: 1, isActive: true },
    { name: 'Dumbbell Set (5–50kg)', category: 'free_weights', qtyInStock: 0, reorderThreshold: 2, isActive: true },
    { name: 'Rowing Machine', category: 'cardio', qtyInStock: 2, reorderThreshold: 3, isActive: true },
  ];

  for (const item of SEED_INVENTORY) {
    const [existing] = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.name, item.name))
      .limit(1);
    if (existing) {
      await db.update(inventoryItems).set({
        category: item.category,
        qtyInStock: item.qtyInStock,
        reorderThreshold: item.reorderThreshold,
        isActive: item.isActive,
      }).where(eq(inventoryItems.id, existing.id));
      continue;
    }
    const itemId = ids.uuid();
    const ilc = await insertLifecycleRow();
    await db.insert(inventoryItems).values({
      id: itemId,
      lifecycleId: ilc,
      ...item,
    });
  }
  console.log('✅ Inventory items seeded (5 items)');

  // ─────────────────────────────────────────────────────────────────────────────
  // Role coverage seeds (so every dashboard page has non-empty data)
  // ─────────────────────────────────────────────────────────────────────────────

  const now = new Date();

  // Trainers / members IDs from seeded identities
  const trainerEmails = SEED_USERS.filter((u: any) => u.role === 'trainer').map((u: any) => u.email as string);
  const memberEmails = SEED_USERS.filter((u: any) => u.role === 'member').map((u: any) => u.email as string);

  const trainerIds = trainerEmails.map((e) => userIdByEmail.get(e)!).filter(Boolean);
  const memberIds = memberEmails.map((e) => userIdByEmail.get(e)!).filter(Boolean);

  const trainerIdByEmail: Record<string, string> = {};
  for (const e of trainerEmails) {
    const id = userIdByEmail.get(e);
    if (id) trainerIdByEmail[e] = id;
  }
  const memberSeedDefs = SEED_USERS.filter((u: any) => u.role === 'member').map((u: any) => ({
    email: u.email as string,
    memberId: userIdByEmail.get(u.email) as string,
    assignedTrainerEmail: u.assignedTrainerEmail as string,
    idVerificationStatus: (u.idVerificationStatus as string | undefined) ?? 'approved',
  }));

  // 1) Promotions + branch closures (manager/admin KPIs + lists)
  await db.delete(promotions).where(or(eq(promotions.code, 'SEED-SAVE10'), eq(promotions.code, 'SEED-WELCOME5')));
  {
    const createdAt = dateAtNoonFrom(new Date(now.getTime() - 10 * dayMs));
    const lc = await insertLifecycleRow();
    await db.insert(promotions).values({
      id: ids.uuid(),
      lifecycleId: lc,
      code: 'SEED-SAVE10',
      name: 'Seed Save 10%',
      discountType: 'percentage',
      discountValue: '10.00' as any,
      validFrom: createdAt,
      validUntil: dateAtNoonFrom(new Date(now.getTime() + 40 * dayMs)),
      isActive: true,
      usedCount: 0,
    });
  }
  {
    const lc = await insertLifecycleRow();
    await db.insert(promotions).values({
      id: ids.uuid(),
      lifecycleId: lc,
      code: 'SEED-WELCOME5',
      name: 'Seed Welcome 5%',
      discountType: 'percentage',
      discountValue: '5.00' as any,
      validFrom: dateAtNoonFrom(new Date(now.getTime() - 5 * dayMs)),
      validUntil: dateAtNoonFrom(new Date(now.getTime() + 35 * dayMs)),
      isActive: true,
      usedCount: 0,
    });
  }

  await db.delete(branchClosures).where(or(eq(branchClosures.reason, 'Seed planned closure'), eq(branchClosures.reason, 'Seed emergency closure')));
  {
    const lc = await insertLifecycleRow();
    await db.insert(branchClosures).values({
      id: ids.uuid(),
      lifecycleId: lc,
      closureDate: dateAtNoonFrom(new Date(now.getTime() - 7 * dayMs)),
      reason: 'Seed planned closure',
      isEmergency: false,
      closedBy: userIdByEmail.get('kasuncsb+manager@gmail.com') ?? null,
    });
  }
  {
    const lc = await insertLifecycleRow();
    await db.insert(branchClosures).values({
      id: ids.uuid(),
      lifecycleId: lc,
      closureDate: dateAtNoonFrom(new Date(now.getTime() - 20 * dayMs)),
      reason: 'Seed emergency closure',
      isEmergency: true,
      closedBy: userIdByEmail.get('kasuncsb+manager@gmail.com') ?? null,
    });
  }

  // 2) Equipment + equipment events (trainer tasks + manager/admin incidents)
  const SEED_EQUIPMENT = [
    { name: 'Treadmill X5', category: 'cardio', quantity: 5, status: 'operational' as const, zoneLabel: 'Floor 1 - North' },
    { name: 'Bench Press Station', category: 'bench', quantity: 3, status: 'needs_maintenance' as const, zoneLabel: 'Floor 1 - West' },
    { name: 'Squat Rack', category: 'strength_machine', quantity: 2, status: 'operational' as const, zoneLabel: 'Floor 1 - South' },
    { name: 'Dumbbell Set 5-50kg', category: 'free_weight' as const, quantity: 4, status: 'operational' as const, zoneLabel: 'Floor 2 - Center' },
    { name: 'Rowing Machine', category: 'cardio', quantity: 3, status: 'retired' as const, zoneLabel: 'Floor 1 - East' },
  ];

  // Upsert equipment (by name)
  for (const item of SEED_EQUIPMENT) {
    const [existing] = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(eq(equipment.name, item.name))
      .limit(1);
    if (existing) {
      await db.update(equipment).set({
        category: item.category as any,
        quantity: item.quantity as any,
        status: item.status as any,
        zoneLabel: item.zoneLabel,
      }).where(eq(equipment.id, existing.id));
    } else {
      const eqId = ids.uuid();
      const ilc = await insertLifecycleRow();
      await db.insert(equipment).values({
        id: eqId,
        lifecycleId: ilc,
        name: item.name,
        category: item.category as any,
        quantity: item.quantity as any,
        status: item.status as any,
        zoneLabel: item.zoneLabel,
      });
    }
  }

  const equipmentIdsByName: Record<string, string> = {};
  const eqNameList = SEED_EQUIPMENT.map((e) => e.name);
  const eqRows = await db
    .select({ id: equipment.id, name: equipment.name })
    .from(equipment)
    .where(inArray(equipment.name, eqNameList));
  for (const r of eqRows) equipmentIdsByName[r.name] = r.id;

  // Recreate seeded equipment events (delete by our equipment IDs)
  const seededEqIds = Object.values(equipmentIdsByName);
  if (seededEqIds.length) {
    await db.delete(equipmentEvents).where(inArray(equipmentEvents.equipmentId, seededEqIds));
  }

  const managerId = userIdByEmail.get('kasuncsb+manager@gmail.com')!;
  const trainer1 = userIdByEmail.get('kasuncsb+trainer1@gmail.com') ?? trainerIds[0];
  const trainer2 = userIdByEmail.get('kasuncsb+trainer2@gmail.com') ?? trainerIds[1];
  const trainer3 = userIdByEmail.get('kasuncsb+trainer3@gmail.com') ?? trainerIds[2];

  const SEED_EQUIPMENT_EVENTS: Array<{
    equipmentName: string;
    eventType: 'issue_reported' | 'maintenance_done';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    status: 'open' | 'in_progress' | 'resolved';
    loggedBy: string | null;
    resolvedBy?: string | null;
    resolvedAtMinutesAgo?: number;
  }> = [
    {
      equipmentName: 'Bench Press Station',
      eventType: 'issue_reported',
      severity: 'critical',
      description: 'Bench wobble reported; stop using until inspection.',
      status: 'open',
      loggedBy: trainer2 ?? null,
    },
    {
      equipmentName: 'Squat Rack',
      eventType: 'issue_reported',
      severity: 'high',
      description: 'Hydraulic leak suspected under the squat rack base.',
      status: 'open',
      loggedBy: trainer3 ?? null,
    },
    {
      equipmentName: 'Treadmill X5',
      eventType: 'issue_reported',
      severity: 'medium',
      description: 'Belt hesitates during warm-up; likely alignment issue.',
      status: 'in_progress',
      loggedBy: trainer1 ?? null,
    },
    {
      equipmentName: 'Rowing Machine',
      eventType: 'maintenance_done',
      severity: 'low',
      description: 'Seat rail cleaned and tightened; maintenance completed.',
      status: 'resolved',
      loggedBy: trainer1 ?? null,
      resolvedBy: managerId,
      resolvedAtMinutesAgo: 90,
    },
  ];

  for (const e of SEED_EQUIPMENT_EVENTS) {
    const eqId = equipmentIdsByName[e.equipmentName];
    if (!eqId) continue;
    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(equipmentEvents).values({
      id,
      lifecycleId: lc,
      equipmentId: eqId,
      eventType: e.eventType,
      severity: e.severity,
      description: e.description,
      status: e.status,
      loggedBy: e.loggedBy ?? null,
      resolvedBy: e.resolvedBy ?? null,
      resolvedAt: e.resolvedAtMinutesAgo != null ? new Date(now.getTime() - e.resolvedAtMinutesAgo * 60_000) : null,
    });
  }

  // 3) Inventory transactions (manager inventory history)
  // Delete prior seeded transactions by reference prefix pattern.
  await db.delete(inventoryTransactions).where(isNull(inventoryTransactions.reference));
  // Seed a few transactions for our inventory item names.
  const invNameList = SEED_INVENTORY.map((i) => i.name);
  const invItemRows = await db.select({ id: inventoryItems.id, name: inventoryItems.name }).from(inventoryItems).where(inArray(inventoryItems.name, invNameList));
  const invIdByName: Record<string, string> = {};
  for (const r of invItemRows) invIdByName[r.name] = r.id;
  const makeRef = (s: string) => `SEED-${s}`;
  const SEED_INVENTORY_TXNS: Array<{ itemName: string; txnType: 'restock' | 'sale' | 'adjustment' | 'waste'; qtyChange: number; reference: string; recordedBy: string }> = [
    { itemName: 'Treadmill', txnType: 'restock', qtyChange: 3, reference: makeRef('INV-TD-1'), recordedBy: managerId },
    { itemName: 'Treadmill', txnType: 'waste', qtyChange: -1, reference: makeRef('INV-TD-2'), recordedBy: trainer1! },
    { itemName: 'Squat Rack', txnType: 'restock', qtyChange: 1, reference: makeRef('INV-SQ-1'), recordedBy: trainer3! },
    { itemName: 'Dumbbell Set (5–50kg)', txnType: 'restock', qtyChange: 1, reference: makeRef('INV-DB-1'), recordedBy: trainer2! },
    { itemName: 'Rowing Machine', txnType: 'adjustment', qtyChange: 2, reference: makeRef('INV-RW-1'), recordedBy: managerId },
  ];
  for (const t of SEED_INVENTORY_TXNS) {
    const itemId = invIdByName[t.itemName];
    if (!itemId) continue;
    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(inventoryTransactions).values({
      id,
      lifecycleId: lc,
      itemId,
      txnType: t.txnType,
      qtyChange: t.qtyChange,
      reference: t.reference,
      recordedBy: t.recordedBy,
    });
  }

  // 4) Shifts + Visits + PT Sessions + Subscriptions + Payments
  // Shifts for schedules and PT availability lookups
  const shiftTypeByIdx: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
  const SHIFTS_PAST_DAYS = 30;
  const SHIFTS_FUTURE_DAYS = 7;
  for (let dayOffset = -SHIFTS_PAST_DAYS; dayOffset < SHIFTS_FUTURE_DAYS; dayOffset++) {
    const shiftDate = dateAtNoonFrom(new Date(now.getTime() + dayOffset * dayMs));
    for (let tIdx = 0; tIdx < trainerIds.length; tIdx++) {
      const staffId = trainerIds[tIdx];
      const st = shiftTypeByIdx[tIdx % shiftTypeByIdx.length];
      const shiftDef = st === 'morning'
        ? { startTime: '06:00:00', endTime: '14:00:00' }
        : st === 'afternoon'
          ? { startTime: '14:00:00', endTime: '18:00:00' }
          : { startTime: '18:00:00', endTime: '22:00:00' };
      const id = ids.uuid();
      const lc = await insertLifecycleRow();
      await db.insert(shifts).values({
        id,
        lifecycleId: lc,
        staffId,
        shiftType: st,
        shiftDate,
        startTime: shiftDef.startTime,
        endTime: shiftDef.endTime,
        status: dayOffset < 0 ? 'completed' : dayOffset === 0 ? 'active' : 'scheduled',
        notes: dayOffset < 0 ? 'Seed shift — historical coverage' : 'Seed shift — recurring grid',
        createdBy: managerId,
      });
    }
  }

  // Visits (busy gym): 30-day series for members + trainers. Keep exactly one active visit per person today.
  await db.delete(visits).where(inArray(visits.personId, [...memberIds, ...trainerIds]));

  for (let dayAgo = 30; dayAgo >= 1; dayAgo--) {
    const base = new Date(now.getTime() - dayAgo * dayMs);
    // Members: 1–2 visits per day (busy gym despite small demo user set)
    for (let mi = 0; mi < memberSeedDefs.length; mi++) {
      const m = memberSeedDefs[mi]!;
      const visitsTodayForMember = (dayAgo % 6 === 0 || mi % 2 === 0) ? 2 : 1;
      for (let vi = 0; vi < visitsTodayForMember; vi++) {
        const checkInAt = new Date(base.getTime() + (6 + vi * 7 + (mi % 3)) * 60 * 60_000); // morning/evening split
        const durationMin = 60 + ((mi + vi + dayAgo) % 4) * 15; // 60–105
        const checkOutAt = new Date(checkInAt.getTime() + durationMin * 60_000);
        const id = ids.uuid();
        const lc = await insertLifecycleRow();
        await db.insert(visits).values({
          id,
          lifecycleId: lc,
          personId: m.memberId,
          checkInAt,
          checkOutAt,
          durationMin,
          status: 'completed',
        });
      }
    }

    // Trainers: completed "shift visit" for each day
    for (let ti = 0; ti < trainerIds.length; ti++) {
      const trId = trainerIds[ti]!;
      const checkInAt = new Date(base.getTime() + (6 + (ti % 3) * 4) * 60 * 60_000);
      const durationMin = 8 * 60; // 8h
      const checkOutAt = new Date(checkInAt.getTime() + durationMin * 60_000);
      const id = ids.uuid();
      const lc = await insertLifecycleRow();
      await db.insert(visits).values({
        id,
        lifecycleId: lc,
        personId: trId,
        checkInAt,
        checkOutAt,
        durationMin,
        status: 'completed',
      });
    }
  }

  // Today: one active visit per member + trainer (used by dashboards "on shift"/"active now")
  for (let mi = 0; mi < memberSeedDefs.length; mi++) {
    const m = memberSeedDefs[mi]!;
    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(visits).values({
      id,
      lifecycleId: lc,
      personId: m.memberId,
      checkInAt: new Date(now.getTime() - (25 + mi * 4) * 60_000),
      status: 'active',
    });
  }
  for (let ti = 0; ti < trainerIds.length; ti++) {
    const trId = trainerIds[ti]!;
    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(visits).values({
      id,
      lifecycleId: lc,
      personId: trId,
      checkInAt: new Date(now.getTime() - (18 + ti * 6) * 60_000),
      status: 'active',
    });
  }

  // Subscription plans -> member subscriptions + payments for revenue + active subscription UI
  const planCodesForMembers = memberSeedDefs.map((_, idx) => {
    // Mix plan types so reports have variety
    if (idx % 3 === 0) return 'KBG-WK1';
    if (idx % 3 === 1) return 'KBG-M1';
    return 'KBG-M3';
  });
  const desiredPlanCodes = ['KBG-WK1', 'KBG-M1', 'KBG-M3'];
  const planRows = await db
    .select({ id: subscriptionPlans.id, planCode: subscriptionPlans.planCode, price: subscriptionPlans.price, durationDays: subscriptionPlans.durationDays, name: subscriptionPlans.name })
    .from(subscriptionPlans)
    .where(inArray(subscriptionPlans.planCode, desiredPlanCodes));
  const planByCode: Record<string, any> = {};
  for (const r of planRows) {
    if (!r.planCode) continue;
    planByCode[r.planCode] = r;
  }

  // Clear prior subscriptions/payments for these members (removeSeedUsers already removed payments/subscriptions by memberId)
  for (let i = 0; i < memberSeedDefs.length; i++) {
    const m = memberSeedDefs[i];
    const planCode = planCodesForMembers[i]!;
    const plan = planByCode[planCode];
    if (!plan) continue;

    const subId = ids.uuid();
    const subLc = await insertLifecycleRow();
    const subStart = dateAtNoonFrom(new Date(now.getTime() - 20 * dayMs));
    const subEnd = dateAtNoonFrom(new Date(now.getTime() + 25 * dayMs));
    const status = m.idVerificationStatus === 'pending' ? ('active' as const) : ('active' as const);
    await db.insert(subscriptions).values({
      id: subId,
      lifecycleId: subLc,
      memberId: m.memberId,
      planId: plan.id,
      startDate: subStart,
      endDate: subEnd,
      status,
      pricePaid: plan.price,
      discountAmount: '0.00' as any,
      promotionId: null,
    });

    const payId = ids.uuid();
    const payLc = await insertLifecycleRow();
    await db.insert(payments).values({
      id: payId,
      lifecycleId: payLc,
      subscriptionId: subId,
      amount: plan.price,
      paymentMethod: 'online',
      paymentDate: dateAtNoonFrom(new Date(now.getTime() - (i % 8) * dayMs)),
      status: 'completed',
      receiptNumber: `RCPT-${i + 1}-${now.getTime()}`,
      referenceNumber: `REF-${i + 1}-${Math.floor(Math.random() * 9999)}`,
      instrumentHash: null,
      promotionId: null,
      discountAmount: '0.00' as any,
      recordedBy: managerId,
      invoiceNumber: `INV-${i + 1}-${now.getTime()}`,
    });
  }

  // PT Sessions (busy gym): 30-day history + 7-day forward schedule, non-overlapping per trainer.
  await db.delete(ptSessions).where(or(inArray(ptSessions.memberId, memberIds), inArray(ptSessions.trainerId, trainerIds)));

  const slotStarts: string[] = [
    '06:30:00', '08:00:00', '09:30:00', '11:00:00', '12:30:00',
    '14:00:00', '15:30:00', '17:00:00', '18:30:00', '20:00:00',
  ];
  const slotDurations = [45, 60, 75, 90];

  // Map member order per trainer so each trainer has some sessions.
  const membersByTrainer: Record<string, string[]> = {};
  for (const m of memberSeedDefs) {
    const tId = trainerIdByEmail[m.assignedTrainerEmail];
    if (!tId) continue;
    if (!membersByTrainer[tId]) membersByTrainer[tId] = [];
    membersByTrainer[tId].push(m.memberId);
  }

  for (const tId of trainerIds) {
    const mems = membersByTrainer[tId] ?? memberIds;
    // 30 days past (mostly completed), 7 days future (booked/confirmed)
    for (let dayOffset = -30; dayOffset <= 7; dayOffset++) {
      const sessionDay = dateAtNoonFrom(new Date(now.getTime() + dayOffset * dayMs));
      const slotsPerDay = dayOffset < 0 ? 4 : dayOffset === 0 ? 3 : 2;
      for (let si = 0; si < slotsPerDay; si++) {
        const start = slotStarts[(si + Math.abs(dayOffset) + (tId.charCodeAt(0) % 3)) % slotStarts.length]!;
        const durationMinutes = slotDurations[(si + Math.abs(dayOffset)) % slotDurations.length]!;
        const memberId = mems[(si + Math.abs(dayOffset)) % mems.length]!;

        let status: any = 'confirmed';
        let reviewRating: number | null = null;
        let reviewComment: string | null = null;
        let cancelReason: string | null = null;

        if (dayOffset < 0) {
          // Past: mostly completed, some cancelled/no_show
          const mod = (Math.abs(dayOffset) + si) % 10;
          if (mod === 0) {
            status = 'cancelled';
            cancelReason = 'Seed cancellation — schedule conflict.';
          } else if (mod === 1) {
            status = 'no_show';
            cancelReason = 'Seed no-show — member did not arrive.';
          } else {
            status = 'completed';
            reviewRating = 4 + ((si + Math.abs(dayOffset)) % 2);
            reviewComment = 'Solid session — progressive overload maintained.';
          }
        } else if (dayOffset === 0) {
          status = si === 0 ? 'booked' : 'confirmed';
        } else {
          status = si % 2 === 0 ? 'confirmed' : 'booked';
        }

        const id = ids.uuid();
        const lc = await insertLifecycleRow();
        await db.insert(ptSessions).values({
          id,
          lifecycleId: lc,
          memberId,
          trainerId: tId,
          sessionDate: sessionDay,
          startTime: start,
          endTime: endHMS(start, durationMinutes),
          durationMinutes,
          status,
          cancelReason,
          reviewRating,
          reviewComment,
        });
      }
    }
  }

  // Workout plans for members + workout sessions + member metrics
  // Assign each member a trainer_created plan based on library templates.
  const memberPlanDefs = new Map<string, string>(); // memberId -> workoutPlans.id
  const libPlansByDifficulty = {
    beginner: LIBRARY_WORKOUT_PLANS.filter((p) => p.difficulty === 'beginner'),
    intermediate: LIBRARY_WORKOUT_PLANS.filter((p) => p.difficulty === 'intermediate'),
    advanced: LIBRARY_WORKOUT_PLANS.filter((p) => p.difficulty === 'advanced'),
  } as any;

  // Ensure there are no leftover assigned plans
  await db.delete(workoutPlans).where(inArray(workoutPlans.memberId, memberIds));

  for (let i = 0; i < memberSeedDefs.length; i++) {
    const m = memberSeedDefs[i]!;
    const trainerId = trainerIdByEmail[m.assignedTrainerEmail];
    if (!trainerId) continue;

    const diff: 'beginner' | 'intermediate' | 'advanced' =
      i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced';
    const pool = libPlansByDifficulty[diff] ?? LIBRARY_WORKOUT_PLANS;
    const def = pool[i % pool.length]!;

    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(workoutPlans).values({
      id,
      lifecycleId: lc,
      memberId: m.memberId,
      trainerId,
      name: `${m.email.split('@')[0]} — ${def.name}`,
      description: def.description,
      source: 'trainer_created',
      difficulty: def.difficulty,
      durationWeeks: def.durationWeeks,
      daysPerWeek: def.daysPerWeek,
      isActive: true,
      programJson: stringifyProgram(def.program),
    });
    memberPlanDefs.set(m.memberId, id);
  }

  // Workout sessions (busy gym): last 30 days per member.
  await db.delete(workoutSessions).where(inArray(workoutSessions.personId, memberIds));
  for (const [memberId, planId] of memberPlanDefs.entries()) {
    for (let dayAgo = 30; dayAgo >= 1; dayAgo--) {
      const shouldWorkout = ((dayAgo + memberId.charCodeAt(0)) % 2 === 0) || (dayAgo % 7 === 0); // ~4–5x/week + weekends
      if (!shouldWorkout) continue;
      const endedAt = new Date(now.getTime() - dayAgo * dayMs + ((18 + (dayAgo % 3)) * 60) * 60_000); // evening
      const durationMin = 40 + ((dayAgo + memberId.charCodeAt(1)) % 7) * 5; // 40–70
      const caloriesBurned = 220 + ((dayAgo + memberId.charCodeAt(2)) % 9) * 35; // ~220–500
      const id = ids.uuid();
      const lc = await insertLifecycleRow();
      await db.insert(workoutSessions).values({
        id,
        lifecycleId: lc,
        personId: memberId,
        planId,
        status: dayAgo % 9 === 0 ? 'stopped' : 'completed',
        startedAt: new Date(endedAt.getTime() - durationMin * 60_000),
        endedAt,
        durationMin,
        caloriesBurned,
        mood: dayAgo % 10 === 0 ? 'tired' : dayAgo % 6 === 0 ? 'great' : 'good',
        notes: dayAgo % 9 === 0 ? 'Stopped early — time constraint.' : 'Completed — steady pace.',
      });
    }
  }

  // Member metrics
  await db.delete(memberMetrics).where(inArray(memberMetrics.personId, memberIds));
  for (let i = 0; i < memberSeedDefs.length; i++) {
    const m = memberSeedDefs[i]!;
    const personId = m.memberId;
    const entries = [
      { daysAgo: 2, weightKg: 68 + i * 0.8, heightCm: 175 + i, restingHr: 62 - i, bmi: null as any },
      { daysAgo: 16, weightKg: 67 + i * 0.7, heightCm: 175 + i, restingHr: 64 - i, bmi: null as any },
      { daysAgo: 32, weightKg: 69 + i * 0.9, heightCm: 175 + i, restingHr: 66 - i, bmi: null as any },
    ];
    for (const [idx, e] of entries.entries()) {
      const bmi = e.heightCm > 0 ? Number((e.weightKg / ((e.heightCm / 100) ** 2)).toFixed(1)) : null;
      const id = ids.uuid();
      const lc = await insertLifecycleRow();
      await db.insert(memberMetrics).values({
        id,
        lifecycleId: lc,
        personId,
        recordedAt: new Date(now.getTime() - e.daysAgo * dayMs + idx * 60_000),
        source: 'manual',
        weightKg: e.weightKg,
        heightCm: e.heightCm,
        bmi,
        restingHr: e.restingHr,
        notes: `Seed metric #${idx + 1}`,
      } as any);
    }
  }

  // Minimal AI interaction + audit logs so assistant/alerts have content
  await db.delete(aiInteractions).where(inArray(aiInteractions.userId, memberIds));
  for (let i = 0; i < 3; i++) {
    const mId = memberIds[i] ?? memberIds[0];
    const id = ids.uuid();
    const lc = await insertLifecycleRow();
    await db.insert(aiInteractions).values({
      id,
      lifecycleId: lc,
      userId: mId,
      userRole: 'member',
      interactionType: i === 0 ? 'chat' : i === 1 ? 'workout_plan' : 'insight',
      promptText: 'Seed prompt',
      responseText: 'Seed response',
      source: 'system',
      metadataJson: null,
      chatSessionId: null,
      chatMessageRole: null,
      seq: null,
    } as any);
  }

  const auditActors = [managerId, trainer1, trainer2, trainer3].filter(Boolean) as string[];
  await db.delete(auditLogs).where(inArray(auditLogs.actorId, auditActors));
  for (let i = 0; i < 30; i++) {
    const actorId = auditActors[i % auditActors.length]!;
    await db.insert(auditLogs).values({
      id: ids.uuid(),
      actorId,
      actorLabel: null,
      action: 'staff_broadcast',
      category: 'system',
      entityType: 'broadcast',
      entityId: null,
      detail: `Seed broadcast #${i + 1} — keep eyes on peak hours and equipment queue.`,
    });
  }

  console.log('\n✅ Seed script completed successfully');

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
