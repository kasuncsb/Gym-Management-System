// Staff Controller — Phase 1 (operational endpoints)
import { Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { accessLogs, equipment, users } from '../db/schema';
import { eq, count, and, gte, desc } from 'drizzle-orm';

export class StaffController {
  /** Operational metrics */
  static getMetrics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCheckIns] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(gte(accessLogs.scannedAt, today), eq(accessLogs.direction, 'in')));

    const [todayCheckOuts] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(gte(accessLogs.scannedAt, today), eq(accessLogs.direction, 'out')));

    const [maintenanceCount] = await db
      .select({ count: count() })
      .from(equipment)
      .where(eq(equipment.status, 'needs_maintenance'));

    const [totalEquipment] = await db.select({ count: count() }).from(equipment);

    res.json(successResponse({
      checkIns: { today: todayCheckIns?.count || 0 },
      checkOuts: { today: todayCheckOuts?.count || 0 },
      equipment: { total: totalEquipment?.count || 0, needsMaintenance: maintenanceCount?.count || 0 },
    }, 'Staff metrics retrieved'));
  });

  /** Today's check-ins */
  static getTodayCheckIns = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIns = await db
      .select({
        id: accessLogs.id,
        userId: accessLogs.userId,
        memberName: users.fullName,
        scannedAt: accessLogs.scannedAt,
        direction: accessLogs.direction,
        isAuthorized: accessLogs.isAuthorized,
        denyReason: accessLogs.denyReason,
      })
      .from(accessLogs)
      .innerJoin(users, eq(users.id, accessLogs.userId))
      .where(gte(accessLogs.scannedAt, today))
      .orderBy(desc(accessLogs.scannedAt))
      .limit(100);

    res.json(successResponse(checkIns, 'Today check-ins retrieved'));
  });

  /** Equipment status list */
  static getEquipmentStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const list = await db.select().from(equipment).orderBy(equipment.status);
    res.json(successResponse(list, 'Equipment status retrieved'));
  });

  /** Report equipment issue (quick flag) */
  static reportEquipmentIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    await db.update(equipment).set({ status: 'needs_maintenance' }).where(eq(equipment.id, id));
    res.json(successResponse({ reported: true }, 'Equipment issue reported'));
  });
}
