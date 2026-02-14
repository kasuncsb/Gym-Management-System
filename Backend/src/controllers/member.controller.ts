// Member Controller — Phase 1
import { Request, Response } from 'express';
import { MemberService } from '../services/member.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse, paginatedResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members } from '../db/schema';
import { eq } from 'drizzle-orm';
import { DocumentService } from '../services/document.service';

export class MemberController {
  /** Self-register */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone, dateOfBirth, emergencyContactName, emergencyContactPhone } = req.body;
    const member = await MemberService.createMember({
      name, email, password, phone,
      dateOfBirth: dateOfBirth ?? undefined,
      emergencyContactName, emergencyContactPhone,
    });
    res.status(201).json(successResponse(member, 'Registration successful'));
  });

  /** Get profile — self (uses userId → memberId lookup) or by ID for admin */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.params.id) {
      // Admin looking up by member ID
      const member = await MemberService.getMemberById(req.params.id as string);
      return void res.json(successResponse(member, 'Profile retrieved'));
    }
    // Self — look up by userId
    const member = await MemberService.getMemberByUserId(req.user!.userId);
    res.json(successResponse(member, 'Profile retrieved'));
  });

  /** Update profile */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    let memberId = req.params.id as string;
    if (!memberId) {
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, req.user!.userId)).limit(1);
      memberId = m?.id;
    }
    const member = await MemberService.updateMember(memberId, req.body);
    res.json(successResponse(member, 'Profile updated'));
  });

  /** List all members (admin/manager) */
  static getAllMembers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const result = await MemberService.getAllMembers(page, limit, status);
    res.json(paginatedResponse(result.members, page, limit, result.pagination.total));
  });

  /** Search */
  static searchMembers = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const results = await MemberService.searchMembers(query || '');
    res.json(successResponse(results, 'Search results'));
  });

  /** Update status (admin) */
  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const member = await MemberService.updateMemberStatus(req.params.id as string, req.body.status);
    res.json(successResponse(member, 'Status updated'));
  });

  /** Delete (admin) */
  static deleteMember = asyncHandler(async (req: Request, res: Response) => {
    await MemberService.deleteMember(req.params.id as string);
    res.json(successResponse(null, 'Member deleted'));
  });

  /** Upload identity document */
  static uploadDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
    const [member] = await db.select().from(members).where(eq(members.userId, req.user!.userId)).limit(1);
    if (!member) return void res.status(404).json({ success: false, message: 'Member profile not found' });

    const { documentType, storageKey, originalFilename, mimeType, fileSizeBytes } = req.body;
    await DocumentService.createDocument({
      memberId: member.id, documentType, storageKey, originalFilename, mimeType, fileSizeBytes,
    });

    // Mark member as incomplete until docs are verified
    if (member.status === 'incomplete') {
      // no change needed — stays incomplete
    }

    res.json(successResponse(null, 'Document uploaded successfully'));
  });

  /** Stats (admin) */
  static getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await MemberService.getMemberStats();
    res.json(successResponse(stats, 'Statistics retrieved'));
  });
}
