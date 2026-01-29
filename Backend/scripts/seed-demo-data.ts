// Seed Demo Data Script
// Run with: npm run seed:demo

import { db } from '../src/config/database';
import {
    users, members, staff, trainers, branches,
    subscriptionPlans, subscriptions, payments,
    accessLogs, equipment, memberDocuments, zones, gates
} from '../src/db/schema';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

const MEMBER_COUNT = 50;
const STAFF_COUNT = 8;
const TRAINER_COUNT = 4;

// Helper to generate random date in range
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to generate random amount
function randomAmount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNames = ['Kasun', 'Nuwan', 'Amara', 'Dilini', 'Chamara', 'Nethmi', 'Tharindu', 'Sanduni', 'Ravindu', 'Hasini', 'Priya', 'Saman', 'Kumari', 'Roshan', 'Malini'];
const lastNames = ['Perera', 'Fernando', 'Silva', 'Jayasuriya', 'Bandara', 'Wickramasinghe', 'Gunawardena', 'Rajapaksa', 'Dissanayake', 'Senanayake'];

// Cleanup existing data (in reverse order of dependencies)
async function cleanupData() {
    console.log('INFO:   Cleaning up existing data...\n');

    try {
        // Delete in order respecting foreign keys (children first)
        await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

        await db.delete(accessLogs);
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
        console.error('WARN:   Cleanup warning:', error);
        console.log('INFO:   Continuing with seed...\n');
    }
}

async function seedData() {
    console.log('INFO:   Starting seed...\n');

    // Clean up existing data first
    await cleanupData();

    // 1. Create Branch
    console.log('INFO:   Creating branch...');
    const branchId = nanoid();
    await db.insert(branches).values({
        id: branchId,
        name: 'PowerWorld Colombo',
        code: 'PWC01',
        address: '123 Galle Road, Colombo 03',
        phone: '+94112345678',
        email: 'colombo@powerworld.lk',
        isActive: true,
    });

    // 1.1 Create Gate
    console.log('INFO:   Creating gate...');
    const zoneId = nanoid();
    await db.insert(zones).values({
        id: zoneId,
        branchId,
        name: 'Main Entrance',
        capacity: 100,
    });

    await db.insert(gates).values({
        id: 'GATE01',
        zoneId,
        name: 'Main Turnstile',
        deviceId: 'DEV-001',
        status: 'active',
    });

    // 2. Create Subscription Plans
    console.log('INFO:   Creating subscription plans...');
    const plans = [
        { name: 'Basic Monthly', price: '3500.00', duration: 30, features: ['Gym access', 'Locker'] },
        { name: 'Premium Monthly', price: '6000.00', duration: 30, features: ['Gym access', 'Classes', 'Locker', 'Towel'] },
        { name: 'Annual Basic', price: '35000.00', duration: 365, features: ['Gym access', 'Locker'] },
        { name: 'Annual Premium', price: '60000.00', duration: 365, features: ['All access', 'Personal trainer 2x/month'] },
    ];
    const memberIds: string[] = [];
    const memberUserIds: string[] = [];
    const planIds: string[] = [];
    for (const plan of plans) {
        const id = nanoid();
        planIds.push(id);
        await db.insert(subscriptionPlans).values({
            id,
            name: plan.name,
            price: plan.price,
            durationDays: plan.duration,
            features: plan.features,
            isActive: true,
        } as any);
    }

    // 3. Create Admin User
    console.log('INFO:   Creating admin user...');
    const adminUserId = nanoid();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
        id: adminUserId,
        email: 'admin@powerworld.lk',
        passwordHash: hashedPassword,
        fullName: 'System Admin',
        phone: '+94771234567',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
    });
    await db.insert(staff).values({
        id: nanoid(),
        userId: adminUserId,
        branchId, // Affiliaite with the same branch for now
        employeeCode: 'ADMIN001',
        designation: 'System Administrator',
        status: 'active',
        hireDate: new Date('2023-01-01'),
    });

    // 4. Create Manager
    console.log('INFO:   Creating manager...');
    const managerUserId = nanoid();
    await db.insert(users).values({
        id: managerUserId,
        email: 'manager@powerworld.lk',
        passwordHash: hashedPassword,
        fullName: 'Branch Manager',
        phone: '+94771234568',
        role: 'manager',
        isActive: true,
        isEmailVerified: true,
    });
    const managerId = nanoid();
    await db.insert(staff).values({
        id: managerId,
        userId: managerUserId,
        branchId,
        employeeCode: 'EMP001',
        designation: 'Branch Manager',
        status: 'active',
        hireDate: new Date('2023-01-15'),
    });

    // 5. Create Staff Members
    console.log('INFO:   Creating staff members...');
    for (let i = 0; i < STAFF_COUNT; i++) {
        const userId = nanoid();
        const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
        await db.insert(users).values({
            id: userId,
            email: `staff${i + 1}@powerworld.lk`,
            passwordHash: hashedPassword,
            fullName: name,
            phone: `+9477${1000000 + i}`,
            role: 'staff',
            isActive: true,
            isEmailVerified: true,
        });
        await db.insert(staff).values({
            id: nanoid(),
            userId,
            branchId,
            employeeCode: `EMP${String(i + 2).padStart(3, '0')}`,
            designation: ['Receptionist', 'Trainer Assistant', 'Maintenance'][i % 3],
            status: 'active',
            hireDate: randomDate(new Date('2023-01-01'), new Date('2024-06-01')),
        });
    }

    // 6. Create Trainers
    console.log('INFO:   Creating trainers...');
    for (let i = 0; i < TRAINER_COUNT; i++) {
        const userId = nanoid();
        const name = `${firstNames[(i + 5) % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}`;
        await db.insert(users).values({
            id: userId,
            email: `trainer${i + 1}@powerworld.lk`,
            passwordHash: hashedPassword,
            fullName: name,
            phone: `+9477${2000000 + i}`,
            role: 'trainer',
            isActive: true,
            isEmailVerified: true,
        });
        await db.insert(trainers).values({
            id: nanoid(),
            userId,
            branchId,
            specialization: ['Weight Training', 'Cardio', 'Yoga', 'CrossFit'][i],
            hourlyRate: (1000 + i * 200).toString(), // Decimal as string or number
            rating: (4.5 + Math.random() * 0.5).toFixed(1),
        });
    }

    // 7. Create Members with Subscriptions
    console.log('INFO:   Creating members with subscriptions...');
    // memberIds and memberUserIds declared at top
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (let i = 0; i < MEMBER_COUNT; i++) {
        const userId = nanoid();
        const memberId = nanoid();
        memberIds.push(memberId);
        memberUserIds.push(userId);

        const name = `${firstNames[i % firstNames.length]} ${lastNames[(i + 2) % lastNames.length]}`;
        const joinDate = randomDate(sixMonthsAgo, new Date());
        const status = i < 45 ? 'active' : ['pending', 'suspended', 'active', 'inactive'][i % 4];

        await db.insert(users).values({
            id: userId,
            email: `member${i + 1}@example.com`,
            passwordHash: hashedPassword,
            fullName: name,
            phone: `+9477${3000000 + i}`,
            role: 'member',
            isActive: status === 'active',
            isEmailVerified: status === 'active',
        });

        await db.insert(members).values({
            id: memberId,
            userId,
            memberCode: `MBR${String(i + 1).padStart(4, '0')}`,
            dateOfBirth: randomDate(new Date('1980-01-01'), new Date('2005-01-01')),
            joinDate,
            status: status as any,
        });

        // Create subscription for active members
        if (status === 'active') {
            const planId = planIds[i % planIds.length];
            const subId = nanoid();
            const startDate = new Date(joinDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plans[i % plans.length].duration);

            await db.insert(subscriptions).values({
                id: subId,
                memberId,
                planId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                status: 'active',
                autoRenew: Math.random() > 0.5,
            } as any);

            // Create payment record
            await db.insert(payments).values({
                id: nanoid(),
                userId, // Use userId, not memberId
                // subscriptionId removed as it's not in schema
                amount: plans[i % plans.length].price, // Already string
                paymentDate: startDate,
                status: 'success',
                method: ['cash', 'card', 'transfer'][i % 3] as any, // Cast to any or matching enum
            });
        }
    }

    // 8. Create Access Logs (6 months history)
    console.log('INFO:   Creating access log history...');
    const today = new Date();
    let logCount = 0;

    for (let dayOffset = 0; dayOffset < 180; dayOffset++) {
        const logDate = new Date(today);
        logDate.setDate(logDate.getDate() - dayOffset);

        // Skip some days randomly for variety
        if (Math.random() < 0.1) continue;

        // 5-30 entries per day
        const entriesPerDay = randomAmount(5, 30);

        for (let j = 0; j < entriesPerDay && logCount < 2000; j++) {
            const userId = memberUserIds[Math.floor(Math.random() * memberUserIds.length)];
            const hour = randomAmount(6, 22);
            const minute = randomAmount(0, 59);
            const timestamp = new Date(logDate);
            timestamp.setHours(hour, minute, 0, 0);

            await db.insert(accessLogs).values({
                id: nanoid(),
                userId,
                gateId: 'GATE01',
                direction: Math.random() > 0.5 ? 'in' : 'out',
                isAuthorized: Math.random() > 0.05,
                denyReason: null,
                timestamp,
            });
            logCount++;
        }
    }
    console.log(`   Created ${logCount} access log entries`);

    // 9. Create Equipment
    console.log('INFO:   Creating equipment...');
    const equipmentList = [
        { name: 'Treadmill 1', type: 'cardio' },
        { name: 'Treadmill 2', type: 'cardio' },
        { name: 'Treadmill 3', type: 'cardio' },
        { name: 'Elliptical 1', type: 'cardio' },
        { name: 'Elliptical 2', type: 'cardio' },
        { name: 'Bench Press', type: 'strength' },
        { name: 'Squat Rack', type: 'strength' },
        { name: 'Leg Press', type: 'strength' },
        { name: 'Cable Machine', type: 'strength' },
        { name: 'Dumbbells Set', type: 'free_weights' },
        { name: 'Barbells Set', type: 'free_weights' },
        { name: 'Rowing Machine', type: 'cardio' },
    ];

    for (let i = 0; i < equipmentList.length; i++) {
        const eq = equipmentList[i];
        await db.insert(equipment).values({
            id: nanoid(),
            branchId,
            name: eq.name,
            type: eq.type,
            purchaseDate: randomDate(new Date('2022-01-01'), new Date('2024-01-01')),
            status: i < 10 ? 'operational' : 'maintenance',
        });
    }

    console.log('\nINFO:   Seed complete!');
    console.log('\nINFO:   Test Accounts:');
    console.log('INFO:      Admin: admin@powerworld.lk / admin123');
    console.log('INFO:      Manager: manager@powerworld.lk / admin123');
    console.log('INFO:      Staff: staff1@powerworld.lk / admin123');
    console.log('INFO:      Member: member1@example.com / admin123');

    process.exit(0);
}

seedData().catch(err => {
    console.error('ERROR:  Seed failed:', err);
    process.exit(1);
});
