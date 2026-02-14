// Shift Routes — Phase 2
import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Staff self-service
router.get('/my', ShiftController.getMyShifts);

// Manager/Admin
router.post('/', requireRole('manager', 'admin'), ShiftController.createShift);
router.get('/branch', requireRole('manager', 'admin'), ShiftController.getBranchSchedules);
router.get('/staff/:staffId', requireRole('manager', 'admin'), ShiftController.getStaffShifts);
router.patch('/:shiftId', requireRole('manager', 'admin'), ShiftController.updateShift);
router.delete('/:shiftId', requireRole('manager', 'admin'), ShiftController.deactivateShift);

// Overrides
router.post('/overrides', requireRole('staff', 'manager', 'admin'), ShiftController.createOverride);
router.get('/overrides/:staffId', requireRole('manager', 'admin'), ShiftController.getOverrides);

export default router;
