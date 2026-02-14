// Inventory Controller — Phase 3
import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AuthRequest } from '../middleware/auth.middleware';

const DEFAULT_BRANCH = 'branch-colombo-001';

export class InventoryController {
  static async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.addItem({ ...req.body, branchId: req.body.branchId || DEFAULT_BRANCH });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = (req.query.branchId as string) || DEFAULT_BRANCH;
      const category = req.query.category as string | undefined;
      const data = await InventoryService.listItems(branchId, category);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getItemById(req.params.itemId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.updateItem(req.params.itemId as string, req.body);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async deactivateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.deactivateItem(req.params.itemId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async recordTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.recordTransaction({
        ...req.body,
        recordedBy: req.user!.userId,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async recordSale(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.recordSale({
        itemId: req.params.itemId as string,
        quantity: req.body.quantity,
        memberId: req.body.memberId,
        recordedBy: req.user!.userId,
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async restock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.restock({
        itemId: req.params.itemId as string,
        quantity: req.body.quantity,
        recordedBy: req.user!.userId,
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await InventoryService.getTransactionHistory(req.params.itemId as string, limit);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = (req.query.branchId as string) || DEFAULT_BRANCH;
      const data = await InventoryService.getLowStockItems(branchId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = (req.query.branchId as string) || DEFAULT_BRANCH;
      const data = await InventoryService.getCategories(branchId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  static async getInventoryValue(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = (req.query.branchId as string) || DEFAULT_BRANCH;
      const data = await InventoryService.getInventoryValue(branchId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}
