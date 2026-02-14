// Workout Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { WorkoutService } from '../services/workout.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members } from '../db/schema';
import { eq } from 'drizzle-orm';

export class WorkoutController {
  /** Get member's active plans */
  static async getMyPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [member] = await db.select({ id: members.id }).from(members).where(eq(members.userId, req.user!.userId)).limit(1);
      if (!member) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
      const data = await WorkoutService.getMemberPlans(member.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get curated library */
  static async getLibrary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WorkoutService.getCuratedLibrary();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get plan by ID with exercises */
  static async getPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await WorkoutService.getPlanById(req.params.planId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Create plan (trainer/admin) */
  static async createPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await WorkoutService.createPlan({
        ...req.body,
        trainerId: req.body.trainerId ?? null,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Generate AI plan */
  static async generateAIPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const memberId = req.body.memberId || await getMemberIdFromUser(req.user!.userId);
      if (!memberId) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

      const data = await WorkoutService.generateAIPlan(memberId, req.body.trainerId);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Assign a curated plan to a member */
  static async assignLibraryPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { planId, memberId } = req.body;
      const data = await WorkoutService.assignCuratedPlan(planId, memberId, req.body.trainerId);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Deactivate a plan */
  static async deactivatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      await WorkoutService.deactivatePlan(req.params.planId as string);
      res.json({ success: true, message: 'Plan deactivated' });
    } catch (error) { next(error); }
  }

  /** Log a workout */
  static async logWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const memberId = await getMemberIdFromUser(req.user!.userId);
      if (!memberId) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

      const data = await WorkoutService.logWorkout({
        memberId,
        ...req.body,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get workout history */
  static async getWorkoutHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const memberId = req.params.memberId as string || await getMemberIdFromUser(req.user!.userId);
      if (!memberId) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });

      const limit = parseInt(req.query.limit as string) || 30;
      const data = await WorkoutService.getWorkoutHistory(memberId, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

async function getMemberIdFromUser(userId: string): Promise<string | null> {
  const [m] = await db.select({ id: members.id }).from(members).where(eq(members.userId, userId)).limit(1);
  return m?.id ?? null;
}
