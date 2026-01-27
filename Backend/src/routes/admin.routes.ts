// Admin Routes
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Document approval
router.get('/documents/pending', AdminController.getPendingDocuments);
router.put('/documents/:id/approve', AdminController.approveDocument);
router.put('/documents/:id/reject', AdminController.rejectDocument);

// Admin metrics (technical focus)
router.get('/metrics', AdminController.getMetrics);

// User management
router.get('/users', AdminController.getAllUsers);

export default router;
