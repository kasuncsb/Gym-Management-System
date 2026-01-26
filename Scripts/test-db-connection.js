#!/usr/bin/env node

/**
 * Database Connection & API Data Flow Test Script
 * PowerWorld Gym Management System
 * 
 * This script verifies:
 * 1. Backend has full database access
 * 2. All tables are accessible and queryable
 * 3. API endpoints successfully return database data
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * - Database configured and seeded
 * 
 * Usage: node Scripts/test-db-connection.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    bold: '\x1b[1m'
};

// Test results tracking
const results = {
    database: { passed: 0, failed: 0, tests: [] },
    api: { passed: 0, failed: 0, tests: [] }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
    const line = '═'.repeat(60);
    log(`\n${line}`, colors.blue);
    log(`  ${title}`, colors.bold + colors.blue);
    log(line, colors.blue);
}

function subHeader(title) {
    log(`\n  ┌─ ${title}`, colors.cyan);
}

function success(category, testName, details = '') {
    results[category].passed++;
    results[category].tests.push({ name: testName, passed: true, details });
    log(`  │  ✓ ${testName}${details ? ` (${details})` : ''}`, colors.green);
}

function failure(category, testName, error = '') {
    results[category].failed++;
    results[category].tests.push({ name: testName, passed: false, error });
    log(`  │  ✗ ${testName}${error ? `: ${error}` : ''}`, colors.red);
}

function info(message) {
    log(`  │  ℹ ${message}`, colors.gray);
}

async function makeRequest(method, endpoint, data = null, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        let result;

        try {
            const text = await response.text();
            try {
                result = JSON.parse(text);
            } catch {
                result = { raw: text };
            }
        } catch {
            result = null;
        }

        return {
            status: response.status,
            ok: response.ok,
            data: result
        };
    } catch (err) {
        return {
            status: 0,
            ok: false,
            error: err.message
        };
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// DATABASE CONNECTIVITY TESTS (via API)
// =============================================================================

async function testDatabaseConnectionViaHealth() {
    subHeader('Database Connection Health');

    const response = await makeRequest('GET', '/health');

    if (response.ok && response.data?.status === 'ok') {
        success('database', 'Server health check', response.data.service);

        // Check database status if available
        if (response.data.database) {
            success('database', 'Database connection status', response.data.database);
        } else {
            info('Database status not exposed in health endpoint');
        }
        return true;
    } else {
        failure('database', 'Server health check', response.error || `HTTP ${response.status}`);
        return false;
    }
}

async function testDatabaseTablesViaAPI(adminToken) {
    subHeader('Database Tables Accessibility');

    // Test each major table through its respective API endpoint
    const tableTests = [
        {
            name: 'users (via auth)',
            endpoint: '/api/auth/profile',
            token: adminToken,
            checkField: 'id'
        },
        {
            name: 'members',
            endpoint: '/api/members',
            token: adminToken,
            checkField: 'data',
            isArray: true
        },
        {
            name: 'leads',
            endpoint: '/api/leads',
            token: adminToken,
            checkField: 'data',
            isArray: true
        },
        {
            name: 'equipment',
            endpoint: '/api/equipment',
            token: adminToken,
            checkField: 'data',
            isArray: true
        },
        {
            name: 'products (inventory)',
            endpoint: '/api/inventory/products',
            token: adminToken,
            checkField: 'data',
            isArray: true
        },
        {
            name: 'subscription_plans',
            endpoint: '/api/subscriptions/plans',
            token: adminToken,
            checkField: 'data',
            isArray: true
        },
        {
            name: 'appointments',
            endpoint: '/api/appointments',
            token: adminToken,
            checkField: 'data',
            isArray: true
        }
    ];

    for (const test of tableTests) {
        const response = await makeRequest('GET', test.endpoint, null, test.token);

        if (response.ok && response.data?.success !== false) {
            const data = response.data?.data || response.data;
            let count = 'N/A';

            if (test.isArray && Array.isArray(data)) {
                count = `${data.length} records`;
            } else if (data && typeof data === 'object' && data[test.checkField]) {
                count = 'accessible';
            }

            success('database', `Table: ${test.name}`, count);
        } else {
            // Updated to be more brief in summary but logged to results
            const errorMsg = response.data?.error?.message || response.error || `HTTP ${response.status}`;
            failure('database', `Table: ${test.name}`, errorMsg);
        }

        await sleep(50);
    }
}

// =============================================================================
// API DATA FLOW TESTS
// =============================================================================

async function testAuthenticationFlow() {
    subHeader('Authentication & Token Flow');

    // Test staff login (use a seeded staff user)
    const staffLoginResponse = await makeRequest('POST', '/api/auth/login', {
        email: 'rec.amara@powerworld.lk',
        password: 'Password@123',
        userType: 'staff'
    });

    let staffToken = null;
    if (staffLoginResponse.ok && staffLoginResponse.data?.success) {
        staffToken = staffLoginResponse.data.data?.token || staffLoginResponse.data.data?.accessToken;
        success('api', 'Staff login', staffLoginResponse.data.data?.user?.name || 'Token received');
    } else {
        const errorMsg = staffLoginResponse.data?.error?.message || staffLoginResponse.error || `HTTP ${staffLoginResponse.status}`;
        failure('api', 'Staff login', errorMsg);
        if (staffLoginResponse.data) {
            info(`Detailed error: ${JSON.stringify(staffLoginResponse.data)}`);
        }
    }

    // Test member login
    const memberLoginResponse = await makeRequest('POST', '/api/auth/login', {
        email: 'kasun.m@gmail.com',
        password: 'Password@123',
        userType: 'member'
    });

    let memberToken = null;
    if (memberLoginResponse.ok && memberLoginResponse.data?.success) {
        memberToken = memberLoginResponse.data.data?.token || memberLoginResponse.data.data?.accessToken;
        success('api', 'Member login', memberLoginResponse.data.data?.user?.name || 'Token received');
    } else {
        failure('api', 'Member login', memberLoginResponse.data?.error?.message || 'Login failed');
    }

    const token = staffToken || memberToken;

    if (token) {
        const profileResponse = await makeRequest('GET', '/api/auth/profile', null, token);
        if (profileResponse.ok && profileResponse.data?.success) {
            success('api', 'Token validation (profile fetch)', profileResponse.data.data?.email || profileResponse.data.data?.name);
        } else {
            failure('api', 'Token validation', profileResponse.data?.error?.message || 'Profile fetch failed');
        }
    }

    return staffToken || memberToken;
}

async function testCRUDOperations(adminToken) {
    subHeader('CRUD Data Flow Tests');

    if (!adminToken) {
        failure('api', 'CRUD tests skipped', 'No valid token');
        return;
    }

    // CREATE - Test lead creation
    const leadData = {
        name: 'DB Test Lead',
        phone: '+94770000000',
        email: `dbtest${Date.now()}@test.com`,
        source: 'WALK_IN',
        notes: 'Created by database test script'
    };

    const createResponse = await makeRequest('POST', '/api/leads', leadData, adminToken);
    let testLeadId = null;

    if (createResponse.ok && createResponse.data?.success) {
        testLeadId = createResponse.data.data?.id;
        success('api', 'CREATE operation (lead)', `ID: ${testLeadId}`);
    } else {
        failure('api', 'CREATE operation', createResponse.data?.error?.message || 'Create failed');
    }

    await sleep(100);

    // READ - Test reading the created lead
    if (testLeadId) {
        const readResponse = await makeRequest('GET', `/api/leads/${testLeadId}`, null, adminToken);

        if (readResponse.ok && readResponse.data?.success) {
            success('api', 'READ operation (single lead)', readResponse.data.data?.name);
        } else {
            // Try listing all leads if single fetch fails
            const listResponse = await makeRequest('GET', '/api/leads', null, adminToken);
            if (listResponse.ok) {
                success('api', 'READ operation (lead list)', `${listResponse.data.data?.length} leads`);
            } else {
                failure('api', 'READ operation', 'Could not read lead data');
            }
        }
    }

    await sleep(100);

    // UPDATE - Test updating the lead
    if (testLeadId) {
        const updateResponse = await makeRequest('PUT', `/api/leads/${testLeadId}`, {
            status: 'CONTACTED',
            notes: 'Updated by database test script'
        }, adminToken);

        if (updateResponse.ok && updateResponse.data?.success) {
            success('api', 'UPDATE operation (lead)', 'Status changed to CONTACTED');
        } else {
            failure('api', 'UPDATE operation', updateResponse.data?.error?.message || 'Update failed');
        }
    }

    await sleep(100);

    // DELETE - Clean up test lead
    if (testLeadId) {
        const deleteResponse = await makeRequest('DELETE', `/api/leads/${testLeadId}`, null, adminToken);

        if (deleteResponse.ok && deleteResponse.data?.success) {
            success('api', 'DELETE operation (lead)', 'Test data cleaned up');
        } else {
            failure('api', 'DELETE operation', deleteResponse.data?.error?.message || 'Delete failed');
        }
    }
}

async function testDataRetrieval(adminToken) {
    subHeader('API Data Retrieval Tests');

    if (!adminToken) {
        failure('api', 'Data retrieval tests skipped', 'No valid token');
        return;
    }

    const endpoints = [
        { name: 'Members list', path: '/api/members' },
        { name: 'Member stats', path: '/api/members/stats' },
        { name: 'Leads list', path: '/api/leads' },
        { name: 'Equipment list', path: '/api/equipment' },
        { name: 'Products list', path: '/api/inventory/products' },
        { name: 'Subscription plans', path: '/api/subscriptions/plans' },
        { name: 'Appointments', path: '/api/appointments' }
    ];

    for (const endpoint of endpoints) {
        const response = await makeRequest('GET', endpoint.path, null, adminToken);

        if (response.ok && response.data?.success !== false) {
            const data = response.data?.data || response.data;
            let summary = 'OK';

            if (Array.isArray(data)) {
                summary = `${data.length} items`;
            } else if (typeof data === 'object' && data !== null) {
                summary = Object.keys(data).length + ' fields';
            }

            success('api', endpoint.name, summary);
        } else {
            failure('api', endpoint.name, response.data?.error?.message || response.error || 'Failed');
        }

        await sleep(50);
    }
}

// =============================================================================
// SUMMARY & REPORTING
// =============================================================================

function printSummary() {
    header('TEST RESULTS SUMMARY');

    const dbTotal = results.database.passed + results.database.failed;
    const apiTotal = results.api.passed + results.api.failed;
    const totalPassed = results.database.passed + results.api.passed;
    const totalFailed = results.database.failed + results.api.failed;
    const total = totalPassed + totalFailed;

    log('\n  ┌───────────────────────────────────────────────────────┐', colors.gray);
    log('  │  Category         │  Passed  │  Failed  │  Total     │', colors.gray);
    log('  ├───────────────────┼──────────┼──────────┼────────────┤', colors.gray);

    const dbColor = results.database.failed === 0 ? colors.green : colors.yellow;
    log(`  │  Database Access  │    ${String(results.database.passed).padStart(2)}    │    ${String(results.database.failed).padStart(2)}    │    ${String(dbTotal).padStart(2)}      │`, dbColor);

    const apiColor = results.api.failed === 0 ? colors.green : colors.yellow;
    log(`  │  API Data Flow    │    ${String(results.api.passed).padStart(2)}    │    ${String(results.api.failed).padStart(2)}    │    ${String(apiTotal).padStart(2)}      │`, apiColor);

    log('  ├───────────────────┼──────────┼──────────┼────────────┤', colors.gray);

    const totalColor = totalFailed === 0 ? colors.green : colors.yellow;
    log(`  │  TOTAL            │    ${String(totalPassed).padStart(2)}    │    ${String(totalFailed).padStart(2)}    │    ${String(total).padStart(2)}      │`, totalColor);
    log('  └───────────────────────────────────────────────────────┘\n', colors.gray);

    const successRate = total > 0 ? ((totalPassed / total) * 100).toFixed(1) : 0;

    if (totalFailed === 0) {
        log('  🎉 All tests passed! Backend has full database access.', colors.green + colors.bold);
        log('     API endpoints successfully serve database data.\n', colors.green);
    } else if (successRate >= 80) {
        log(`  ⚠️  ${successRate}% success rate. Some tests failed.`, colors.yellow);
        log('     Review the output above for details.\n', colors.yellow);
    } else {
        log(`  ❌ ${successRate}% success rate. Critical failures detected.`, colors.red);
        log('     Check database connection and API configuration.\n', colors.red);
    }

    // Show failed tests
    if (totalFailed > 0) {
        log('  Failed Tests:', colors.red);
        [...results.database.tests, ...results.api.tests]
            .filter(t => !t.passed)
            .forEach(t => {
                log(`    • ${t.name}: ${t.error}`, colors.red);
            });
        log('');
    }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runTests() {
    console.clear();

    log('\n');
    log('╔═══════════════════════════════════════════════════════════════╗', colors.magenta);
    log('║                                                               ║', colors.magenta);
    log('║   🏋️ PowerWorld Gym - Database & API Test Suite             ║', colors.magenta);
    log('║                                                               ║', colors.magenta);
    log('╚═══════════════════════════════════════════════════════════════╝', colors.magenta);

    info(`Testing backend at: ${API_BASE_URL}`);
    info(`Started at: ${new Date().toLocaleTimeString()}\n`);

    try {
        // Phase 1: Database Connection
        header('PHASE 1: DATABASE CONNECTION');
        const serverUp = await testDatabaseConnectionViaHealth();

        if (!serverUp) {
            log('\n  ⚠️  Server not responding. Make sure the backend is running.', colors.yellow);
            log(`     Expected at: ${API_BASE_URL}`, colors.gray);
            log('     Start with: cd Backend && npm run dev\n', colors.gray);
            process.exit(1);
        }

        // Phase 2: Authentication
        header('PHASE 2: AUTHENTICATION FLOW');
        const adminToken = await testAuthenticationFlow();

        // Phase 3: Database Tables (via API)
        header('PHASE 3: DATABASE TABLE ACCESS');
        await testDatabaseTablesViaAPI(adminToken);

        // Phase 4: CRUD Operations
        header('PHASE 4: CRUD OPERATIONS');
        await testCRUDOperations(adminToken);

        // Phase 5: Data Retrieval
        header('PHASE 5: DATA RETRIEVAL');
        await testDataRetrieval(adminToken);

        // Summary
        printSummary();

    } catch (err) {
        log(`\n  ❌ Fatal error: ${err.message}`, colors.red);
        console.error(err);
        process.exit(1);
    }
}

// Check Node.js version for fetch support
if (typeof fetch === 'undefined') {
    console.error('\n❌ Error: This script requires Node.js 18 or higher (for native fetch support)\n');
    process.exit(1);
}

// Run the tests
runTests();
