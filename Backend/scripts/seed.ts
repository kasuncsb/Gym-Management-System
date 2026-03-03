/**
 * Database seed script - creates initial admin user
 * Run with: npm run db:seed
 */

import { db } from '../src/config/database.js';
import { users, config } from '../src/db/schema.js';
import { ids } from '../src/utils/id.js';
import { hashPassword } from '../src/utils/password.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed config
  const configData = [
    { key: 'branch_name', value: 'Power World Gyms Kiribathgoda' },
    { key: 'branch_code', value: 'PWG-KBG' },
    { key: 'address', value: 'Kiribathgoda, Gampaha, Sri Lanka' },
    { key: 'phone', value: '+94112345678' },
    { key: 'email', value: 'kbg@powerworldgyms.lk' },
    { key: 'open_time', value: '05:00:00' },
    { key: 'close_time', value: '22:00:00' },
  ];

  for (const c of configData) {
    await db.insert(config).values(c).onDuplicateKeyUpdate({ set: { value: c.value } });
  }
  console.log('✅ Config seeded');

  // Create admin user
  const adminId = ids.uuid();
  const adminPassword = await hashPassword('Admin123!');

  await db.insert(users).values({
    id: adminId,
    email: 'admin@powerworldgyms.lk',
    passwordHash: adminPassword,
    fullName: 'System Admin',
    role: 'admin',
    employeeCode: 'EMP-ADMIN',
    isActive: true,
  }).onDuplicateKeyUpdate({ set: { fullName: 'System Admin' } });

  console.log('✅ Admin user created');
  console.log('   Email: admin@powerworldgyms.lk');
  console.log('   Password: Admin123!');

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
