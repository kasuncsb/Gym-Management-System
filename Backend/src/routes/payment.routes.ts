// Payment Routes — Phase 2
import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Staff/Manager/Admin
router.post('/', requireRole('staff', 'manager', 'admin'), PaymentController.recordPayment);
router.get('/all', requireRole('manager', 'admin'), PaymentController.getAllPayments);
router.get('/today-revenue', requireRole('staff', 'manager', 'admin'), PaymentController.getTodayRevenue);
router.post('/:paymentId/refund', requireRole('manager', 'admin'), PaymentController.recordRefund);
router.get('/member/:memberId', requireRole('staff', 'manager', 'admin'), PaymentController.getMemberPayments);

export default router;
