
const { db } = require('./dist/config/database');
const { users, staff, members } = require('./dist/db/schema');
const { eq } = require('drizzle-orm');

async function inspect() {
    console.log('--- DB INSPECTION ---');
    try {
        const allUsers = await db.select().from(users).limit(5);
        console.log('Users in DB (first 5):', JSON.stringify(allUsers, null, 2));

        const allStaff = await db.select().from(staff).limit(5);
        console.log('Staff in DB (first 5):', JSON.stringify(allStaff, null, 2));

        const allMembers = await db.select().from(members).limit(5);
        console.log('Members in DB (first 5):', JSON.stringify(allMembers, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspect();
