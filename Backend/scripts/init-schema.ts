/**
 * Initialize database schema from bundled scripts/schema/init.sql
 * (Synced from Gym-Management-System-Docs/Database/final_schema.sql)
 * Fixes FK order: creates promotions before subscriptions (subscriptions references promotions)
 * Run with: npm run db:init
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const scriptDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(scriptDir, '..', '..', '.env') });
dotenv.config({ path: join(scriptDir, '..', '.env') });
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
if (!DB_HOST || !DB_USER) {
  console.error('❌ DB_HOST and DB_USER must be set in .env');
  process.exit(1);
}
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_NAME = process.env.DB_NAME!;

function getSchemaPath(): string {
  return join(scriptDir, 'schema', 'init.sql');
}

/**
 * Reorder schema: promotions (section 12) must be created before subscriptions (section 10)
 * because subscriptions has FK to promotions.
 * Strategy: insert promotions before subscriptions, then remove the original promotions block.
 */
function reorderSchema(content: string): string {
  const subBlock = content.match(
    /(-- =+\s*\n-- 10\. SUBSCRIPTIONS[\s\S]*?)(?=-- =+\s*\n-- 11\. SUBSCRIPTION_FREEZES)/
  )?.[1];
  const promoBlock = content.match(
    /(-- =+\s*\n-- 12\. PROMOTIONS[\s\S]*?)(?=-- =+\s*\n-- 13\. PAYMENTS)/
  )?.[1];
  if (!subBlock || !promoBlock) return content;
  // 1. Replace subscriptions block with promotions + subscriptions (so promotions is created first)
  let out = content.replace(
    /-- =+\s*\n-- 10\. SUBSCRIPTIONS[\s\S]*?(?=-- =+\s*\n-- 11\. SUBSCRIPTION_FREEZES)/,
    promoBlock + '\n\n' + subBlock
  );
  // 2. Remove the original promotions block (the one between subscription_freezes and payments)
  // Use a replace callback to remove only the second occurrence of the promotions block
  let count = 0;
  out = out.replace(
    /-- =+\s*\n-- 12\. PROMOTIONS[\s\S]*?(?=-- =+\s*\n-- 13\. PAYMENTS)/g,
    (match) => (++count === 2 ? '' : match)
  );
  return out;
}

async function init() {
  console.log('🔧 Initializing schema...');
  const schemaPath = getSchemaPath();
  console.log('   Schema:', schemaPath);
  let sql = readFileSync(schemaPath, 'utf-8');
  sql = reorderSchema(sql);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    console.log('✅ Schema initialized');
  } finally {
    await conn.end();
  }
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Schema init failed:', err);
  process.exit(1);
});
