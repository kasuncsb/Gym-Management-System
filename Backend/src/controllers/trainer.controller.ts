// Trainer Controller — Phase 2
import { Request, Response, NextFunction } from 'express';
import { TrainerService } from '../services/trainer.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class TrainerController {
  /** List all trainers */
  static async listTrainers(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TrainerService.listTrainers();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get trainer by ID */
  static async getTrainer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TrainerService.getTrainerById(req.params.trainerId as string);
      if (!data) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trainer not found' } });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get trainer's availability */
  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { trainerId } = req.params;
      const startDate = (req.query.startDate as string) || new Date().toISOString().slice(0, 10);
      const endDate = (req.query.endDate as string) || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const data = await TrainerService.getAvailability(trainerId as string, startDate, endDate);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Set availability (trainer themselves) */
  static async setAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trainer = await TrainerService.getTrainerByUserId(req.user!.userId);
      if (!trainer) return void res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a trainer' } });
      const data = await TrainerService.setAvailability(trainer.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Remove availability slot */
  static async removeAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await TrainerService.removeAvailability(req.params.slotId as string);
      res.json({ success: true, message: 'Availability removed' });
    } catch (error) { next(error); }
  }

  /** Get assigned members (trainer) */
  static async getAssignedMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trainer = await TrainerService.getTrainerByUserId(req.user!.userId);
      if (!trainer) return void res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a trainer' } });
      const data = await TrainerService.getAssignedMembers(trainer.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Book a session (member) */
  static async bookSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await TrainerService.bookSession(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get trainer sessions */
  static async getTrainerSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trainer = await TrainerService.getTrainerByUserId(req.user!.userId);
      if (!trainer) return void res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a trainer' } });
      const data = await TrainerService.getTrainerSessions(trainer.id);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get member sessions */
  static async getMemberSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await TrainerService.getMemberSessions(req.params.memberId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Update session status */
  static async updateSessionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      await TrainerService.updateSessionStatus(req.params.sessionId as string, status, reason);
      res.json({ success: true, message: 'Session updated' });
    } catch (error) { next(error); }
  }

  /** Add session notes */
  static async addSessionNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trainer = await TrainerService.getTrainerByUserId(req.user!.userId);
      if (!trainer) return void res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not a trainer' } });
      const data = await TrainerService.addSessionNotes({
        sessionId: req.params.sessionId as string,
        trainerId: trainer.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  /** Get session notes */
  static async getSessionNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TrainerService.getSessionNotes(req.params.sessionId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
