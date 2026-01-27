// Staff Controller - Operational endpoints
import { Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { accessLogs, equipment, users, members } from '../db/schema';
import { eq, count, sql, and, gte, desc, isNull } from 'drizzle-orm';

export class StaffController {
    // Get staff metrics (operational focus)
    static getMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Today's check-ins
        const [todayCheckIns] = await db
            .select({ count: count() })
            .from(accessLogs)
            .where(
                and(
                    gte(accessLogs.timestamp, today),
                    eq(accessLogs.direction, 'in')
                )
            );

        // Today's check-outs
        const [todayCheckOuts] = await db
            .select({ count: count() })
            .from(accessLogs)
            .where(
                and(
                    gte(accessLogs.timestamp, today),
                    eq(accessLogs.direction, 'out')
                )
            );

        // Equipment needing maintenance
        const [maintenanceCount] = await db
            .select({ count: count() })
            .from(equipment)
            .where(eq(equipment.status, 'maintenance'));

        // Total equipment
        const [totalEquipment] = await db
            .select({ count: count() })
            .from(equipment);

        res.json(successResponse({
            checkIns: {
                today: todayCheckIns?.count || 0,
            },
            checkOuts: {
                today: todayCheckOuts?.count || 0,
            },
            equipment: {
                total: totalEquipment?.count || 0,
                needsMaintenance: maintenanceCount?.count || 0,
            },
        }, 'Staff metrics retrieved'));
    });

    // Get today's check-in history
    static getTodayCheckIns = asyncHandler(async (req: AuthRequest, res: Response) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkIns = await db
            .select({
                id: accessLogs.id,
                userId: accessLogs.userId,
                memberName: users.fullName,
                timestamp: accessLogs.timestamp,
                direction: accessLogs.direction,
                isAuthorized: accessLogs.isAuthorized,
                denyReason: accessLogs.denyReason,
            })
            .from(accessLogs)
            .innerJoin(users, eq(users.id, accessLogs.userId))
            .where(gte(accessLogs.timestamp, today))
            .orderBy(desc(accessLogs.timestamp))
            .limit(100);

        res.json(successResponse(checkIns, 'Today check-ins retrieved'));
    });

    // Get equipment status
    static getEquipmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
        const equipmentList = await db
            .select()
            .from(equipment)
            .orderBy(equipment.status);

        res.json(successResponse(equipmentList, 'Equipment status retrieved'));
    });

    // Report equipment issue
    static reportEquipmentIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        await db
            .update(equipment)
            .set({ status: 'maintenance' })
            .where(eq(equipment.id, id));

        res.json(successResponse({ reported: true }, 'Equipment issue reported'));
    });
}
