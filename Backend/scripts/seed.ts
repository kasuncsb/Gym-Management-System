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
import { users, memberProfiles, config } from '../src/db/schema.js';
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
    { key: 'branch_name', value: 'Power World Gyms Kiribathgoda' },
    { key: 'branch_code', value: 'PWG-KBG' },
    { key: 'address', value: 'Kiribathgoda, Gampaha, Sri Lanka' },
    { key: 'phone', value: '+94112345678' },
    { key: 'email', value: 'kbg@powerworldgyms.lk' },
    { key: 'open_time', value: '05:00:00' },
    { key: 'close_time', value: '22:00:00' },
    { key: 'capacity', value: '120' },
    { key: 'grace_days', value: '3' },
    { key: 'timezone', value: 'Asia/Colombo' },
    { key: 'facility_type', value: 'non_ac' },
  ];
  for (const c of configData) {
    await db.insert(config).values(c).onDuplicateKeyUpdate({ set: { value: c.value } });
  }
  console.log('✅ Config seeded');

  // Remove existing seed users (by email)
  await db.delete(users).where(inArray(users.email, SEED_EMAILS));
  console.log('🗑️  Removed existing seed users');

  // Insert 4 users with fixed password
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
        referralSource: 'website',
        isOnboarded: true,
        onboardedAt: new Date(),
      });
    }
  }

  console.log('✅ 4 users created (admin, manager, trainer, member)\n');
  console.log('📋 Login credentials (password for all):', SEED_PASSWORD);
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
