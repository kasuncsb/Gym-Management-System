import { Router } from 'express';
import { EquipmentController } from '../controllers/equipment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('staff', 'manager', 'admin'), EquipmentController.list);
router.post('/', requireRole('manager', 'admin'), EquipmentController.create);
router.post('/:equipmentId/maintenance', requireRole('staff', 'manager', 'admin'), EquipmentController.logMaintenance);

export default router;
