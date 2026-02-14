// Reporting Controller — Phase 3
import { Request, Response, NextFunction } from 'express';
import { ReportingService } from '../services/reporting.service';

export class ReportingController {
  static async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const data = await ReportingService.getRevenueReport(year, month);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getRetentionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const data = await ReportingService.getRetentionReport(year, month);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getAttendanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const data = await ReportingService.getAttendanceReport(year, month);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getEquipmentCostReport(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const data = await ReportingService.getEquipmentCostReport(year, month);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getPlanPopularity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportingService.getPlanPopularityReport();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getMonthlySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      const data = await ReportingService.getMonthlySummary(year, month);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
