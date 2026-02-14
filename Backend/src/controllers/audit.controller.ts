// Audit Controller — Phase 3
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export class AuditController {
  static async queryLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuditService.query({
        actorId: req.query.actorId as string,
        action: req.query.action as string,
        targetType: req.query.targetType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.json({ success: true, data: data.rows, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
    } catch (error) { next(error); }
  }

  static async getActions(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuditService.getDistinctActions();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getTargetTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuditService.getDistinctTargetTypes();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuditService.exportLogs({
        actorId: req.query.actorId as string,
        action: req.query.action as string,
        targetType: req.query.targetType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
