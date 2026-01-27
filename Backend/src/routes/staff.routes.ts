// Staff Routes
import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require staff role
router.use(authenticate);
router.use(requireRole('staff'));

// Staff metrics (operational focus)
router.get('/metrics', StaffController.getMetrics);

// Today's check-ins
router.get('/checkins/today', StaffController.getTodayCheckIns);

// Equipment status
router.get('/equipment', StaffController.getEquipmentStatus);
router.post('/equipment/:id/report', StaffController.reportEquipmentIssue);

export default router;
