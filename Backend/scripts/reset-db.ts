
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import { exec } from 'child_process';
import util from 'util';

// Load environment variables
dotenv.config();

const execPromise = util.promisify(exec);

async function resetDatabase() {
    let dbConfig;
    let dbName = process.env.DB_NAME || 'powerworld_gym';

    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        dbConfig = {
            host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
            port: parseInt(url.port || '3306', 10),
            user: url.username,
            password: url.password,
            multipleStatements: true
        };
        if (url.pathname.length > 1) {
            dbName = url.pathname.substring(1);
        }
    } else {
        dbConfig = {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            multipleStatements: true,
        };
    }

    console.log(`INFO:   Using Database: ${dbName} on ${dbConfig.host}:${dbConfig.port}`);


    console.log('INFO:   Starting Database Reset Process...');

    let connection;

    try {
        // 1. Connect to MySQL Server (no DB selected yet)
        connection = await mysql.createConnection(dbConfig);
        console.log('INFO:   Connected to MySQL Server');

        // 2. Drop and Create Database
        console.log(`INFO:   Dropping database '${dbName}'...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);

        console.log(`INFO:   Creating database '${dbName}'...`);
        await connection.query(`CREATE DATABASE \`${dbName}\`;`);

        console.log(`INFO:   Use database '${dbName}'...`);
        await connection.query(`USE \`${dbName}\`;`);

        // Close this connection to allow drizzle-kit to connect independently or use it? 
        // Drizzle kit uses its own connection config.
        // We can keep this connection open if we want to run seed.sql later using it.

        // 3. Run db:push (Schema Push)
        console.log('INFO:   Pushing Schema (drizzle-kit)...');
        try {
            // Execute command in the Backend directory (current process cwd is likely Backend root if run via npm)
            const { stdout, stderr } = await execPromise('npm run db:push');
            console.log(stdout);
            if (stderr) console.error(stderr);
            if (stderr) console.error(stderr);
            console.log('INFO:   Schema pushed successfully');
        } catch (pushError: any) {
            console.error('ERROR:  Failed to push schema:', pushError.message);
            throw pushError;
        }

        console.log('INFO:   Database schema is ready (no seed data).');

    } catch (error) {
        console.error('ERROR:  Database Reset Failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    console.log('INFO:   All Done! Database is fresh and ready.');
}

resetDatabase();
