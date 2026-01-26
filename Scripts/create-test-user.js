
const bcrypt = require('bcryptjs');
const { db } = require('../Backend/dist/config/database');
const { users, staff } = require('../Backend/dist/db/schema');
const { eq } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
    console.log('Creating test user...');

    // 1. Create User
    const rawPassword = 'TestPassword@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const userId = uuidv4();
    const staffId = uuidv4();
    const email = `test.admin.${Date.now()}@powerworld.lk`;

    try {
        await db.insert(users).values({
            id: userId,
            email: email,
            passwordHash: hashedPassword,
            role: 'admin',
            fullName: 'Test Admin User',
            isActive: true
        });

        // 2. Create Staff entry (required for login)
        await db.insert(staff).values({
            id: staffId,
            userId: userId,
            employeeCode: `TEST-${Date.now()}`,
            designation: 'System Tester',
            hireDate: new Date(),
            status: 'active'
        });

        console.log('\n✅ Test user created successfully!');
        console.log('------------------------------------------------');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${rawPassword}`);
        console.log('------------------------------------------------\n');

        console.log('You can now update Scripts/test-db-connection.js with these credentials to run the test.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to create user:', err);
        process.exit(1);
    }
}

createTestUser();
