/// <reference types="node" />
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

// Strict — no fallbacks. All variables must be set in Backend/.env
const host     = process.env.DB_HOST;
const port     = process.env.DB_PORT;
const user     = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

if (!host || !port || !user || database === undefined) {
  throw new Error(
    '❌  Missing database env vars for drizzle-kit. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in Backend/.env',
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host,
    port:     Number(port),
    user,
    password: password ?? '',   // allow empty password
    database,
  },
});
