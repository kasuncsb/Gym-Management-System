// Database connection for Drizzle ORM
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema';
import logger from './logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create MySQL connection pool
const poolConnection = mysql.createPool(DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Test connection
poolConnection.getConnection()
  .then(connection => {
    logger.info('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

export default db;
