// Trainer Routes — Phase 2
import { Router } from 'express';
import { TrainerController } from '../controllers/trainer.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Public trainer list & details
router.get('/', TrainerController.listTrainers);
router.get('/:trainerId', TrainerController.getTrainer);
router.get('/:trainerId/availability', TrainerController.getAvailability);

// Trainer self-service
router.post('/availability', requireRole('trainer'), TrainerController.setAvailability);
router.delete('/availability/:slotId', requireRole('trainer'), TrainerController.removeAvailability);
router.get('/my/members', requireRole('trainer'), TrainerController.getAssignedMembers);
router.get('/my/sessions', requireRole('trainer'), TrainerController.getTrainerSessions);

// Sessions
router.post('/sessions', TrainerController.bookSession);
router.get('/sessions/member/:memberId', requireRole('trainer', 'manager', 'admin'), TrainerController.getMemberSessions);
router.patch('/sessions/:sessionId/status', requireRole('trainer', 'manager', 'admin'), TrainerController.updateSessionStatus);
router.post('/sessions/:sessionId/notes', requireRole('trainer'), TrainerController.addSessionNotes);
router.get('/sessions/:sessionId/notes', TrainerController.getSessionNotes);

export default router;
