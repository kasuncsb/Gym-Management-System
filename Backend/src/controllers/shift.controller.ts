// Shift Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { staff } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ShiftController {
  /** Create a shift */
  static async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ShiftService.createShift(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get own shifts (staff) */
  static async getMyShifts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [s] = await db.select({ id: staff.id }).from(staff).where(eq(staff.userId, req.user!.userId)).limit(1);
      if (!s) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff profile not found' } });
      const data = await ShiftService.getStaffShifts(s.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get shifts for a specific staff member */
  static async getStaffShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ShiftService.getStaffShifts(req.params.staffId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get all staff schedules for a branch */
  static async getBranchSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      if (!branchId) return void res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'branchId required' } });
      const data = await ShiftService.getAllStaffSchedules(branchId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Update a shift */
  static async updateShift(req: Request, res: Response, next: NextFunction) {
    try {
      await ShiftService.updateShift(req.params.shiftId as string, req.body);
      res.json({ success: true, message: 'Shift updated' });
    } catch (error) { next(error); }
  }

  /** Deactivate a shift */
  static async deactivateShift(req: Request, res: Response, next: NextFunction) {
    try {
      await ShiftService.deactivateShift(req.params.shiftId as string);
      res.json({ success: true, message: 'Shift deactivated' });
    } catch (error) { next(error); }
  }

  /** Create override */
  static async createOverride(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ShiftService.createOverride({
        ...req.body,
        approvedBy: req.user!.role === 'manager' || req.user!.role === 'admin' ? req.user!.userId : undefined,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get overrides for staff */
  static async getOverrides(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ShiftService.getStaffOverrides(
        req.params.staffId as string,
        req.query.startDate as string,
        req.query.endDate as string,
      );
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
