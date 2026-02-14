// Door Access Service — Phase 1 (QR scan → visit sessions)
//
// Flow: scan QR → validate signature → check user active → check subscription
//       → determine in/out → create/close visitSession + accessLog
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import {
  users, members, subscriptions, visitSessions, accessLogs, branches,
} from '../db/schema';
import { validateQRPayload } from '../utils/qr-generator';
import logger from '../config/logger';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

export interface ScanResult {
  success: boolean;
  userId?: string;
  userName?: string;
  accessGranted?: boolean;
  subscriptionValid?: boolean;
  direction?: 'in' | 'out';
  message: string;
  sessionId?: string;
}

export class DoorAccessService {
  /**
   * Process a QR code scan from a gate/kiosk.
   */
  static async processQRScan(
    qrData: string,
    gateId?: string,
  ): Promise<ScanResult> {
    try {
      // 1. Parse user ID from payload (need to look up secret first)
      let parsed: { userId?: string; sig?: string };
      try {
        parsed = JSON.parse(qrData);
      } catch {
        return { success: false, accessGranted: false, message: 'Invalid QR data' };
      }
      if (!parsed.userId) {
        return { success: false, accessGranted: false, message: 'Malformed QR payload' };
      }

      // 2. Look up user + secret
      const [user] = await db
        .select({ id: users.id, fullName: users.fullName, role: users.role, isActive: users.isActive, qrCodeSecret: users.qrCodeSecret })
        .from(users)
        .where(and(eq(users.id, parsed.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        await this.logAccess(null, gateId, 'in', false, 'User not found');
        return { success: false, accessGranted: false, message: 'User not found' };
      }

      if (!user.isActive) {
        await this.logAccess(user.id, gateId, 'in', false, 'Account inactive');
        return { success: false, accessGranted: false, userId: user.id, userName: user.fullName, message: 'Account is not active' };
      }

      if (!user.qrCodeSecret) {
        await this.logAccess(user.id, gateId, 'in', false, 'No QR secret');
        return { success: false, accessGranted: false, message: 'QR code not set up for this user' };
      }

      // 3. Validate signature
      const validation = validateQRPayload(qrData, user.qrCodeSecret);
      if (!validation.valid) {
        await this.logAccess(user.id, gateId, 'in', false, validation.reason || 'Invalid signature');
        return { success: false, accessGranted: false, userId: user.id, userName: user.fullName, message: validation.reason || 'Invalid QR code' };
      }

      // 4. For members, check subscription validity
      if (user.role === 'member') {
        const [member] = await db.select().from(members).where(eq(members.userId, user.id)).limit(1);
        if (!member || member.status !== 'active') {
          await this.logAccess(user.id, gateId, 'in', false, 'Member not active');
          return { success: false, accessGranted: false, userId: user.id, userName: user.fullName, message: 'Member account is not active' };
        }

        const today = new Date();
        const [activeSub] = await db
          .select()
          .from(subscriptions)
          .where(and(
            eq(subscriptions.memberId, member.id),
            eq(subscriptions.status, 'active'),
            lte(subscriptions.startDate, today),
            gte(subscriptions.endDate, today),
          ))
          .limit(1);

        if (!activeSub) {
          // Check grace period
          const [graceSub] = await db
            .select()
            .from(subscriptions)
            .where(and(eq(subscriptions.memberId, member.id), eq(subscriptions.status, 'grace_period')))
            .limit(1);

          if (!graceSub) {
            await this.logAccess(user.id, gateId, 'in', false, 'No active subscription');
            return {
              success: true, accessGranted: false, subscriptionValid: false,
              userId: user.id, userName: user.fullName,
              message: 'No active subscription',
            };
          }
        }
      }

      // 5. Determine in/out based on current active session
      const [activeSession] = await db
        .select()
        .from(visitSessions)
        .where(and(eq(visitSessions.userId, user.id), eq(visitSessions.status, 'active')))
        .limit(1);

      let direction: 'in' | 'out';
      let sessionId: string;

      if (!activeSession) {
        // CHECK IN
        direction = 'in';
        sessionId = randomUUID();

        // Determine visit type based on role
        const visitType = user.role === 'member' ? 'member_visit'
          : user.role === 'staff' ? 'staff_shift'
          : user.role === 'manager' ? 'manager_visit'
          : 'admin_visit';

        // Resolve branch ID
        const branchId = await this.resolveBranchId(gateId);

        await db.insert(visitSessions).values({
          id: sessionId,
          userId: user.id,
          branchId,
          checkInAt: new Date(),
          status: 'active',
          visitType,
        });
      } else {
        // CHECK OUT
        direction = 'out';
        sessionId = activeSession.id;

        const checkIn = new Date(activeSession.checkInAt).getTime();
        const durationMinutes = Math.round((Date.now() - checkIn) / 60000);

        await db
          .update(visitSessions)
          .set({ checkOutAt: new Date(), durationMinutes, status: 'completed' })
          .where(eq(visitSessions.id, sessionId));
      }

      // 6. Log access
      await this.logAccess(user.id, gateId, direction, true, undefined, sessionId);

      logger.info('QR scan OK', { userId: user.id, direction, sessionId });

      return {
        success: true,
        accessGranted: true,
        subscriptionValid: true,
        userId: user.id,
        userName: user.fullName,
        direction,
        sessionId,
        message: direction === 'in' ? 'Welcome to PowerWorld Gym!' : 'Thank you for visiting!',
      };
    } catch (error) {
      logger.error('QR scan failed', { error });
      return { success: false, accessGranted: false, message: 'System error occurred. Please contact staff.' };
    }
  }

  // ---- Helpers -------------------------------------------------------------

  /**
   * Resolve the branch ID from environment or database
   */
  private static async resolveBranchId(gateId?: string): Promise<string> {
    // Option 1: Use environment variable if set
    if (env.DEFAULT_BRANCH_ID) {
      return env.DEFAULT_BRANCH_ID;
    }

    // Option 2: Query first active branch (for Kiribathgoda-only deployment)
    const [branch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.isActive, true))
      .limit(1);

    if (branch) {
      return branch.id;
    }

    // Fallback: Should not happen in production
    logger.error('No branch found for access logging', { gateId });
    throw new Error('Branch configuration error');
  }

  private static async logAccess(
    userId: string | null,
    gateId: string | undefined,
    direction: 'in' | 'out',
    isAuthorized: boolean,
    denyReason?: string,
    sessionId?: string,
  ): Promise<void> {
    if (!userId) return; // can't log without userId (schema requires it)
    await db.insert(accessLogs).values({
      id: randomUUID(),
      userId,
      gateId: gateId ?? null,
      sessionId: sessionId ?? null,
      scannedAt: new Date(),
      direction,
      isAuthorized,
      denyReason: denyReason ?? null,
    });
  }

  /** Get attendance history for a user */
  static async getAttendanceHistory(userId: string, limit = 50) {
    return db
      .select()
      .from(visitSessions)
      .where(eq(visitSessions.userId, userId))
      .orderBy(desc(visitSessions.checkInAt))
      .limit(limit);
  }

  /** Get raw access logs (admin/manager view) */
  static async getAccessLogs(options: {
    startDate?: Date;
    endDate?: Date;
    authorized?: boolean;
    limit?: number;
  } = {}) {
    const conditions = [];
    if (options.startDate) conditions.push(gte(accessLogs.scannedAt, options.startDate));
    if (options.endDate) conditions.push(lte(accessLogs.scannedAt, options.endDate));
    if (options.authorized !== undefined) conditions.push(eq(accessLogs.isAuthorized, options.authorized));

    const rows = await db
      .select({ log: accessLogs, user: { fullName: users.fullName, email: users.email } })
      .from(accessLogs)
      .innerJoin(users, eq(accessLogs.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(accessLogs.scannedAt))
      .limit(options.limit ?? 100);

    return rows.map(({ log, user }) => ({ ...log, userName: user.fullName, email: user.email }));
  }
}

