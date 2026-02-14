// Audit logging service — writes to auditLogs table (new schema)
import { db } from '../config/database';
import { auditLogs, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { eq, and, desc, gte, lte, sql, like } from 'drizzle-orm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  GENERATE_QR = 'GENERATE_QR',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  FREEZE_SUBSCRIPTION = 'FREEZE_SUBSCRIPTION',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',
}

export class AuditService {
  /**
   * Record an audit log entry.
   *
   * @param action   e.g. AuditAction.LOGIN
   * @param targetType  Entity table name ('users', 'members', ...)
   * @param targetId    ID of the affected row
   * @param actorId     users.id of the person performing the action (optional for system)
   * @param changes     JSON diff / extra context
   * @param req         Express request (optional — extracts IP & UA)
   */
  static async log(
    action: AuditAction | string,
    targetType: string,
    targetId: string,
    actorId?: string,
    changes?: Record<string, any>,
    req?: Request,
  ): Promise<void> {
    try {
      const ipAddress =
        (req?.headers?.['x-forwarded-for'] as string) ||
        req?.socket?.remoteAddress ||
        '';
      const userAgent =
        (req?.headers?.['user-agent'] as string)?.substring(0, 255) || '';

      await db.insert(auditLogs).values({
        id: randomUUID(),
        actorId: actorId ?? null,
        action: action.toString(),
        targetType,
        targetId,
        changes: changes ?? null,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      // Never let audit failures disrupt the main flow
      console.error('[AUDIT_FAILURE]', error);
    }
  }

  /** Query audit logs with filters and pagination */
  static async query(filters: {
    actorId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.targetType) conditions.push(eq(auditLogs.targetType, filters.targetType));
    if (filters.startDate) conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
    if (filters.endDate) conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
    if (filters.search) conditions.push(like(auditLogs.action, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        log: auditLogs,
        actorName: users.fullName,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(auditLogs)
      .where(where);

    return {
      rows: rows.map(r => ({
        ...r.log,
        actorName: r.actorName,
        actorEmail: r.actorEmail,
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  /** Get distinct actions for filter dropdown */
  static async getDistinctActions() {
    const rows = await db
      .select({ action: auditLogs.action, count: sql<number>`count(*)` })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`));
    return rows.map(r => ({ action: r.action, count: Number(r.count) }));
  }

  /** Get distinct target types */
  static async getDistinctTargetTypes() {
    const rows = await db
      .select({ targetType: auditLogs.targetType, count: sql<number>`count(*)` })
      .from(auditLogs)
      .groupBy(auditLogs.targetType)
      .orderBy(desc(sql`count(*)`));
    return rows.map(r => ({ targetType: r.targetType, count: Number(r.count) }));
  }

  /** Export audit logs as JSON array (for CSV conversion on frontend) */
  static async exportLogs(filters: {
    actorId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const conditions = [];
    if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.targetType) conditions.push(eq(auditLogs.targetType, filters.targetType));
    if (filters.startDate) conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
    if (filters.endDate) conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        actorId: auditLogs.actorId,
        actorName: users.fullName,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(5000);
  }
}
