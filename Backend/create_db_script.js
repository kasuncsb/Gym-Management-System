require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDb() {
    // Parse connection string or use params
    // Env: DATABASE_URL="mysql://root:19683647@localhost:3307/powerworld_gym"
    // We need to connect to 'mysql' user or no DB to create one.

    // Quick parse:
    const uri = process.env.DATABASE_URL;
    const parts = new URL(uri);

    const connection = await mysql.createConnection({
        host: parts.hostname,
        port: parts.port,
        user: parts.username,
        password: parts.password,
    });

    try {
        console.log(`Connected to MySQL at ${parts.hostname}:${parts.port}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${parts.pathname.substring(1)}`);
        console.log(`Database ${parts.pathname.substring(1)} created or already exists.`);
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await connection.end();
    }
}

createDb();
