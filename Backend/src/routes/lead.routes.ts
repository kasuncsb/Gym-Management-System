import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('staff', 'manager', 'admin'), LeadController.list);
router.post('/', requireRole('staff', 'manager', 'admin'), LeadController.create);
router.patch('/:leadId/status', requireRole('staff', 'manager', 'admin'), LeadController.updateStatus);

export default router;
