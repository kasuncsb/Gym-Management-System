import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { config } from '../db/schema.js';

export async function getConfigValue(key: string, fallback: string): Promise<string> {
  const [row] = await db.select({ value: config.value }).from(config).where(eq(config.key, key)).limit(1);
  const v = row?.value?.trim();
  return v && v.length > 0 ? v : fallback;
}

export async function getConfigInt(key: string, fallback: number): Promise<number> {
  const raw = await getConfigValue(key, String(fallback));
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
