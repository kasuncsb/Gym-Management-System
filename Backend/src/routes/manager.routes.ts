// Manager Routes
import { Router } from 'express';
import { ManagerController } from '../controllers/manager.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require manager role
router.use(authenticate);
router.use(requireRole('manager'));

// Manager metrics (business focus)
router.get('/metrics', ManagerController.getMetrics);

// Branch members
router.get('/members', ManagerController.getBranchMembers);

// Staff management
router.get('/staff', ManagerController.getStaffList);

export default router;
