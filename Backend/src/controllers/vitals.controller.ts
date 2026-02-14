// Vitals Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { VitalsService } from '../services/vitals.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members } from '../db/schema';
import { eq } from 'drizzle-orm';

export class VitalsController {
  /** Record new vitals */
  static async recordVitals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params;
      const data = await VitalsService.recordVitals({
        memberId: memberId as string,
        ...req.body,
        recordedBy: req.user!.userId,
        source: req.user!.role === 'trainer' ? 'trainer' : 'manual',
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Record own vitals (member) */
  static async recordOwnVitals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [member] = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, req.user!.userId))
        .limit(1);
      if (!member) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });

      const data = await VitalsService.recordVitals({
        memberId: member.id,
        ...req.body,
        recordedBy: req.user!.userId,
        source: 'manual',
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get vitals history */
  static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await VitalsService.getVitalsHistory(memberId as string, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get own vitals history (member) */
  static async getOwnHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [member] = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, req.user!.userId))
        .limit(1);
      if (!member) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member profile not found' } });

      const limit = parseInt(req.query.limit as string) || 50;
      const data = await VitalsService.getVitalsHistory(member.id, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get latest vitals */
  static async getLatest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params;
      const data = await VitalsService.getLatestVitals(memberId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get trend data within date range */
  static async getTrend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params;
      const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 86400000).toISOString());
      const endDate = new Date(req.query.endDate as string || new Date().toISOString());
      const data = await VitalsService.getVitalsTrend(memberId as string, startDate, endDate);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Complete onboarding */
  static async completeOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { memberId } = req.params;
      await VitalsService.completeOnboarding(memberId as string);
      res.json({ success: true, message: 'Onboarding completed' });
    } catch (error) { next(error); }
  }
}
