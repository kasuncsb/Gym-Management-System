import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Public (Staff) read
router.get('/products', requireRole('staff', 'manager', 'admin'), InventoryController.list);

// Admin/Manager write
router.post('/products', requireRole('manager', 'admin'), InventoryController.create);

// Stock adjustment
router.post('/products/:productId/stock', requireRole('staff', 'manager', 'admin'), InventoryController.adjustStock);

export default router;
