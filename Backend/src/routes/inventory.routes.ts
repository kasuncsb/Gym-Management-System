// Inventory Routes — Phase 3
import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// All staff+ can view
router.get('/', requireRole('staff', 'manager', 'admin'), InventoryController.listItems);
router.get('/low-stock', requireRole('manager', 'admin'), InventoryController.getLowStock);
router.get('/categories', requireRole('staff', 'manager', 'admin'), InventoryController.getCategories);
router.get('/value', requireRole('manager', 'admin'), InventoryController.getInventoryValue);
router.get('/:itemId', requireRole('staff', 'manager', 'admin'), InventoryController.getItem);
router.get('/:itemId/transactions', requireRole('manager', 'admin'), InventoryController.getTransactionHistory);

// Manager/Admin can modify
router.post('/', requireRole('manager', 'admin'), InventoryController.addItem);
router.put('/:itemId', requireRole('manager', 'admin'), InventoryController.updateItem);
router.delete('/:itemId', requireRole('manager', 'admin'), InventoryController.deactivateItem);

// Stock operations
router.post('/transaction', requireRole('staff', 'manager', 'admin'), InventoryController.recordTransaction);
router.post('/:itemId/sale', requireRole('staff', 'manager', 'admin'), InventoryController.recordSale);
router.post('/:itemId/restock', requireRole('manager', 'admin'), InventoryController.restock);

export default router;
