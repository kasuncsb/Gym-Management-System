// Public Controller — unauthenticated endpoints for landing page / registration
import { Request, Response } from 'express';
import { db } from '../config/database';
import { subscriptionPlans, branches, members, trainers, users, staff } from '../db/schema';
import { eq, count, desc, and, isNull, asc } from 'drizzle-orm';
import { successResponse } from '../utils/response-formatter';
import { asyncHandler } from '../middleware/error-handler.middleware';

export class PublicController {
  /** Active subscription plans ordered by sortOrder */
  static getSubscriptionPlans = asyncHandler(async (_req: Request, res: Response) => {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt)))
      .orderBy(asc(subscriptionPlans.sortOrder), asc(subscriptionPlans.price));

    res.json(successResponse(plans, 'Subscription plans retrieved'));
  });

  /** Active branches */
  static getBranches = asyncHandler(async (_req: Request, res: Response) => {
    const activeBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.isActive, true));

    res.json(successResponse(activeBranches, 'Branches retrieved'));
  });

  /** Landing page hero stats */
  static getLandingPageStats = asyncHandler(async (_req: Request, res: Response) => {
    const [memberCount] = await db.select({ count: count() }).from(members).where(eq(members.status, 'active'));
    const [branchCount] = await db.select({ count: count() }).from(branches).where(eq(branches.isActive, true));
    const [trainerCount] = await db.select({ count: count() }).from(trainers);
    const [staffCount] = await db.select({ count: count() }).from(staff);

    res.json(successResponse({
      activeMembers: memberCount.count,
      locations: branchCount.count,
      expertTrainers: trainerCount.count,
      totalStaff: staffCount.count,
    }, 'Stats retrieved'));
  });

  /** Featured trainers — top-rated */
  static getFeaturedTrainers = asyncHandler(async (_req: Request, res: Response) => {
    const result = await db
      .select({
        id: trainers.id,
        name: users.fullName,
        specialization: trainers.specialization,
        bio: trainers.bio,
        rating: trainers.rating,
        avatarUrl: users.avatarUrl,
      })
      .from(trainers)
      .innerJoin(staff, eq(trainers.staffId, staff.id))
      .innerJoin(users, eq(staff.userId, users.id))
      .orderBy(desc(trainers.rating))
      .limit(4);

    res.json(successResponse(result, 'Featured trainers retrieved'));
  });
}
