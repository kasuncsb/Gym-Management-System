import { desc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { auditLogs } from '../db/schema.js';
import { ids } from '../utils/id.js';

export type AuditCategory = 'member' | 'payment' | 'system' | 'security' | 'trainer' | 'access' | 'config';

export async function appendAudit(input: {
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  category: AuditCategory;
  entityType?: string | null;
  entityId?: string | null;
  detail?: string | null;
}) {
  try {
    await db.insert(auditLogs).values({
      id: ids.uuid(),
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel ?? null,
      action: input.action,
      category: input.category,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      detail: input.detail ? input.detail.slice(0, 500) : null,
    });
  } catch (e) {
    console.error('audit append failed', e);
  }
}

export async function listAuditLogs(limit = 500) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(Math.min(limit, 2000));
}
