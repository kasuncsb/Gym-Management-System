// Dashboard Routes
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes - require authentication
router.use(authenticate);

// Staff/Admin only routes (requireRole uses spread operator)
router.get('/stats', requireRole('admin', 'manager', 'staff'), DashboardController.getStats);
router.get('/recent-signups', requireRole('admin', 'manager', 'staff'), DashboardController.getRecentSignups);

// Member routes (any authenticated user)
router.get('/member-stats', DashboardController.getMemberStats);

export default router;
