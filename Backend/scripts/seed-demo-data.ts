// Seed Demo Data Script — Phase 1 (BRD-aligned)
// Run with: npm run seed:demo

import { db } from '../src/config/database';
import {
  users, members, staff, trainers, branches,
  subscriptionPlans, subscriptions, payments,
  accessLogs, visitSessions, equipment,
  zones, gates, refreshTokens, memberDocuments,
  auditLogs, notifications,
} from '../src/db/schema';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { generateUserSecret, buildQRPayload } from '../src/utils/qr-generator';

// ── Config ─────────────────────────────────────────
const MEMBER_COUNT = 50;
const STAFF_COUNT = 6;
const TRAINER_COUNT = 4;
const PASSWORD = 'admin123';

// ── Helpers ────────────────────────────────────────
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const firstNames = [
  'Kasun', 'Nuwan', 'Amara', 'Dilini', 'Chamara', 'Nethmi', 'Tharindu',
  'Sanduni', 'Ravindu', 'Hasini', 'Priya', 'Saman', 'Kumari', 'Roshan',
  'Malini', 'Dinesh', 'Kavitha', 'Asanka', 'Nirosha', 'Chathura',
];
const lastNames = [
  'Perera', 'Fernando', 'Silva', 'Jayasuriya', 'Bandara', 'Wickramasinghe',
  'Gunawardena', 'Rajapaksa', 'Dissanayake', 'Senanayake',
];

const genders: ('male' | 'female' | 'prefer_not_to_say')[] = ['male', 'female', 'prefer_not_to_say'];

// ── Cleanup ────────────────────────────────────────
async function cleanupData() {
  console.log('🗑️  Cleaning up existing data...\n');
  try {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    await db.delete(auditLogs);
    await db.delete(notifications);
    await db.delete(refreshTokens);
    await db.delete(accessLogs);
    await db.delete(visitSessions);
    await db.delete(payments);
    await db.delete(subscriptions);
    await db.delete(memberDocuments);
    await db.delete(members);
    await db.delete(trainers);
    await db.delete(staff);
    await db.delete(equipment);
    await db.delete(gates);
    await db.delete(zones);
    await db.delete(subscriptionPlans);
    await db.delete(branches);
    await db.delete(users);

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error);
  }
}

// ── Main Seed ──────────────────────────────────────
async function seedData() {
  console.log('🌱 Starting PowerWorld demo seed...\n');
  await cleanupData();

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // ═══════════════════════════════════════════════════
  // 1. Branch
  // ═══════════════════════════════════════════════════
  console.log('🏢 Creating branch...');
  const branchId = randomUUID();
  await db.insert(branches).values({
    id: branchId,
    name: 'PowerWorld Kiribathgoda',
    code: 'PWK01',
    address: '150 Kandy Road, Kiribathgoda, Sri Lanka',
    phone: '+94112345678',
    email: 'kiribathgoda@powerworld.lk',
    openTime: '05:00:00',
    closeTime: '22:00:00',
    operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    capacity: 150,
    gracePeriodDays: 3,
    isActive: true,
  });

  // ═══════════════════════════════════════════════════
  // 2. Zone & Gate
  // ═══════════════════════════════════════════════════
  console.log('🚪 Creating zones & gates...');
  const mainZoneId = randomUUID();
  const cardioZoneId = randomUUID();
  await db.insert(zones).values([
    { id: mainZoneId, branchId, name: 'Main Floor', capacity: 80 },
    { id: cardioZoneId, branchId, name: 'Cardio Zone', capacity: 30 },
  ]);

  const mainGateId = 'main-gate';
  const receptionGateId = 'reception-desk';
  await db.insert(gates).values([
    { id: mainGateId, zoneId: mainZoneId, name: 'Main Turnstile', deviceId: 'DEV-001', status: 'active' },
    { id: receptionGateId, zoneId: mainZoneId, name: 'Reception Desk', deviceId: 'DEV-002', status: 'active' },
  ]);

  // ═══════════════════════════════════════════════════
  // 3. Subscription Plans
  // ═══════════════════════════════════════════════════
  console.log('💳 Creating subscription plans...');
  const planDefs = [
    { name: 'Day Pass', price: '500.00', dur: 1, features: ['Gym access (1 day)'], pt: 0, sort: 1 },
    { name: 'Basic Monthly', price: '3500.00', dur: 30, features: ['Gym access', 'Locker'], pt: 0, sort: 2 },
    { name: 'Premium Monthly', price: '6000.00', dur: 30, features: ['Gym access', 'Locker', 'Towel', 'Guest pass 1x'], pt: 2, sort: 3 },
    { name: 'Annual Basic', price: '35000.00', dur: 365, features: ['Gym access', 'Locker', '10% shop discount'], pt: 0, sort: 4 },
    { name: 'Annual Gold', price: '60000.00', dur: 365, features: ['Full access', 'PT 4x/month', 'Towel', 'Guest pass 2x/month'], pt: 4, sort: 5 },
    { name: 'Student Monthly', price: '2500.00', dur: 30, features: ['Gym access', 'Locker'], pt: 0, sort: 6, doc: 'student_id' },
  ];
  const planIds: string[] = [];
  for (const p of planDefs) {
    const id = randomUUID();
    planIds.push(id);
    await db.insert(subscriptionPlans).values({
      id,
      name: p.name,
      price: p.price,
      durationDays: p.dur,
      features: p.features,
      includedPtSessions: p.pt,
      maxMembers: 1,
      sortOrder: p.sort,
      requiresDocument: (p as any).doc ?? null,
      isActive: true,
    });
  }

  // ═══════════════════════════════════════════════════
  // 4. Admin
  // ═══════════════════════════════════════════════════
  console.log('👤 Creating admin user...');
  const adminUserId = randomUUID();
  const adminQrSecret = generateUserSecret();
  await db.insert(users).values({
    id: adminUserId,
    email: 'admin@powerworld.lk',
    passwordHash: hashedPassword,
    fullName: 'Kamal Jayawardena',
    phone: '+94771234567',
    role: 'admin',
    gender: 'male',
    isActive: true,
    isEmailVerified: true,
    qrCodeSecret: adminQrSecret,
  });
  await db.insert(staff).values({
    id: randomUUID(),
    userId: adminUserId,
    branchId,
    employeeCode: 'ADMIN001',
    designation: 'System Administrator',
    status: 'active',
    hireDate: new Date('2023-01-01'),
    isKeyHolder: true,
  });

  // ═══════════════════════════════════════════════════
  // 5. Manager
  // ═══════════════════════════════════════════════════
  console.log('👤 Creating manager...');
  const managerUserId = randomUUID();
  const managerQrSecret = generateUserSecret();
  await db.insert(users).values({
    id: managerUserId,
    email: 'manager@powerworld.lk',
    passwordHash: hashedPassword,
    fullName: 'Nirmala Perera',
    phone: '+94771234568',
    role: 'manager',
    gender: 'female',
    isActive: true,
    isEmailVerified: true,
    qrCodeSecret: managerQrSecret,
  });
  const managerId = randomUUID();
  await db.insert(staff).values({
    id: managerId,
    userId: managerUserId,
    branchId,
    employeeCode: 'MGR001',
    designation: 'Branch Manager',
    status: 'active',
    hireDate: new Date('2023-01-15'),
    baseSalary: '85000.00',
    isKeyHolder: true,
  });

  // ═══════════════════════════════════════════════════
  // 6. Staff
  // ═══════════════════════════════════════════════════
  console.log('👥 Creating staff members...');
  const staffDesignations = ['Receptionist', 'Receptionist', 'Floor Supervisor', 'Maintenance', 'Cleaning Staff', 'Security'];
  for (let i = 0; i < STAFF_COUNT; i++) {
    const userId = randomUUID();
    const qrSecret = generateUserSecret();
    const name = `${firstNames[(i + 7) % firstNames.length]} ${lastNames[(i + 4) % lastNames.length]}`;
    await db.insert(users).values({
      id: userId,
      email: `staff${i + 1}@powerworld.lk`,
      passwordHash: hashedPassword,
      fullName: name,
      phone: `+9477${1000000 + i}`,
      role: 'staff',
      gender: randomElement(genders),
      isActive: true,
      isEmailVerified: true,
      qrCodeSecret: qrSecret,
    });
    await db.insert(staff).values({
      id: randomUUID(),
      userId,
      branchId,
      employeeCode: `EMP${String(i + 2).padStart(3, '0')}`,
      designation: staffDesignations[i % staffDesignations.length],
      status: 'active',
      hireDate: randomDate(new Date('2023-03-01'), new Date('2024-06-01')),
      baseSalary: `${randomInt(30000, 55000)}.00`,
    });
  }

  // ═══════════════════════════════════════════════════
  // 7. Trainers (each gets both users+trainers rows; some also get staff row)
  // ═══════════════════════════════════════════════════
  console.log('🏋️ Creating trainers...');
  const trainerUserIds: string[] = [];
  const trainerSpecializations = ['Weight Training', 'Cardio & HIIT', 'Yoga & Flexibility', 'CrossFit'];
  for (let i = 0; i < TRAINER_COUNT; i++) {
    const userId = randomUUID();
    trainerUserIds.push(userId);
    const qrSecret = generateUserSecret();
    const name = `${firstNames[(i + 12) % firstNames.length]} ${lastNames[(i + 6) % lastNames.length]}`;
    await db.insert(users).values({
      id: userId,
      email: `trainer${i + 1}@powerworld.lk`,
      passwordHash: hashedPassword,
      fullName: name,
      phone: `+9477${2000000 + i}`,
      role: 'trainer',
      gender: i < 2 ? 'male' : 'female',
      isActive: true,
      isEmailVerified: true,
      qrCodeSecret: qrSecret,
    });
    // Optional staff record
    let staffId: string | undefined;
    if (i < 2) {
      staffId = randomUUID();
      await db.insert(staff).values({
        id: staffId,
        userId,
        branchId,
        employeeCode: `TRN${String(i + 1).padStart(3, '0')}`,
        designation: 'Personal Trainer',
        status: 'active',
        hireDate: randomDate(new Date('2023-02-01'), new Date('2024-03-01')),
        baseSalary: `${randomInt(40000, 65000)}.00`,
      });
    }
    await db.insert(trainers).values({
      id: randomUUID(),
      userId,
      staffId: staffId ?? null,
      specialization: trainerSpecializations[i],
      bio: `Expert ${trainerSpecializations[i].toLowerCase()} trainer with ${3 + i} years experience at PowerWorld.`,
      certifications: [{ name: 'NASM CPT', issuingBody: 'NASM', year: 2022 - i }],
      yearsOfExperience: 3 + i,
      hourlyRate: `${1000 + i * 250}.00`,
      rating: `${(4.3 + Math.random() * 0.7).toFixed(2)}`,
      maxClients: 15 + i * 5,
      branchId,
      status: 'active',
    });
  }

  // ═══════════════════════════════════════════════════
  // 8. Members with Subscriptions & Payments
  // ═══════════════════════════════════════════════════
  console.log('🧑‍🤝‍🧑 Creating members...');
  const memberUserIds: string[] = [];
  const memberIds: string[] = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (let i = 0; i < MEMBER_COUNT; i++) {
    const userId = randomUUID();
    const memberId = randomUUID();
    memberUserIds.push(userId);
    memberIds.push(memberId);

    const qrSecret = generateUserSecret();
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i + 2) % lastNames.length]}`;
    const joinDate = randomDate(sixMonthsAgo, new Date());
    const isActive = i < 40;
    const memberStatus = isActive ? 'active' : randomElement(['inactive', 'suspended', 'incomplete'] as const);

    await db.insert(users).values({
      id: userId,
      email: `member${i + 1}@example.com`,
      passwordHash: hashedPassword,
      fullName: name,
      phone: `+9477${3000000 + i}`,
      role: 'member',
      gender: randomElement(genders),
      dateOfBirth: randomDate(new Date('1980-01-01'), new Date('2005-01-01')),
      isActive,
      isEmailVerified: isActive,
      qrCodeSecret: qrSecret,
    });

    await db.insert(members).values({
      id: memberId,
      userId,
      memberCode: `MBR${String(i + 1).padStart(4, '0')}`,
      nicNumber: i < 30 ? `${randomInt(700000000, 999999999)}V` : null,
      homeBranchId: branchId,
      joinDate,
      experienceLevel: randomElement(['beginner', 'intermediate', 'advanced', 'returning'] as const),
      fitnessGoals: randomElement([['weight_loss'], ['muscle_gain'], ['general_fitness'], ['strength', 'endurance']]),
      assignedTrainerId: isActive && i % 5 === 0 ? trainerUserIds[i % trainerUserIds.length] : null,
      isOnboarded: isActive,
      onboardedAt: isActive ? joinDate : null,
      status: memberStatus,
    });

    // Subscription for active members
    if (isActive) {
      const planIdx = i % (planIds.length - 1) + 1; // skip day pass for regulars
      const planId = planIds[planIdx];
      const subId = randomUUID();
      const startDate = new Date(joinDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDefs[planIdx].dur);

      const subStatus = endDate > new Date() ? 'active' : 'expired';

      await db.insert(subscriptions).values({
        id: subId,
        memberId,
        planId,
        startDate,
        endDate,
        status: subStatus,
        pricePaid: planDefs[planIdx].price,
        ptSessionsRemaining: planDefs[planIdx].pt,
        autoRenew: Math.random() > 0.5,
      });

      // Payment record
      await db.insert(payments).values({
        id: randomUUID(),
        memberId,
        subscriptionId: subId,
        amount: planDefs[planIdx].price,
        paymentMethod: randomElement(['cash', 'card', 'bank_transfer', 'online'] as const),
        paymentDate: startDate,
        status: 'completed',
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // 9. Visit Sessions & Access Logs (6 months history)
  // ═══════════════════════════════════════════════════
  console.log('📊 Creating visit sessions & access logs...');
  const today = new Date();
  let sessionCount = 0;
  let logCount = 0;

  for (let dayOffset = 0; dayOffset < 180; dayOffset++) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - dayOffset);

    // Skip some days for variety
    if (Math.random() < 0.08) continue;

    const entriesPerDay = randomInt(8, 35);

    for (let j = 0; j < entriesPerDay && sessionCount < 2500; j++) {
      const userIdx = Math.floor(Math.random() * memberUserIds.length);
      const userId = memberUserIds[userIdx];
      const memberId = memberIds[userIdx];

      const checkInHour = randomInt(5, 21);
      const checkInMin = randomInt(0, 59);
      const checkIn = new Date(logDate);
      checkIn.setHours(checkInHour, checkInMin, 0, 0);

      const durationMin = randomInt(30, 120);
      const checkOut = new Date(checkIn.getTime() + durationMin * 60_000);

      // Visit session
      const sessionId = randomUUID();
      if (dayOffset > 0) { // historical — completed sessions
        await db.insert(visitSessions).values({
          id: sessionId,
          userId,
          branchId,
          checkInAt: checkIn,
          checkOutAt: checkOut,
          durationMinutes: durationMin,
          status: 'completed',
          visitType: 'member_visit',
          isAutoCloseProcessed: false,
        });
        sessionCount++;

        // Check-in log
        await db.insert(accessLogs).values({
          id: randomUUID(),
          userId,
          gateId: mainGateId,
          sessionId,
          scannedAt: checkIn,
          direction: 'in',
          isAuthorized: true,
          isSynthetic: false,
        });
        // Check-out log
        await db.insert(accessLogs).values({
          id: randomUUID(),
          userId,
          gateId: mainGateId,
          sessionId,
          scannedAt: checkOut,
          direction: 'out',
          isAuthorized: true,
          isSynthetic: false,
        });
        logCount += 2;
      }
    }
  }
  console.log(`   → ${sessionCount} visit sessions, ${logCount} access logs`);

  // ═══════════════════════════════════════════════════
  // 10. Equipment
  // ═══════════════════════════════════════════════════
  console.log('🏗️  Creating equipment...');
  const equipmentList: { name: string; cat: 'cardio' | 'strength_machine' | 'free_weight' | 'bench' | 'accessory'; zone: string }[] = [
    { name: 'Treadmill #1', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Treadmill #2', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Treadmill #3', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Elliptical #1', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Elliptical #2', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Rowing Machine', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Stationary Bike #1', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Stationary Bike #2', cat: 'cardio', zone: 'Cardio Zone' },
    { name: 'Bench Press Station', cat: 'bench', zone: 'Main Floor' },
    { name: 'Incline Bench', cat: 'bench', zone: 'Main Floor' },
    { name: 'Decline Bench', cat: 'bench', zone: 'Main Floor' },
    { name: 'Squat Rack #1', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Squat Rack #2', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Leg Press', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Cable Machine (Dual)', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Smith Machine', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Lat Pulldown', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Chest Fly Machine', cat: 'strength_machine', zone: 'Main Floor' },
    { name: 'Dumbbells Set (2-50kg)', cat: 'free_weight', zone: 'Main Floor' },
    { name: 'Barbells Set', cat: 'free_weight', zone: 'Main Floor' },
    { name: 'Kettlebells Set', cat: 'free_weight', zone: 'Main Floor' },
    { name: 'Resistance Bands Set', cat: 'accessory', zone: 'Main Floor' },
    { name: 'Yoga Mats (x20)', cat: 'accessory', zone: 'Main Floor' },
    { name: 'Foam Rollers (x10)', cat: 'accessory', zone: 'Main Floor' },
  ];

  for (const eq of equipmentList) {
    const status = Math.random() > 0.9 ? 'needs_maintenance' : 'operational';
    await db.insert(equipment).values({
      id: randomUUID(),
      branchId,
      name: eq.name,
      category: eq.cat,
      purchaseDate: randomDate(new Date('2022-01-01'), new Date('2024-06-01')),
      purchasePrice: `${randomInt(50000, 500000)}.00`,
      status,
      locationZone: eq.zone,
      maintenanceIntervalDays: 90,
      lastMaintenanceDate: randomDate(new Date('2024-01-01'), new Date()),
    });
  }

  // ═══════════════════════════════════════════════════
  // Done!
  // ═══════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Seed complete!');
  console.log('═'.repeat(50));
  console.log('\n📋 Test Accounts (all passwords: admin123)\n');
  console.log('  Role      │ Email                      │ QR');
  console.log('  ──────────┼────────────────────────────┼─────');
  console.log('  Admin     │ admin@powerworld.lk        │ ✓');
  console.log('  Manager   │ manager@powerworld.lk      │ ✓');
  console.log('  Staff     │ staff1@powerworld.lk       │ ✓');
  console.log('  Trainer   │ trainer1@powerworld.lk     │ ✓');
  console.log('  Member    │ member1@example.com        │ ✓');
  console.log('\n📊 Seeded data:');
  console.log(`  • 1 branch (PowerWorld Kiribathgoda)`);
  console.log(`  • ${planDefs.length} subscription plans`);
  console.log(`  • ${MEMBER_COUNT} members (${memberUserIds.length} with QR secrets)`);
  console.log(`  • ${STAFF_COUNT} staff + 1 admin + 1 manager`);
  console.log(`  • ${TRAINER_COUNT} trainers`);
  console.log(`  • ${equipmentList.length} equipment items`);
  console.log(`  • ~${sessionCount} visit sessions, ~${logCount} access logs`);
  console.log(`  • 2 zones, 2 gates`);
  console.log('');

  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
