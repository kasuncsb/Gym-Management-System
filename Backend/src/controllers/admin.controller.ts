// Admin Controller - System administration endpoints
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse, paginatedResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentService } from '../services/document.service';
import { MemberService } from '../services/member.service';
import { AuditService } from '../services/audit.service';
import { db } from '../config/database';
import { users, members, equipment, accessLogs } from '../db/schema';
import { eq, count, sql, and, gte, isNull } from 'drizzle-orm';

export class AdminController {
    // Get pending document approvals
    static getPendingDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
        const documents = await DocumentService.getPendingDocuments();
        return res.json(successResponse(documents, 'Pending documents retrieved'));
    });

    // Approve member document
    static approveDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const adminId = req.user!.id;

        // Get document to find member
        const docs = await DocumentService.getMemberDocuments(id);
        if (docs.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Document not found' } });
        }

        const memberId = docs[0].memberId;

        // Update member status to active (verified)
        await DocumentService.updateMemberVerificationStatus(memberId, true);

        // Log audit
        // Log audit
        await AuditService.log(
            'APPROVE_DOCUMENT',
            'MEMBER_DOCUMENTS',
            id,
            adminId,
            { memberId }
        );

        return res.json(successResponse({ approved: true }, 'Document approved successfully'));
    });

    // Reject member document
    static rejectDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        // Get document to find member
        const docs = await DocumentService.getMemberDocuments(id);
        if (docs.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Document not found' } });
        }

        const memberId = docs[0].memberId;

        // Keep member in pending status
        await DocumentService.updateMemberVerificationStatus(memberId, false);

        // Log audit
        // Log audit
        await AuditService.log(
            'REJECT_DOCUMENT',
            'MEMBER_DOCUMENTS',
            id,
            adminId,
            { memberId, reason }
        );

        return res.json(successResponse({ rejected: true, reason }, 'Document rejected'));
    });

    // Get admin metrics (technical focus)
    static getMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total users by role
        const [userCounts] = await db
            .select({
                total: count(),
                admins: sql<number>`SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END)`,
                managers: sql<number>`SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END)`,
                staff: sql<number>`SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END)`,
                trainers: sql<number>`SUM(CASE WHEN role = 'trainer' THEN 1 ELSE 0 END)`,
                members: sql<number>`SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END)`,
            })
            .from(users)
            .where(isNull(users.deletedAt));

        // Pending verifications
        const [pendingCount] = await db
            .select({ count: count() })
            .from(members)
            .where(eq(members.status, 'pending'));

        // Equipment requiring maintenance
        const [equipmentAlerts] = await db
            .select({ count: count() })
            .from(equipment)
            .where(eq(equipment.status, 'maintenance'));

        // Today's access logs count
        const [todayAccess] = await db
            .select({ count: count() })
            .from(accessLogs)
            .where(gte(accessLogs.timestamp, today));

        return res.json(successResponse({
            users: userCounts,
            pendingVerifications: pendingCount?.count || 0,
            equipmentAlerts: equipmentAlerts?.count || 0,
            todayAccessLogs: todayAccess?.count || 0,
        }, 'Admin metrics retrieved'));
    });

    // Get all users (admin only)
    static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const role = req.query.role as string;
        const offset = (page - 1) * limit;

        let query = db
            .select({
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                role: users.role,
                phone: users.phone,
                isActive: users.isActive,
                isEmailVerified: users.isEmailVerified,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(isNull(users.deletedAt))
            .limit(limit)
            .offset(offset);

        const allUsers = await query;

        // Get total count
        const [countResult] = await db
            .select({ count: count() })
            .from(users)
            .where(isNull(users.deletedAt));

        return res.json(paginatedResponse(allUsers, page, limit, countResult?.count || 0));
    });
}
