// Subscription Controller — Phase 1
import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members } from '../db/schema';
import { eq } from 'drizzle-orm';

export class SubscriptionController {
  /** Validate subscription (member self or admin lookup) */
  static validateSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    let memberId = req.params.memberId as string;
    if (!memberId) {
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, req.user!.userId)).limit(1);
      memberId = m?.id;
    }
    const result = await SubscriptionService.validateSubscription(memberId);
    res.json(successResponse(result, result.valid ? 'Subscription valid' : result.reason || 'Subscription invalid'));
  });

  /** Get member subscriptions */
  static getMemberSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    let memberId = req.params.memberId as string;
    if (!memberId) {
      const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, req.user!.userId)).limit(1);
      memberId = m?.id;
    }
    const subs = await SubscriptionService.getMemberSubscriptions(memberId);
    res.json(successResponse(subs, 'Subscriptions retrieved'));
  });

  /** Get active subscription (self) */
  static getActiveSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, req.user!.userId)).limit(1);
    const sub = await SubscriptionService.getActiveSubscription(m?.id);
    res.json(successResponse(sub, 'Active subscription retrieved'));
  });

  /** Get all plans (public) */
  static getAllPlans = asyncHandler(async (_req: Request, res: Response) => {
    const plans = await SubscriptionService.getAllPlans();
    res.json(successResponse(plans, 'Plans retrieved'));
  });

  /** Get plan by ID */
  static getPlanById = asyncHandler(async (req: Request, res: Response) => {
    const plan = await SubscriptionService.getPlanById(req.params.id as string);
    res.json(successResponse(plan, 'Plan retrieved'));
  });

  /** Upcoming renewals (admin) */
  static getUpcomingRenewals = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const renewals = await SubscriptionService.checkUpcomingRenewals(days);
    res.json(successResponse(renewals, 'Upcoming renewals retrieved'));
  });
}
