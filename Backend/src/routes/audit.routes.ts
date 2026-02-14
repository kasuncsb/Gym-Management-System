// Audit Routes — Phase 3
import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', AuditController.queryLogs);
router.get('/actions', AuditController.getActions);
router.get('/target-types', AuditController.getTargetTypes);
router.get('/export', AuditController.exportLogs);

export default router;
