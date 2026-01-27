import { Request, Response } from 'express';
import { db } from '../config/database';
import { subscriptionPlans, branches, members, trainers, classSchedules, classes, equipment } from '../db/schema';
import { eq, sql, count, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response-formatter';
import { asyncHandler } from '../middleware/error-handler.middleware';

export class PublicController {
    // Get all active subscription plans
    static getSubscriptionPlans = asyncHandler(async (req: Request, res: Response) => {
        const plans = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.isActive, true));

        // Transform features JSON string to object if necessary
        // Drizzle handles JSON columns automatically in most cases, but good to verify
        res.json(successResponse(plans, 'Subscription plans retrieved successfully'));
    });

    // Get all active branches
    static getBranches = asyncHandler(async (req: Request, res: Response) => {
        const activeBranches = await db.select()
            .from(branches)
            .where(eq(branches.isActive, true));

        res.json(successResponse(activeBranches, 'Branches retrieved successfully'));
    });

    // Get landing page stats (Members, Locations, Trainers, Classes)
    static getLandingPageStats = asyncHandler(async (req: Request, res: Response) => {
        const [memberCount] = await db.select({ count: count() }).from(members);
        const [branchCount] = await db.select({ count: count() }).from(branches).where(eq(branches.isActive, true));
        const [trainerCount] = await db.select({ count: count() }).from(trainers);
        // Weekly classes estimate or count
        const [classCount] = await db.select({ count: count() }).from(classSchedules);

        const stats = {
            activeMembers: memberCount.count,
            locations: branchCount.count,
            expertTrainers: trainerCount.count,
            classesWeekly: classCount.count
        };

        res.json(successResponse(stats, 'Stats retrieved successfully'));
    });

    // Get featured trainers (top rated)
    static getFeaturedTrainers = asyncHandler(async (req: Request, res: Response) => {
        // Need to import users table for this to work
        const { users } = await import('../db/schema');

        const result = await db.select({
            id: trainers.id,
            name: users.fullName,
            specialization: trainers.specialization,
            bio: trainers.bio,
            rating: trainers.rating,
            avatarUrl: users.avatarUrl
        })
            .from(trainers)
            .innerJoin(users, eq(trainers.userId, users.id))
            .orderBy(desc(trainers.rating))
            .limit(4);

        res.json(successResponse(result, 'Featured trainers retrieved successfully'));
    });

    // Get Classes/Features list
    static getClasses = asyncHandler(async (req: Request, res: Response) => {
        const classTypes = await db.select().from(classes).limit(6);
        res.json(successResponse(classTypes, 'Classes retrieved successfully'));
    });
}
