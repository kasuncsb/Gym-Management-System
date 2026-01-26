// Member Controller
import { Request, Response } from 'express';
import { MemberService } from '../services/member.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse, paginatedResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

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

    // Get member statistics (admin only)
    static getStats = asyncHandler(async (_req: Request, res: Response) => {
        const stats = await MemberService.getMemberStats();
        res.json(successResponse(stats, 'Statistics retrieved'));
    });
}
