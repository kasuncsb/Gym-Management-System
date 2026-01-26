import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service';

export class LeadController {

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await LeadService.listLeads();
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await LeadService.createLead(req.body);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { leadId } = req.params;
            const { status, notes } = req.body;
            const data = await LeadService.updateStatus(leadId as string, status, notes);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }
}
