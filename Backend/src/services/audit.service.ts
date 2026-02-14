// Audit logging service — writes to auditLogs table (new schema)
import { db } from '../config/database';
import { auditLogs } from '../db/schema';
import { randomUUID } from 'crypto';
import { Request } from 'express';

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
}

