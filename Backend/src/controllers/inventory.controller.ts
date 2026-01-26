import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query.q as string;
            const data = await InventoryService.listProducts(query);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await InventoryService.createProduct(req.body);
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async adjustStock(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;
            const { change, reason } = req.body;
            const staffId = (req as any).user?.id; // Assuming staff is logged in

            const result = await InventoryService.adjustStock(productId as string, change, reason, staffId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
