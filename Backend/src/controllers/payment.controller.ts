// Payment Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PaymentController {
  /** Record a payment (Staff/Manager/Admin) */
  static async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.recordPayment({
        ...req.body,
        recordedBy: req.user!.userId,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get payments for a member */
  static async getMemberPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await PaymentService.getMemberPayments(req.params.memberId as string, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get all payments (admin/manager) */
  static async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { rows, total } = await PaymentService.getAllPayments(
        page,
        limit,
        req.query.startDate as string,
        req.query.endDate as string,
      );
      res.json({
        success: true,
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) { next(error); }
  }

  /** Record a refund */
  static async recordRefund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.recordRefund(req.params.paymentId as string, req.body.reason);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Today's revenue */
  static async getTodayRevenue(_req: Request, res: Response, next: NextFunction) {
    try {
      const total = await PaymentService.getTodayRevenue();
      res.json({ success: true, data: { todayRevenue: total } });
    } catch (error) { next(error); }
  }
}
