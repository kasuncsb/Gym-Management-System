// Member Controller
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
    // Register new member
    static register = asyncHandler(async (req: Request, res: Response) => {
        const { name, email, password, phone, dateOfBirth, emergencyContact } = req.body;

        const member = await MemberService.createMember({
            name,
            email,
            password,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            emergencyContact
        });

        res.status(201).json(successResponse(member, 'Registration successful'));
    });

    // Get member profile (self or admin)
    static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.params.id || req.user!.id;
        const member = await MemberService.getMemberById(memberId);
        res.json(successResponse(member, 'Profile retrieved'));
    });

    // Update member profile
    static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.params.id || req.user!.id;
        const { name, phone, dateOfBirth, emergencyContact } = req.body;

        const member = await MemberService.updateMember(memberId, {
            name,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            emergencyContact
        });

        res.json(successResponse(member, 'Profile updated'));
    });

    // Get all members (admin only)
    static getAllMembers = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;

        const result = await MemberService.getAllMembers(page, limit, status);

        res.json(paginatedResponse(result.members, page, limit, result.pagination.total));
    });

    // Search members
    static searchMembers = asyncHandler(async (req: Request, res: Response) => {
        const query = req.query.q as string;
        const members = await MemberService.searchMembers(query);
        res.json(successResponse(members, 'Search results'));
    });

    // Update member status (admin only)
    static updateStatus = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as { id: string };
        const { status } = req.body;

        const member = await MemberService.updateMemberStatus(id, status as any);
        res.json(successResponse(member, 'Status updated'));
    });

    // Delete member (admin only)
    static deleteMember = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as { id: string };
        await MemberService.deleteMember(id);
        res.json(successResponse(null, 'Member deleted'));
    });

    static async uploadDocument(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { type, fileUrl } = req.body;

            // Get member ID from user ID
            const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);

            if (!member) {
                return res.status(404).json({ success: false, message: 'Member profile not found' });
            }

            await DocumentService.createDocument({
                memberId: member.id,
                type,
                fileUrl
            });

            // Update member status to pending verification if not already active
            if (member.status !== 'active') {
                await db.update(members)
                    .set({ status: 'pending' })
                    .where(eq(members.id, member.id));
            }

            return res.json({ success: true, message: 'Document uploaded successfully' });
        } catch (error) {
            console.error('Upload document error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Get member statistics (admin only)
    static getStats = asyncHandler(async (_req: Request, res: Response) => {
        const stats = await MemberService.getMemberStats();
        res.json(successResponse(stats, 'Statistics retrieved'));
    });
}
