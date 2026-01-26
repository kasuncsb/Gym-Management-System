import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require login
router.use(authenticate);

// POST /api/appointments - Book new
router.post('/', requireRole('member'), AppointmentController.create);

// GET /api/appointments/me - List my appointments
router.get('/me', requireRole('member'), AppointmentController.listMy);

export default router;
