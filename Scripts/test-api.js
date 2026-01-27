
const path = require('path');
const dotenvPath = path.resolve(__dirname, '../Backend/node_modules/dotenv');
require(dotenvPath).config({ path: path.join(__dirname, '../Backend/.env') });

const { db } = require('../Backend/dist/config/database');
const { users, staff } = require('../Backend/dist/db/schema');
const { eq } = require(path.resolve(__dirname, '../Backend/node_modules/drizzle-orm'));
const bcrypt = require(path.resolve(__dirname, '../Backend/node_modules/bcryptjs'));
const { randomUUID } = require('crypto');

const API_BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = `test.admin.${Date.now()}@powerworld.lk`;
const ADMIN_PASSWORD = 'Password@123';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    bold: '\x1b[1m'
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

async function createAdminUser() {
    log(`\nCreating temporary Admin user: ${ADMIN_EMAIL}...`, colors.cyan);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const userId = randomUUID();
    const staffId = randomUUID();

    try {
        await db.insert(users).values({
            id: userId,
            email: ADMIN_EMAIL,
            passwordHash: hashedPassword,
            role: 'admin',
            fullName: 'Test Admin Automation',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Also insert into staff table as required by auth service
        await db.insert(staff).values({
            id: staffId,
            userId: userId,
            employeeCode: `ADM-${Date.now().toString().slice(-6)}`,
            designation: 'System Admin',
            hireDate: new Date(),
            status: 'active'
        });

        log('✅ Admin user created successfully in database (users + staff).', colors.green);
        return userId;
    } catch (error) {
        log(`❌ Failed to create admin user: ${error.message}`, colors.red);
        process.exit(1);
    }
}

async function authenticateAdmin() {
    log('\nAuthenticating as new Admin...', colors.cyan);

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                userType: 'staff' // Admins login via staff portal usually
            })
        });

        const data = await response.json();

        if (data.success) {
            log('✅ Authentication successful.', colors.green);
            return data.data.token || data.data.accessToken;
        } else {
            throw new Error(data.error?.message || 'Login failed');
        }
    } catch (error) {
        log(`❌ Authentication failed: ${error.message}`, colors.red);
        process.exit(1);
    }
}

async function testEndpoint(name, url, token, method = 'GET', body = null) {
    process.stdout.write(`Testing ${name} (${method} ${url})... `);

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${url}`, options);
        const data = await response.json();

        if (response.ok && data.success !== false) {
            console.log(`${colors.green}PASSED${colors.reset}`);
            return true;
        } else {
            console.log(`${colors.red}FAILED${colors.reset}`);
            console.log(`   Error: ${data.error?.message || response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red}ERROR${colors.reset}`);
        console.log(`   Exception: ${error.message}`);
        return false;
    }
}

async function main() {
    log(colors.bold + '🚀 Starting Full System API Test' + colors.reset);

    // 1. Create Admin
    const adminId = await createAdminUser();

    // 2. Login
    const token = await authenticateAdmin();

    // 3. Test Endpoints
    log('\nRunning API Endpoint Tests:', colors.cyan);

    // Auth & Profile
    await testEndpoint('Get Profile', '/api/auth/profile', token);

    // Members
    await testEndpoint('List Members', '/api/members', token);
    await testEndpoint('Member Stats', '/api/members/stats', token);

    // Inventory
    await testEndpoint('List Products', '/api/inventory/products', token);
    await testEndpoint('List Equipment', '/api/equipment', token);

    // Leads
    await testEndpoint('List Leads', '/api/leads', token);
    await testEndpoint('Create Lead', '/api/leads', token, 'POST', {
        name: 'Auto Test Lead',
        email: `auto.lead.${Date.now()}@test.com`,
        phone: '0771234567',
        source: 'WEBSITE',
        status: 'NEW'
    });

    // Subscriptions (Public)
    await testEndpoint('List Subscription Plans', '/api/subscriptions/plans', token);

    // Cleanup (Optional - currently just leaving user for debug if needed)
    log(`\nTest user ${ADMIN_EMAIL} left in database for manual verification if needed.`, colors.yellow);
    log('\n✨ Test Suite Completed', colors.bold + colors.green);
    process.exit(0);
}

main().catch(console.error);
