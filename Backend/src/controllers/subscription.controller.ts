// Subscription Controller - UC-02, UC-05
import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';

export class SubscriptionController {
    // UC-02: Validate member subscription
    static validateSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.params.memberId || req.user!.id;
        const result = await SubscriptionService.validateSubscription(memberId);
        res.json(successResponse(result, result.valid ? 'Subscription valid' : result.reason || 'Subscription invalid'));
    });

    // Get member's subscriptions
    static getMemberSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.params.memberId || req.user!.id;
        const subscriptions = await SubscriptionService.getMemberSubscriptions(memberId);
        res.json(successResponse(subscriptions, 'Subscriptions retrieved'));
    });

    // Get active subscription
    static getActiveSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
        const memberId = req.user!.id;
        const subscription = await SubscriptionService.getActiveSubscription(memberId);
        res.json(successResponse(subscription, 'Active subscription retrieved'));
    });

    // Get all subscription plans
    static getAllPlans = asyncHandler(async (_req: Request, res: Response) => {
        const plans = await SubscriptionService.getAllPlans();
        res.json(successResponse(plans, 'Plans retrieved'));
    });

    // Get plan by ID
    static getPlanById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as { id: string };
        const plan = await SubscriptionService.getPlanById(id);
        res.json(successResponse(plan, 'Plan retrieved'));
    });

    // Check upcoming renewals (admin)
    static getUpcomingRenewals = asyncHandler(async (req: Request, res: Response) => {
        const days = parseInt(req.query.days as string) || 7;
        const renewals = await SubscriptionService.checkUpcomingRenewals(days);
        res.json(successResponse(renewals, 'Upcoming renewals retrieved'));
    });
}
