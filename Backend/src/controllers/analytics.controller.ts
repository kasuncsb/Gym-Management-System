// Analytics Controller — Phase 3
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  static async getMemberGrowth(req: Request, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const data = await AnalyticsService.getMemberGrowthTrend(months);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getRevenueTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const data = await AnalyticsService.getRevenueTrend(months);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getAttendanceHeatmap(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const data = await AnalyticsService.getAttendanceHeatmap(days);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getChurnTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await AnalyticsService.getChurnTrend(months);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getCurrentOccupancy(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getCurrentOccupancy();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getDailyVisits(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await AnalyticsService.getDailyVisits(days);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getEquipmentUtilization(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getEquipmentUtilization();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getSubscriptionDistribution(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getSubscriptionDistribution();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getTopMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await AnalyticsService.getTopMembersByVisits(days, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
