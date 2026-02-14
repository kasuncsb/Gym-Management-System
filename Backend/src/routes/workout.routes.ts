// Workout Routes — Phase 2
import { Router } from 'express';
import { WorkoutController } from '../controllers/workout.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Curated library (any authenticated)
router.get('/library', WorkoutController.getLibrary);

// Member plans
router.get('/my-plans', WorkoutController.getMyPlans);
router.get('/history', WorkoutController.getWorkoutHistory);
router.post('/log', WorkoutController.logWorkout);

// AI generation
router.post('/generate', WorkoutController.generateAIPlan);

// Trainer/admin plan management
router.post('/plans', requireRole('trainer', 'manager', 'admin'), WorkoutController.createPlan);
router.post('/plans/assign', requireRole('trainer', 'manager', 'admin'), WorkoutController.assignLibraryPlan);
router.get('/plans/:planId', WorkoutController.getPlan);
router.patch('/plans/:planId/deactivate', requireRole('trainer', 'manager', 'admin'), WorkoutController.deactivatePlan);

// Admin: member workout history
router.get('/member/:memberId/history', requireRole('trainer', 'manager', 'admin'), WorkoutController.getWorkoutHistory);

export default router;
