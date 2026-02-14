// Equipment Controller — Phase 1
import { Request, Response, NextFunction } from 'express';
import { EquipmentService } from '../services/equipment.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class EquipmentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EquipmentService.listEquipment(req.query.branchId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EquipmentService.addEquipment(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async reportIssue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await EquipmentService.reportIssue({
        equipmentId: req.params.equipmentId,
        reportedBy: req.user!.userId,
        ...req.body,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async logMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EquipmentService.logMaintenance(req.params.equipmentId as string, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getOpenIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EquipmentService.getOpenIssues(req.query.branchId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
