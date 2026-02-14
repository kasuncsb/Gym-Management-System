// Admin Controller — Phase 1
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse, paginatedResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { DocumentService } from '../services/document.service';
import { AuditService, AuditAction } from '../services/audit.service';
import { db } from '../config/database';
import { users, members, equipment, accessLogs } from '../db/schema';
import { eq, count, sql, and, gte, isNull } from 'drizzle-orm';

export class AdminController {
  /** Get pending document approvals */
  static getPendingDocuments = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const documents = await DocumentService.getPendingDocuments();
    res.json(successResponse(documents, 'Pending documents retrieved'));
  });

  /** Approve document */
  static approveDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const adminId = req.user!.userId;

    const docs = await DocumentService.getMemberDocuments(id);
    if (docs.length === 0) return void res.status(404).json({ success: false, error: { message: 'Document not found' } });

    const memberId = docs[0].memberId as string;
    await DocumentService.approveDocument(id, adminId);

    // If all docs verified, activate member
    const allVerified = await DocumentService.areAllDocsVerified(memberId);
    if (allVerified) {
      await DocumentService.updateMemberVerificationStatus(memberId, true);
    }

    await AuditService.log(AuditAction.UPDATE, 'member_documents', id, adminId, { action: 'approve', memberId });
    res.json(successResponse({ approved: true }, 'Document approved'));
  });

  /** Reject document */
  static rejectDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { reason, note } = req.body;
    const adminId = req.user!.userId;

    await DocumentService.rejectDocument(id, adminId, reason, note);
    await AuditService.log(AuditAction.UPDATE, 'member_documents', id, adminId, { action: 'reject', reason });
    res.json(successResponse({ rejected: true }, 'Document rejected'));
  });

  /** Admin metrics */
  static getMetrics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const [pendingCount] = await db.select({ count: count() }).from(members).where(eq(members.status, 'incomplete'));

    const [equipmentAlerts] = await db
      .select({ count: count() })
      .from(equipment)
      .where(eq(equipment.status, 'needs_maintenance'));

    const [todayAccess] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(gte(accessLogs.scannedAt, today));

    res.json(successResponse({
      users: userCounts,
      pendingVerifications: pendingCount?.count || 0,
      equipmentAlerts: equipmentAlerts?.count || 0,
      todayAccessLogs: todayAccess?.count || 0,
    }, 'Admin metrics retrieved'));
  });

  /** All users (admin) */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select({
        id: users.id, email: users.email, fullName: users.fullName, role: users.role,
        phone: users.phone, isActive: users.isActive, isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: count() }).from(users).where(isNull(users.deletedAt));
    res.json(paginatedResponse(allUsers, page, limit, countResult?.count || 0));
  });
}
