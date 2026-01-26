#!/usr/bin/env node

/**
 * API Test Script for PowerWorld Gym Management System
 * 
 * This script tests all major CRUD operations on the backend API
 * Tests include: Auth, Members, Subscriptions, Appointments, Inventory, Equipment, and Leads
 * 
 * Usage: node scripts/test-api.js
 * Make sure the backend server is running on http://localhost:5000
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// Test state
let authToken = null;
let adminToken = null;
let testMemberId = null;
let testLeadId = null;
let testProductId = null;
let testEquipmentId = null;

// Stats tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper functions
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
    log(`✓ ${message}`, colors.green);
    passedTests++;
}

function error(message) {
    log(`✗ ${message}`, colors.red);
    failedTests++;
}

function info(message) {
    log(`ℹ ${message}`, colors.cyan);
}

function section(message) {
    log(`\n${'='.repeat(60)}`, colors.blue);
    log(message, colors.blue);
    log('='.repeat(60), colors.blue);
}

async function makeRequest(method, endpoint, data = null, token = null) {
    totalTests++;
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

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        return {
            status: response.status,
            ok: response.ok,
            data: result
        };
    } catch (err) {
        return {
            status: 500,
            ok: false,
            error: err.message
        };
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test scenarios
async function testHealthCheck() {
    section('1. HEALTH CHECK');

    const response = await makeRequest('GET', '/../health');

    if (response.ok && response.data.status === 'ok') {
        success('Health check passed');
        info(`   Service: ${response.data.service}`);
        info(`   Version: ${response.data.version}`);
    } else {
        error('Health check failed');
    }
}

async function testAuthentication() {
    section('2. AUTHENTICATION - LOGIN');

    // Test member login
    const memberLogin = await makeRequest('POST', '/auth/login', {
        email: 'kasun.m@gmail.com',
        password: 'Password@123'
    });

    if (memberLogin.ok && memberLogin.data.success) {
        authToken = memberLogin.data.data.accessToken;
        success('Member login successful');
        if (authToken) {
            info(`   Token: ${authToken.substring(0, 20)}...`);
        }
        info(`   User: ${memberLogin.data.data.user.name}`);
    } else {
        error(`Member login failed: ${memberLogin.data?.error?.message || 'Unknown error'}`);
    }

    // Test admin login
    const adminLogin = await makeRequest('POST', '/auth/login', {
        email: 'admin@powerworld.lk',
        password: 'Password@123'
    });

    if (adminLogin.ok && adminLogin.data.success) {
        adminToken = adminLogin.data.data.accessToken;
        success('Admin login successful');
        info(`   Admin: ${adminLogin.data.data.user.name}`);
        if (adminToken) {
            info(`   Token: ${adminToken.substring(0, 20)}...`);
        }
    } else {
        error(`Admin login failed: ${adminLogin.data?.error?.message || 'Unknown error'}`);
    }
}

async function testGetProfile() {
    section('3. AUTHENTICATION - GET PROFILE');

    const response = await makeRequest('GET', '/auth/profile', null, authToken);

    if (response.ok && response.data.success) {
        success('Get profile successful');
        info(`   Name: ${response.data.data.name}`);
        info(`   Email: ${response.data.data.email}`);
        info(`   Role: ${response.data.data.role}`);
    } else {
        error(`Get profile failed: ${response.data?.error?.message || 'Unknown error'}`);
    }
}

async function testMemberOperations() {
    section('4. MEMBERS - CREATE (Register)');

    const randomEmail = `testuser${Date.now()}@test.com`;
    const createData = {
        name: 'Test User',
        email: randomEmail,
        password: 'TestPass123!',
        phone: '+94771234567',
        dateOfBirth: '1995-01-15'
    };

    const createResponse = await makeRequest('POST', '/members/register', createData);

    if (createResponse.ok && createResponse.data.success) {
        testMemberId = createResponse.data.data.id;
        success('Member registration successful');
        info(`   Member ID: ${testMemberId}`);
        info(`   Email: ${randomEmail}`);
    } else {
        error(`Member registration failed: ${createResponse.data?.error?.message || 'Unknown error'}`);
    }

    // READ - Get all members (admin only)
    section('5. MEMBERS - READ (Get All)');

    const getAllResponse = await makeRequest('GET', '/members', null, adminToken);

    if (getAllResponse.ok && getAllResponse.data.success) {
        success('Get all members successful');
        info(`   Total members: ${getAllResponse.data.data.length}`);
    } else {
        error(`Get all members failed: ${getAllResponse.data?.error?.message || 'Unknown error'}`);
    }

    // READ - Get specific member
    if (testMemberId) {
        section('6. MEMBERS - READ (Get One)');

        const getOneResponse = await makeRequest('GET', `/members/${testMemberId}`, null, adminToken);

        if (getOneResponse.ok && getOneResponse.data.success) {
            success('Get member by ID successful');
            info(`   Name: ${getOneResponse.data.data.name}`);
        } else {
            error(`Get member by ID failed: ${getOneResponse.data?.error?.message || 'Unknown error'}`);
        }
    }

    // UPDATE - Update member profile
    if (testMemberId) {
        section('7. MEMBERS - UPDATE');

        const updateData = {
            name: 'Test User Updated',
            phone: '+94771234999'
        };

        const updateResponse = await makeRequest('PUT', `/members/${testMemberId}`, updateData, adminToken);

        if (updateResponse.ok && updateResponse.data.success) {
            success('Member update successful');
            info(`   Updated name: ${updateResponse.data.data.name}`);
        } else {
            error(`Member update failed: ${updateResponse.data?.error?.message || 'Unknown error'}`);
        }
    }

    // Search members
    section('8. MEMBERS - SEARCH');

    const searchResponse = await makeRequest('GET', '/members/search?q=Kasun', null, adminToken);

    if (searchResponse.ok && searchResponse.data.success) {
        success('Member search successful');
        info(`   Results found: ${searchResponse.data.data.length}`);
    } else {
        error(`Member search failed: ${searchResponse.data?.error?.message || 'Unknown error'}`);
    }

    // Get stats
    section('9. MEMBERS - STATS');

    const statsResponse = await makeRequest('GET', '/members/stats', null, adminToken);

    if (statsResponse.ok && statsResponse.data.success) {
        success('Member stats retrieved');
        info(`   Total: ${statsResponse.data.data.total || 'N/A'}`);
        info(`   Active: ${statsResponse.data.data.active || 'N/A'}`);
    } else {
        error(`Member stats failed: ${statsResponse.data?.error?.message || 'Unknown error'}`);
    }
}

async function testLeadOperations() {
    section('10. LEADS - CREATE');

    const leadData = {
        name: 'Test Lead',
        phone: '+94771111111',
        email: `testlead${Date.now()}@test.com`,
        source: 'WALK_IN',
        notes: 'Interested in personal training'
    };

    const createResponse = await makeRequest('POST', '/leads', leadData, adminToken);

    if (createResponse.ok && createResponse.data.success) {
        testLeadId = createResponse.data.data.id;
        success('Lead created successfully');
        info(`   Lead ID: ${testLeadId}`);
    } else {
        error(`Lead creation failed: ${createResponse.data?.error?.message || 'Unknown error'}`);
    }

    // READ - Get all leads
    section('11. LEADS - READ (Get All)');

    const getAllResponse = await makeRequest('GET', '/leads', null, adminToken);

    if (getAllResponse.ok && getAllResponse.data.success) {
        success('Get all leads successful');
        info(`   Total leads: ${getAllResponse.data.data.length}`);
    } else {
        error(`Get all leads failed: ${getAllResponse.data?.error?.message || 'Unknown error'}`);
    }

    // UPDATE - Update lead status
    if (testLeadId) {
        section('12. LEADS - UPDATE');

        const updateData = {
            status: 'CONTACTED',
            notes: 'Follow up scheduled'
        };

        const updateResponse = await makeRequest('PUT', `/leads/${testLeadId}`, updateData, adminToken);

        if (updateResponse.ok && updateResponse.data.success) {
            success('Lead updated successfully');
        } else {
            error(`Lead update failed: ${updateResponse.data?.error?.message || 'Unknown error'}`);
        }
    }
}

async function testInventoryOperations() {
    section('13. INVENTORY - CREATE PRODUCT');

    const productData = {
        name: 'Test Protein Powder',
        sku: `TEST-PROD-${Date.now()}`,
        categoryId: 'pc001',
        price: 9999.00,
        costPrice: 7000.00,
        stockQuantity: 50,
        reorderLevel: 10
    };

    const createResponse = await makeRequest('POST', '/inventory/products', productData, adminToken);

    if (createResponse.ok && createResponse.data.success) {
        testProductId = createResponse.data.data.id;
        success('Product created successfully');
        info(`   Product ID: ${testProductId}`);
        info(`   SKU: ${productData.sku}`);
    } else {
        error(`Product creation failed: ${createResponse.data?.error?.message || 'Unknown error'}`);
    }

    // READ - Get all products
    section('14. INVENTORY - READ (Get All Products)');

    const getAllResponse = await makeRequest('GET', '/inventory/products', null, adminToken);

    if (getAllResponse.ok && getAllResponse.data.success) {
        success('Get all products successful');
        info(`   Total products: ${getAllResponse.data.data.length}`);
    } else {
        error(`Get all products failed: ${getAllResponse.data?.error?.message || 'Unknown error'}`);
    }

    // UPDATE - Update product stock
    if (testProductId) {
        section('15. INVENTORY - UPDATE (Stock Adjustment)');

        const updateData = {
            quantity: 10,
            reason: 'SALE'
        };

        const updateResponse = await makeRequest('POST', `/inventory/products/${testProductId}/adjust`, updateData, adminToken);

        if (updateResponse.ok && updateResponse.data.success) {
            success('Product stock updated successfully');
        } else {
            error(`Product stock update failed: ${updateResponse.data?.error?.message || 'Unknown error'}`);
        }
    }
}

async function testEquipmentOperations() {
    section('16. EQUIPMENT - CREATE');

    const equipmentData = {
        name: 'Test Treadmill',
        type: 'CARDIO',
        branchId: 'b1001',
        serialNumber: `TEST-${Date.now()}`,
        purchaseDate: '2024-01-01',
        status: 'OPERATIONAL'
    };

    const createResponse = await makeRequest('POST', '/equipment', equipmentData, adminToken);

    if (createResponse.ok && createResponse.data.success) {
        testEquipmentId = createResponse.data.data.id;
        success('Equipment created successfully');
        info(`   Equipment ID: ${testEquipmentId}`);
    } else {
        error(`Equipment creation failed: ${createResponse.data?.error?.message || 'Unknown error'}`);
    }

    // READ - Get all equipment
    section('17. EQUIPMENT - READ (Get All)');

    const getAllResponse = await makeRequest('GET', '/equipment', null, adminToken);

    if (getAllResponse.ok && getAllResponse.data.success) {
        success('Get all equipment successful');
        info(`   Total equipment: ${getAllResponse.data.data.length}`);
    } else {
        error(`Get all equipment failed: ${getAllResponse.data?.error?.message || 'Unknown error'}`);
    }

    // UPDATE - Update equipment status
    if (testEquipmentId) {
        section('18. EQUIPMENT - UPDATE');

        const updateData = {
            status: 'MAINTENANCE'
        };

        const updateResponse = await makeRequest('PUT', `/equipment/${testEquipmentId}`, updateData, adminToken);

        if (updateResponse.ok && updateResponse.data.success) {
            success('Equipment updated successfully');
        } else {
            error(`Equipment update failed: ${updateResponse.data?.error?.message || 'Unknown error'}`);
        }
    }
}

async function testSubscriptionOperations() {
    section('19. SUBSCRIPTIONS - READ (Get All Plans)');

    const getPlansResponse = await makeRequest('GET', '/subscriptions/plans', null, authToken);

    if (getPlansResponse.ok && getPlansResponse.data.success) {
        success('Get subscription plans successful');
        info(`   Available plans: ${getPlansResponse.data.data.length}`);
    } else {
        error(`Get subscription plans failed: ${getPlansResponse.data?.error?.message || 'Unknown error'}`);
    }

    // Read member subscriptions
    section('20. SUBSCRIPTIONS - READ (Member Subscriptions)');

    const getSubsResponse = await makeRequest('GET', '/subscriptions/my-subscriptions', null, authToken);

    if (getSubsResponse.ok && getSubsResponse.data.success) {
        success('Get member subscriptions successful');
        info(`   Active subscriptions: ${getSubsResponse.data.data.length}`);
    } else {
        error(`Get member subscriptions failed: ${getSubsResponse.data?.error?.message || 'Unknown error'}`);
    }
}

async function testAppointmentOperations() {
    section('21. APPOINTMENTS - READ (Get All)');

    const getResponse = await makeRequest('GET', '/appointments', null, authToken);

    if (getResponse.ok && getResponse.data.success) {
        success('Get appointments successful');
        info(`   Total appointments: ${getResponse.data.data.length}`);
    } else {
        error(`Get appointments failed: ${getResponse.data?.error?.message || 'Unknown error'}`);
    }
}

async function testDeleteOperations() {
    section('22. DELETE OPERATIONS');

    // Delete test member (if created)
    if (testMemberId) {
        const deleteResponse = await makeRequest('DELETE', `/members/${testMemberId}`, null, adminToken);

        if (deleteResponse.ok && deleteResponse.data.success) {
            success('Test member deleted successfully');
        } else {
            error(`Test member deletion failed: ${deleteResponse.data?.error?.message || 'Unknown error'}`);
        }
    }

    // Delete test lead (if created)
    if (testLeadId) {
        const deleteResponse = await makeRequest('DELETE', `/leads/${testLeadId}`, null, adminToken);

        if (deleteResponse.ok && deleteResponse.data.success) {
            success('Test lead deleted successfully');
        } else {
            error(`Test lead deletion failed: ${deleteResponse.data?.error?.message || 'Unknown error'}`);
        }
    }

    // Delete test product (if created)
    if (testProductId) {
        const deleteResponse = await makeRequest('DELETE', `/inventory/products/${testProductId}`, null, adminToken);

        if (deleteResponse.ok && deleteResponse.data.success) {
            success('Test product deleted successfully');
        } else {
            error(`Test product deletion failed: ${deleteResponse.data?.error?.message || 'Unknown error'}`);
        }
    }

    // Delete test equipment (if created)
    if (testEquipmentId) {
        const deleteResponse = await makeRequest('DELETE', `/equipment/${testEquipmentId}`, null, adminToken);

        if (deleteResponse.ok && deleteResponse.data.success) {
            success('Test equipment deleted successfully');
        } else {
            error(`Test equipment deletion failed: ${deleteResponse.data?.error?.message || 'Unknown error'}`);
        }
    }
}

async function printSummary() {
    section('TEST SUMMARY');

    log(`Total Tests: ${totalTests}`, colors.cyan);
    log(`Passed: ${passedTests}`, colors.green);
    log(`Failed: ${failedTests}`, colors.red);

    const successRate = ((passedTests / totalTests) * 100).toFixed(2);
    log(`Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.yellow);

    log('\n');

    if (failedTests === 0) {
        log('🎉 All tests passed!', colors.green);
    } else {
        log(`⚠ ${failedTests} test(s) failed. Review the output above for details.`, colors.yellow);
    }
}

// Main test runner
async function runTests() {
    log('\n');
    log('╔═══════════════════════════════════════════════════════════╗', colors.blue);
    log('║   PowerWorld Gym Management System - API Test Suite      ║', colors.blue);
    log('╚═══════════════════════════════════════════════════════════╝', colors.blue);
    log('\n');

    info(`Testing API at: ${API_BASE_URL}`);
    log('\n');

    try {
        await testHealthCheck();
        await sleep(100);

        await testAuthentication();
        await sleep(100);

        await testGetProfile();
        await sleep(100);

        await testMemberOperations();
        await sleep(100);

        await testLeadOperations();
        await sleep(100);

        await testInventoryOperations();
        await sleep(100);

        await testEquipmentOperations();
        await sleep(100);

        await testSubscriptionOperations();
        await sleep(100);

        await testAppointmentOperations();
        await sleep(100);

        await testDeleteOperations();
        await sleep(100);

        await printSummary();

    } catch (err) {
        error(`Fatal error during test execution: ${err.message}`);
        console.error(err);
        process.exit(1);
    }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    console.error('Error: This script requires Node.js 18 or higher (for native fetch support)');
    console.error('Alternatively, you can use node-fetch by running: npm install node-fetch');
    process.exit(1);
}

// Run the tests
runTests();
