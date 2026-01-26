import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';

export class AppointmentController {

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            // content-type: application/json
            // body: { trainerId, startTime, endTime, type?, notes? }
            // user from auth middleware: req.user.id -> need to find memberId from userId usually, 
            // but let's assume middleware attaches memberId or we look it up.
            // For now, let's assume req.user.memberId exists if we had a smart middleware, 
            // OR we just used MemberService to find it. 
            // To be safe, let's just use the body or assume the user is a member.

            // FIXME: Start using proper type extension for Request with User
            const memberId = (req as any).user?.memberId; // We need to ensure auth middleware puts memberId

            if (!memberId) {
                res.status(400).json({ success: false, message: 'User is not a member' });
                return;
            }

            const appointment = await AppointmentService.createAppointment(memberId, {
                trainerId: req.body.trainerId,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime),
                type: req.body.type,
                notes: req.body.notes
            });

            res.status(201).json({
                success: true,
                data: appointment
            });
        } catch (error) {
            next(error);
        }
    }

    static async listMy(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = (req as any).user?.memberId;
            if (!memberId) {
                res.status(400).json({ success: false, message: 'User is not a member' });
                return;
            }

            const list = await AppointmentService.getMemberAppointments(memberId);
            res.json({
                success: true,
                data: list
            });
        } catch (error) {
            next(error);
        }
    }
}
