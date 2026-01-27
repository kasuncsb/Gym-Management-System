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
}

export class AuditService {
    /**
     * Log an action to the audit_logs table
     * @param action The type of action performed
     * @param entity The table/entity name (e.g., 'users', 'members')
     * @param entityId The ID of the specific record affected
     * @param userId The ID of the user performing the action (optional, e.g., for system actions or failed logins)
     * @param details Additional JSON details about the change (optional)
     * @param req Express request object to extract IP address (optional)
     */
    static async log(
        action: AuditAction | string,
        entity: string,
        entityId: string,
        userId?: string,
        details?: Record<string, any>,
        req?: Request
    ) {
        try {
            // Extract IP address from request if available
            let ipAddress = '';
            if (req) {
                ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
            }

            await db.insert(auditLogs).values({
                id: randomUUID(),
                userId: userId || null,
                action: action.toString(),
                entity,
                entityId,
                details: details ? JSON.stringify(details) : null, // Drizzle handles JSON, but ensuring it's valid
                ipAddress: ipAddress,
                timestamp: new Date(),
            });

            console.log(`[AUDIT] ${action} on ${entity}:${entityId} by ${userId || 'System'}`);
        } catch (error) {
            // We should not throw here to prevent disrupting the main flow, 
            // but we must log the failure to our system logs.
            console.error('[AUDIT_FAILURE] Failed to insert audit log:', error);
        }
    }
}
