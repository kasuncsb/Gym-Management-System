import { Request, Response, NextFunction } from 'express';
import { EquipmentService } from '../services/equipment.service';

export class EquipmentController {

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { branchId } = req.query;
            const data = await EquipmentService.listEquipment(branchId as string);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await EquipmentService.addEquipment(req.body);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }

    static async logMaintenance(req: Request, res: Response, next: NextFunction) {
        try {
            const { equipmentId } = req.params;
            const data = await EquipmentService.logMaintenance(equipmentId as string, req.body);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }
}
